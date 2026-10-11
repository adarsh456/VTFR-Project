import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default="student")  # 'student' or 'teacher'
    grade = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("TestSession", back_populates="user")

class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject = Column(String(100), nullable=False)
    chapter = Column(String(100), nullable=False)
    topic = Column(String(100), nullable=False)
    grade = Column(String(50), nullable=False)
    blooms_level = Column(String(50), nullable=True)
    difficulty = Column(String(50), nullable=True)
    question_text = Column(Text, nullable=False)
    json_payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("TestSession", back_populates="question")

class TestSession(Base):
    __tablename__ = "test_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=False)
    current_step = Column(Integer, default=1)
    status = Column(String(50), default="in_progress")  # 'in_progress', 'completed', 'remedial_active'
    is_alternate = Column(Boolean, default=False)
    active_question_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="sessions")
    question = relationship("Question", back_populates="sessions")
    attempts = relationship("StepAttempt", back_populates="session", cascade="all, delete-orphan")

class StepAttempt(Base):
    __tablename__ = "step_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("test_sessions.id"), nullable=False)
    step_sequence_no = Column(Integer, nullable=False)
    selected_option_index = Column(Integer, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    misconception_category = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("TestSession", back_populates="attempts")
