from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ...db import get_db, User, Question, TestSession, StepAttempt
from ...services.adaptive_engine import evaluate_step_submission, start_alternate_question_mode

router = APIRouter(prefix="/sessions", tags=["Quiz Sessions"])

class StartSessionRequest(BaseModel):
    question_id: str
    student_name: Optional[str] = "Default Student"
    student_grade: Optional[str] = "Grade 10"

class SubmitStepRequest(BaseModel):
    session_id: str
    step_sequence_no: int
    selected_option_index: int

class SwitchAlternateRequest(BaseModel):
    session_id: str
    alt_question_index: Optional[int] = 0

@router.post("/start")
def start_quiz_session(
    req: StartSessionRequest,
    db: Session = Depends(get_db)
):
    """Starts a new student problem-solving session for a given VTFR Question."""
    question = db.query(Question).filter(Question.id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Ensure a default student exists
    student = db.query(User).filter(User.name == req.student_name, User.role == "student").first()
    if not student:
        student = User(
            name=req.student_name,
            role="student",
            grade=req.student_grade or question.grade
        )
        db.add(student)
        db.commit()
        db.refresh(student)

    session = TestSession(
        student_id=student.id,
        question_id=question.id,
        current_step=1,
        status="in_progress",
        is_alternate=False
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "sessionId": session.id,
        "studentName": student.name,
        "questionId": question.id,
        "status": session.status,
        "currentStep": session.current_step,
        "question": question.json_payload
    }

@router.post("/submit-step")
def submit_step_choice(
    req: SubmitStepRequest,
    db: Session = Depends(get_db)
):
    """Processes option choice for a step and returns adaptive feedback & next path."""
    try:
        feedback = evaluate_step_submission(
            db=db,
            session_id=req.session_id,
            step_sequence_no=req.step_sequence_no,
            selected_option_index=req.selected_option_index
        )
        return feedback
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Step evaluation error: {str(e)}")

@router.post("/switch-alternate")
def switch_to_alternate_question(
    req: SwitchAlternateRequest,
    db: Session = Depends(get_db)
):
    """Switches active session to an alternate scaffolded question upon misconception."""
    session = db.query(TestSession).filter(TestSession.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    main_payload = session.question.json_payload
    alt_questions = main_payload.get("alternateQuestions", [])
    if not alt_questions:
        raise HTTPException(status_code=400, detail="No alternate questions available for this item.")

    index = req.alt_question_index if req.alt_question_index < len(alt_questions) else 0
    alt_payload = alt_questions[index]

    result = start_alternate_question_mode(db, req.session_id, alt_payload)
    return result

@router.get("/{session_id}")
def get_session_details(session_id: str, db: Session = Depends(get_db)):
    """Retrieves session state, attempts log, and active question payload."""
    session = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    attempts = db.query(StepAttempt).filter(StepAttempt.session_id == session.id).all()

    active_payload = session.active_question_payload or session.question.json_payload

    return {
        "sessionId": session.id,
        "studentId": session.student_id,
        "questionId": session.question_id,
        "currentStep": session.current_step,
        "status": session.status,
        "isAlternate": session.is_alternate,
        "activeQuestion": active_payload,
        "attempts": [
            {
                "id": a.id,
                "stepSequenceNo": a.step_sequence_no,
                "selectedOptionIndex": a.selected_option_index,
                "isCorrect": a.is_correct,
                "timestamp": a.timestamp.isoformat() if a.timestamp else None
            }
            for a in attempts
        ]
    }
