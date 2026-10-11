from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..db.models import TestSession, StepAttempt, Question

def evaluate_step_submission(
    db: Session,
    session_id: str,
    step_sequence_no: int,
    selected_option_index: int
) -> Dict[str, Any]:
    """
    Core Adaptive Learning State Machine.
    Processes student step responses and determines branching path:
    - CORRECT -> Advance to Step N+1 or complete quiz session.
    - INCORRECT -> Return distractor explanation + remedial resources + unlock Alternate Question.
    """
    session = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not session:
        raise ValueError(f"Session with ID '{session_id}' not found.")

    if session.status == "completed":
        return {
            "status": "completed",
            "message": "This quiz session has already been completed.",
            "isCorrect": True
        }

    # Retrieve active question payload (Alternate Question if active, else main Question)
    question_payload = session.active_question_payload or session.question.json_payload

    solution_steps = question_payload.get("solutionSteps", [])
    if not solution_steps:
        raise ValueError("Question payload contains no solution steps.")

    # Find target step
    target_step = None
    for step in solution_steps:
        if step.get("stepSequenceNo") == step_sequence_no:
            target_step = step
            break

    if not target_step and step_sequence_no <= len(solution_steps):
        target_step = solution_steps[step_sequence_no - 1]

    if not target_step:
        raise ValueError(f"Step number {step_sequence_no} not found in solution steps.")

    options_list = target_step.get("optionsList", [])
    if selected_option_index < 1 or selected_option_index > len(options_list):
        raise ValueError(f"Invalid option index {selected_option_index}. Must be between 1 and {len(options_list)}.")

    selected_option = options_list[selected_option_index - 1]
    is_correct = selected_option.get("isCorrect", False)
    correct_option = next((opt for opt in options_list if opt.get("isCorrect")), None)

    # Log attempt in DB
    attempt = StepAttempt(
        session_id=session.id,
        step_sequence_no=step_sequence_no,
        selected_option_index=selected_option_index,
        is_correct=is_correct,
        misconception_category=f"Option_{selected_option_index}_Misconception" if not is_correct else None
    )
    db.add(attempt)

    if is_correct:
        next_step = step_sequence_no + 1
        total_steps = len(solution_steps)
        if next_step > total_steps:
            session.status = "completed"
            session.current_step = total_steps
        else:
            session.current_step = next_step
            session.status = "in_progress"

        db.commit()
        db.refresh(session)

        return {
            "isCorrect": True,
            "selectedOptionNo": selected_option_index,
            "explanation": correct_option.get("explanation") if correct_option else "Correct!",
            "currentStep": session.current_step,
            "totalSteps": len(solution_steps),
            "sessionStatus": session.status,
            "message": "Step completed successfully! Great job." if session.status != "completed" else "Congratulations! You completed all steps."
        }
    else:
        session.status = "remedial_active"
        db.commit()

        # Extract remedial content
        related_content = question_payload.get("relatedContent", {})

        # Select scaffolded alternate question if available
        alternate_questions = question_payload.get("alternateQuestions", [])
        alternate_question = alternate_questions[0] if alternate_questions else None

        explanation_msg = (
            f"That choice is incorrect. "
            f"{correct_option.get('explanation') if correct_option else 'Please review the concept summary below.'}"
        )

        return {
            "isCorrect": False,
            "selectedOptionNo": selected_option_index,
            "explanation": explanation_msg,
            "currentStep": step_sequence_no,
            "totalSteps": len(solution_steps),
            "sessionStatus": "remedial_active",
            "relatedContent": related_content,
            "alternateQuestion": alternate_question,
            "message": "Let's review the remedial material and try an alternate scaffolded question."
        }

def start_alternate_question_mode(db: Session, session_id: str, alt_question_payload: dict) -> Dict[str, Any]:
    """Switches an active session to an alternate scaffolded question."""
    session = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not session:
        raise ValueError(f"Session with ID '{session_id}' not found.")

    session.is_alternate = True
    session.active_question_payload = alt_question_payload
    session.current_step = 1
    session.status = "in_progress"

    db.commit()
    db.refresh(session)

    return {
        "status": "success",
        "sessionId": session.id,
        "isAlternate": True,
        "currentStep": 1,
        "questionPayload": alt_question_payload
    }
