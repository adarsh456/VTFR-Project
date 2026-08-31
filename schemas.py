from pydantic import BaseModel, Field
from typing import List, Literal, Optional
import uuid

class Option(BaseModel):
    optionSequenceNo: int = Field(description="Sequence number starting from 1 to 4")
    optionText: str = Field(description="The text content of the option")
    isCorrect: bool = Field(description="True if this is the correct answer, False otherwise")

class SolutionStep(BaseModel):
    stepSequenceNo: int = Field(description="Step sequence number")
    stepText: str = Field(description="The guiding question for this step")
    optionsList: List[Option] = Field(description="Exactly 4 option objects")

class AlternateQuestion(BaseModel):
    questionId: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="A unique UUID v4 string for the alternate question"
    )
    questionType: str = Field(default="vtfr_adaptive_alternate", description="Must be 'vtfr_adaptive_alternate'")
    questionText: str = Field(description="The simplified alternate question text")
    calculationDraft: str = Field(description="Full step-by-step derivation of correct answer and distractors")
    optionsList: List[Option] = Field(description="Exactly 4 option objects")
    solutionSteps: List[SolutionStep] = Field(description="At least 2 solution steps for scaffolding")

class Resource(BaseModel):
    title: str = Field(description="Title of the learning resource")
    searchQuery: Optional[str] = Field(default="", description="Working search query for the resource")
    url: Optional[str] = Field(default=None, description="Direct URL of the exact selected resource")

class RelatedContent(BaseModel):
    conceptSummary: str = Field(description="Clear 2-3 sentence concept refresher")
    youtubeResource: Optional[Resource] = Field(default=None, description="Direct YouTube video")
    imageResource: Optional[Resource] = Field(default=None, description="Direct educational diagram image")
    pdfResource: Optional[Resource] = Field(default=None, description="Direct PDF document")
    webResource: Optional[Resource] = Field(default=None, description="Direct educational article")

class VTFRQuestion(BaseModel):
    questionId: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="A unique UUID v4 string for the main question"
    )
    questionType: str = Field(default="vtfr_adaptive", description="Must be 'vtfr_adaptive'")
    bloomsLevel: Literal["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"] = Field(
        description="Blooms level matching the cognitive demand of the question"
    )
    difficultyTag: Literal["Easy", "Medium", "Hard"] = Field(
        description="Difficulty level relative to the grade level"
    )
    grade: str = Field(description="The target grade level")
    subject: str = Field(description="Subject name")
    chapter: str = Field(description="Chapter name")
    topic: str = Field(description="Topic name")
    questionText: str = Field(description="The main question text")
    calculationDraft: str = Field(description="Full step-by-step derivation of correct answer and distractors")
    optionsList: List[Option] = Field(description="Exactly 4 option objects")
    solutionSteps: List[SolutionStep] = Field(description="Dynamic solution steps")
    alternateQuestions: List[AlternateQuestion] = Field(description="List of alternate questions")
    relatedContent: RelatedContent = Field(description="Related remedial content block")
