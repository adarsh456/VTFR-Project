from pydantic import BaseModel, Field, model_validator, model_serializer
from typing import List, Literal, Optional
import uuid


def validate_options_list(options: List["Option"], context_label: str = "optionsList") -> List["Option"]:
    """
    Validates that:
    1. Exactly one option in the list has isCorrect=True.
    2. The correct option has a non-empty explanation.
    3. All false options do NOT contain an explanation.
    """
    if not options:
        raise ValueError(f"{context_label}: optionsList cannot be empty.")
    
    correct_options = [opt for opt in options if opt.isCorrect]
    if len(correct_options) == 0:
        raise ValueError(f"{context_label}: Correct option is missing explanation (no option with isCorrect=true found).")
    if len(correct_options) > 1:
        raise ValueError(f"{context_label}: Exactly one option must have isCorrect=True, found {len(correct_options)}.")
    
    for opt in options:
        if opt.isCorrect:
            if not opt.explanation or not opt.explanation.strip():
                raise ValueError(f"{context_label}: Correct option is missing explanation.")
        else:
            if opt.explanation is not None and opt.explanation.strip() != "":
                raise ValueError(f"{context_label}, Option {opt.optionSequenceNo}: False option must not contain explanation.")
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
                raise ValueError(f"Option {self.optionSequenceNo}: Correct option is missing explanation.")
        else:
            if self.explanation is not None and self.explanation.strip() != "":
                raise ValueError(f"Option {self.optionSequenceNo}: False option must not contain explanation.")
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
    calculationDraft: str = Field(description="Full step-by-step derivation of correct answer and distractors")
    optionsList: List[Option] = Field(description="Exactly 4 option objects")
    solutionSteps: List[SolutionStep] = Field(description="At least 2 solution steps for scaffolding")

    @model_validator(mode="after")
    def validate_alternate_options(self):
        validate_options_list(self.optionsList, "Alternate question")
        for step in self.solutionSteps:
            validate_options_list(step.optionsList, f"Alternate question, Step {step.stepSequenceNo}")
        return self


class Resource(BaseModel):
    title: str = Field(description="Title of the learning resource")
    searchQuery: Optional[str] = Field(default="", description="Working search query for the resource")
    url: Optional[str] = Field(default=None, description="Direct URL of the exact selected resource")


class RelatedContent(BaseModel):
    conceptSummary: str = Field(description="Clear 2-3 sentence concept refresher")
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
