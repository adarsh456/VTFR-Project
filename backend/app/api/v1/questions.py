from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ...db import get_db, Question
from ...engine import generate_vtfr_question, SYLLABUS, GRADE_LIST, SUBJECT_LIST, GRADE_SYLLABUS

router = APIRouter(prefix="/questions", tags=["Questions"])

class GenerateQuestionRequest(BaseModel):
    grade: str
    subject: str
    chapter: str
    topic: str
    exclude_questions: Optional[List[str]] = None
    num_alternate_questions: Optional[int] = 3

@router.get("/syllabus")
def get_syllabus():
    """Returns available grade, subject, chapter, and topic hierarchy."""
    return {
        "syllabus": SYLLABUS,
        "grades": GRADE_LIST,
        "subjects": SUBJECT_LIST,
        "grade_syllabus": GRADE_SYLLABUS
    }

@router.post("/generate")
def generate_question_endpoint(
    req: GenerateQuestionRequest,
    db: Session = Depends(get_db)
):
    """
    Generates a production-grade VTFR Question using LangChain LCEL & Groq/LLM engine,
    validates via Pydantic schema, stores in SQLite/Postgres DB, and returns JSON.
    """
    try:
        vtfr_json = generate_vtfr_question(
            subject=req.subject,
            chapter=req.chapter,
            topic=req.topic,
            grade=req.grade,
            exclude_questions=req.exclude_questions,
            num_alternate_questions=req.num_alternate_questions or 3
        )

        if not vtfr_json or not isinstance(vtfr_json, dict):
            raise ValueError("Generator returned an empty or invalid question payload.")

        import uuid
        question_id = vtfr_json.get("questionId")
        if not question_id or db.query(Question).filter(Question.id == question_id).first():
            question_id = str(uuid.uuid4())
            vtfr_json["questionId"] = question_id

        blooms_level = vtfr_json.get("bloomsLevel", "Apply")
        difficulty_tag = vtfr_json.get("difficultyTag", "Medium")
        question_text = vtfr_json.get("questionText", "")

        db_question = Question(
            id=question_id,
            subject=req.subject,
            chapter=req.chapter,
            topic=req.topic,
            grade=req.grade,
            blooms_level=blooms_level,
            difficulty=difficulty_tag,
            question_text=question_text,
            json_payload=vtfr_json
        )
        db.add(db_question)
        db.commit()
        db.refresh(db_question)

        return {
            "status": "success",
            "message": "VTFR Question generated and saved successfully",
            "question": vtfr_json
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@router.get("")
def list_questions(
    grade: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    chapter: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Lists saved questions with optional category filtering."""
    query = db.query(Question)
    if grade:
        query = query.filter(Question.grade == grade)
    if subject:
        query = query.filter(Question.subject == subject)
    if chapter:
        query = query.filter(Question.chapter == chapter)
    if topic:
        query = query.filter(Question.topic == topic)

    questions = query.order_by(Question.created_at.desc()).limit(limit).all()

    return {
        "count": len(questions),
        "questions": [
            {
                "id": q.id,
                "grade": q.grade,
                "subject": q.subject,
                "chapter": q.chapter,
                "topic": q.topic,
                "bloomsLevel": q.blooms_level,
                "difficulty": q.difficulty,
                "questionText": q.question_text,
                "createdAt": q.created_at.isoformat() if q.created_at else None
            }
            for q in questions
        ]
    }

@router.get("/samples")
def list_sample_generated_questions():
    """Lists pre-generated VTFR question JSON files from the generated_question directory."""
    import os
    import json
    gen_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "generated_question"))
    if not os.path.exists(gen_dir):
        # Try local fallback
        gen_dir = os.path.abspath("generated_question")
    
    samples = []
    if os.path.exists(gen_dir):
        for fname in sorted(os.listdir(gen_dir)):
            if fname.endswith(".json"):
                fpath = os.path.join(gen_dir, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        samples.append({
                            "filename": fname,
                            "questionId": data.get("questionId"),
                            "grade": data.get("grade", "Grade 10"),
                            "subject": data.get("subject", "Mathematics"),
                            "chapter": data.get("chapter", ""),
                            "topic": data.get("topic", ""),
                            "difficulty": data.get("difficultyTag", "Medium"),
                            "bloomsLevel": data.get("bloomsLevel", "Apply"),
                            "questionText": data.get("questionText", "")[:120] + "..." if len(data.get("questionText", "")) > 120 else data.get("questionText", "")
                        })
                except Exception:
                    pass
    return {"count": len(samples), "samples": samples}

@router.get("/samples/{filename}")
def get_sample_generated_question(filename: str):
    """Returns the full JSON payload of a pre-generated VTFR question file."""
    import os
    import json
    gen_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "generated_question"))
    if not os.path.exists(gen_dir):
        gen_dir = os.path.abspath("generated_question")
        
    fpath = os.path.join(gen_dir, filename)
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail=f"Sample file {filename} not found")
        
    try:
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {"status": "success", "filename": filename, "question": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read sample file: {str(e)}")

@router.get("/{question_id}")
def get_question_by_id(question_id: str, db: Session = Depends(get_db)):
    """Fetches the complete VTFR JSON payload for a single question."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return {
        "id": q.id,
        "grade": q.grade,
        "subject": q.subject,
        "chapter": q.chapter,
        "topic": q.topic,
        "payload": q.json_payload
    }

@router.delete("/{question_id}")
def delete_question(question_id: str, db: Session = Depends(get_db)):
    """Deletes a question by ID from the database, or sample file if applicable."""
    from ...db.models import TestSession, StepAttempt
    try:
        # 1. Clean up associated test sessions and step attempts to avoid foreign key errors
        sessions = db.query(TestSession).filter(TestSession.question_id == question_id).all()
        for s in sessions:
            db.query(StepAttempt).filter(StepAttempt.session_id == s.id).delete()
            db.delete(s)

        # 2. Delete question from database if present
        q = db.query(Question).filter(Question.id == question_id).first()
        db_deleted = False
        if q:
            db.delete(q)
            db.commit()
            db_deleted = True
        else:
            db.commit()

        # 3. Clean up sample file if the question corresponds to one
        import os
        import json
        gen_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "generated_question"))
        if not os.path.exists(gen_dir):
            gen_dir = os.path.abspath("generated_question")

        file_deleted = False
        if os.path.exists(gen_dir):
            for fname in os.listdir(gen_dir):
                if fname.endswith(".json"):
                    fpath = os.path.join(gen_dir, fname)
                    try:
                        if question_id == f"sample-{fname}" or question_id == fname:
                            os.remove(fpath)
                            file_deleted = True
                            break
                        with open(fpath, "r", encoding="utf-8") as f:
                            data = json.load(f)
                        if data.get("questionId") == question_id:
                            os.remove(fpath)
                            file_deleted = True
                            break
                    except Exception:
                        pass

        return {
            "status": "success",
            "message": "Question deleted successfully",
            "question_id": question_id,
            "db_deleted": db_deleted,
            "file_deleted": file_deleted
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete question: {str(e)}")


@router.post("/generate-diagram")
def generate_diagram_endpoint(diagram_type: str = Query("function")):
    """Generates a parametric Matplotlib visual diagram for math/physics items."""
    try:
        from ...services.diagram_service import generate_function_graph_diagram, generate_geometry_triangle_diagram
        if diagram_type == "geometry":
            img_url = generate_geometry_triangle_diagram()
        else:
            img_url = generate_function_graph_diagram()
        return {
            "status": "success",
            "diagramUrl": img_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagram generation failed: {str(e)}")

@router.get("/concept-card-image")
def get_concept_card_image(
    filename: Optional[str] = Query(None),
    topic: Optional[str] = Query(None)
):
    """
    Returns the generated 5-panel concept card PNG image by filename or matching topic name.
    """
    import os
    import re
    from fastapi.responses import FileResponse

    # Try project root generated_question/concept_cards
    gen_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "generated_question", "concept_cards"))
    if not os.path.exists(gen_dir):
        gen_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "generated_question", "concept_cards"))
    if not os.path.exists(gen_dir):
        gen_dir = os.path.abspath("generated_question/concept_cards")

    target_file = None
    if filename:
        clean_name = os.path.basename(filename).strip("'\" ")
        candidate = os.path.join(gen_dir, clean_name)
        if os.path.exists(candidate):
            target_file = candidate

    if not target_file and topic:
        clean_topic = re.sub(r"[^\w\s-]", "", topic).strip().lower().replace(" ", "_")
        if os.path.exists(gen_dir):
            for f in os.listdir(gen_dir):
                if f.lower().endswith(".png"):
                    base_f = f.lower().replace("_concept_card.png", "")
                    if clean_topic in base_f or base_f in clean_topic or clean_topic[:6] in base_f:
                        target_file = os.path.join(gen_dir, f)
                        break

    if not target_file and os.path.exists(gen_dir):
        files = [f for f in os.listdir(gen_dir) if f.endswith(".png")]
        if files:
            target_file = os.path.join(gen_dir, sorted(files)[0])

    if target_file and os.path.exists(target_file):
        return FileResponse(target_file, media_type="image/png")

    raise HTTPException(status_code=404, detail="Concept card image not found")


