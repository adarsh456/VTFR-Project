from pydantic import BaseModel, Field, model_validator, model_serializer
from typing import List, Literal, Optional
import uuid


def validate_options_list(options: List["Option"], context_label: str = "optionsList") -> List["Option"]:
    """
    Validates and auto-repairs that:
    1. Exactly one option in the list has isCorrect=True.
    2. The correct option has a non-empty explanation.
    3. All false options do NOT contain an explanation.
    """
    if not options:
        raise ValueError(f"{context_label}: optionsList cannot be empty.")
    
    correct_options = [opt for opt in options if opt.isCorrect]
    if len(correct_options) == 0 and len(options) > 0:
        options[0].isCorrect = True
        if not options[0].explanation or not options[0].explanation.strip():
            options[0].explanation = f"Correct answer for {options[0].optionText}."
        correct_options = [options[0]]
    elif len(correct_options) > 1:
        for opt in correct_options[1:]:
            opt.isCorrect = False
            opt.explanation = None
    
    for opt in options:
        if opt.isCorrect:
            if not opt.explanation or not opt.explanation.strip():
                opt.explanation = f"Correct answer for {opt.optionText}."
        else:
            opt.explanation = None
    return options


class Option(BaseModel):
    optionSequenceNo: int = Field(description="Sequence number starting from 1 to 4")
    optionText: str = Field(description="The text content of the option")
    isCorrect: bool = Field(description="True if this is the correct answer, False otherwise")
    explanation: Optional[str] = Field(
        default=None,
        description="Concise 1-2 sentence educational explanation of WHY this option is correct. Present ONLY when isCorrect is True."
    )

    @model_validator(mode="after")
    def validate_option_explanation(self):
        if self.isCorrect:
            if not self.explanation or not self.explanation.strip():
                self.explanation = f"Correct option derivation and explanation."
        else:
            self.explanation = None
        return self

    @model_serializer(mode="wrap")
    def serialize_option(self, handler):
        data = handler(self)
        if not self.isCorrect or data.get("explanation") is None:
            data.pop("explanation", None)
        return data


class SolutionStep(BaseModel):
    stepSequenceNo: int = Field(description="Step sequence number")
    stepText: str = Field(description="The guiding question for this step")
    optionsList: List[Option] = Field(description="Exactly 4 option objects")

    @model_validator(mode="after")
    def validate_step_options(self):
        validate_options_list(self.optionsList, f"Step {self.stepSequenceNo}")
        return self


class AlternateQuestion(BaseModel):
    questionId: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="A unique UUID v4 string for the alternate question"
    )
    questionType: str = Field(default="vtfr_adaptive_alternate", description="Must be 'vtfr_adaptive_alternate'")
    questionText: str = Field(description="The simplified alternate question text")
    calculationDraft: str = Field(
        default="Step-by-step mathematical derivation of correct answer and distractors.",
        description="Full step-by-step derivation of correct answer and distractors"
    )
    optionsList: List[Option] = Field(description="Exactly 4 option objects")
    solutionSteps: List[SolutionStep] = Field(default_factory=list, description="At least 2 solution steps for scaffolding")

    @model_validator(mode="after")
    def validate_alternate_options(self):
        validate_options_list(self.optionsList, "Alternate question")
        for step in self.solutionSteps:
            validate_options_list(step.optionsList, f"Alternate question, Step {step.stepSequenceNo}")
        return self


class Resource(BaseModel):
    title: str = Field(default="", description="Title of the learning resource")
    searchQuery: Optional[str] = Field(default="", description="Working search query for the resource")
    url: Optional[str] = Field(default=None, description="Direct URL of the exact selected resource")


class RelatedContent(BaseModel):
    conceptSummary: str = Field(
        default="Review the foundational principles of this topic to understand step-by-step problem solving.",
        description="Clear 2-3 sentence concept refresher"
    )
    youtubeResource: Optional[Resource] = Field(default=None, description="Direct YouTube video")
    imageResource: Optional[Resource] = Field(default=None, description="Direct 5-Panel Educational Concept Card image PNG")
    pdfResource: Optional[Resource] = Field(default=None, description="Direct PDF document")
    webResource: Optional[Resource] = Field(default=None, description="Direct educational article")


class VTFRQuestion(BaseModel):
    questionId: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="A unique UUID v4 string for the main question"
    )
    questionType: str = Field(default="vtfr_adaptive", description="Must be 'vtfr_adaptive'")
    bloomsLevel: Literal["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"] = Field(
        default="Apply",
        description="Blooms level matching the cognitive demand of the question"
    )
    difficultyTag: Literal["Easy", "Medium", "Hard"] = Field(
        default="Medium",
        description="Difficulty level relative to the grade level"
    )
    grade: str = Field(default="", description="The target grade level")
    subject: str = Field(default="", description="Subject name")
    chapter: str = Field(default="", description="Chapter name")
    topic: str = Field(default="", description="Topic name")
    questionText: str = Field(description="The main question text")
    calculationDraft: str = Field(
        default="Step-by-step mathematical derivation of correct answer and distractors.",
        description="Full step-by-step derivation of correct answer and distractors"
    )
    optionsList: List[Option] = Field(description="Exactly 4 option objects")
    solutionSteps: List[SolutionStep] = Field(default_factory=list, description="Dynamic solution steps")
    alternateQuestions: List[AlternateQuestion] = Field(default_factory=list, description="List of alternate questions")
    relatedContent: Optional[RelatedContent] = Field(
        default_factory=RelatedContent,
        description="Related remedial content block"
    )

    @model_validator(mode="before")
    @classmethod
    def sanitize_input_payload(cls, data):
        if not isinstance(data, dict):
            return data
        
        # Ensure relatedContent is never None or missing
        if data.get("relatedContent") is None or not isinstance(data.get("relatedContent"), dict):
            data["relatedContent"] = {}
            
        # Ensure calculationDraft is provided
        if not data.get("calculationDraft"):
            data["calculationDraft"] = "Step-by-step mathematical derivation of correct answer and distractors."
            
        # Ensure bloomsLevel and difficultyTag have fallbacks
        valid_blooms = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]
        if data.get("bloomsLevel") not in valid_blooms:
            data["bloomsLevel"] = "Apply"
        valid_diff = ["Easy", "Medium", "Hard"]
        if data.get("difficultyTag") not in valid_diff:
            data["difficultyTag"] = "Medium"
            
        return data

    @model_validator(mode="after")
    def validate_all_question_options(self):
        validate_options_list(self.optionsList, "Main question")
        for step in self.solutionSteps:
            validate_options_list(step.optionsList, f"Step {step.stepSequenceNo}")
        for i, alt in enumerate(self.alternateQuestions, 1):
            validate_options_list(alt.optionsList, f"Alternate question {i}")
            for step in alt.solutionSteps:
                validate_options_list(step.optionsList, f"Alternate question {i}, Step {step.stepSequenceNo}")
        return self
