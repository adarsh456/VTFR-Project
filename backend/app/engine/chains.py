import json
import re
from langchain_core.runnables import RunnableLambda
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser
from . import prompts
from . import llm_factory
from .schemas import VTFRQuestion

# Initialize LLMs
model = llm_factory.get_llm()
suggestions_llm = llm_factory.get_suggestions_llm()

def make_vtfr_prompt(inputs: dict):
    grade = inputs["grade"]
    subject = inputs["subject"]
    chapter = inputs["chapter"]
    topic = inputs["topic"]
    exclude_instruction = inputs.get("exclude_instruction", "")
    num_alternate_questions = inputs.get("num_alternate_questions", 3)
    exclude_questions = inputs.get("exclude_questions", [])
    
    sys_text = prompts.get_system_prompt(
        grade, subject, chapter, topic, exclude_instruction, num_alternate_questions
    )
    user_text = prompts.get_user_prompt(
        grade, subject, chapter, topic, exclude_questions
    )
    
    return ChatPromptTemplate.from_messages([
        SystemMessage(content=sys_text),
        HumanMessage(content=user_text)
    ])

def make_suggestions_prompt(inputs: dict):
    subject = inputs["subject"]
    chapter = inputs["chapter"]
    
    system_prompt = (
        "You are an educational curriculum assistant. "
        "Given a subject and a chapter, suggest exactly 3 to 4 specific, distinct, and high-quality sub-topics "
        "suitable for creating Veriable Time Fixed Response (VTFR) educational questions. "
        "Return ONLY the raw JSON object. Do not include any introductory text, markdown formatting blocks (like ```json), or extra text.\n"
        "Format:\n"
        "{\n"
        '  "topics": ["Topic 1", "Topic 2", "Topic 3"]\n'
        "}"
    )
    user_prompt = f"Subject: {subject}\nChapter: {chapter}"
    
    return ChatPromptTemplate.from_messages([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ])

def robust_json_parser(response) -> dict:
    """
    Extracts JSON substring robustly from LLM response, stripping conversational preambles or markdown code fences,
    and repairing unescaped quotes, trailing commas, or delimiter issues.
    """
    if hasattr(response, "content"):
        content = response.content
    elif isinstance(response, str):
        content = response
    elif isinstance(response, dict):
        return response
    else:
        content = str(response)

    content = content.strip()

    # Strip markdown code blocks
    content = re.sub(r"^```json\s*", "", content, flags=re.MULTILINE)
    content = re.sub(r"^```\s*", "", content, flags=re.MULTILINE)
    content = re.sub(r"\s*```$", "", content, flags=re.MULTILINE)

    # Locate outermost JSON object {...}
    json_match = re.search(r"(\{.*\})", content, re.DOTALL)
    target_str = json_match.group(1) if json_match else content

    # Tier 1: Standard json.loads with strict=False (allows unescaped control chars)
    try:
        return json.loads(target_str, strict=False)
    except Exception:
        pass

    # Tier 2: json_repair (expertly repairs unescaped quotes in strings, missing commas, trailing commas)
    try:
        import json_repair
        repaired = json_repair.loads(target_str)
        if isinstance(repaired, dict) and repaired:
            return repaired
    except Exception:
        pass

    # Tier 3: Clean trailing commas
    try:
        cleaned = re.sub(r',\s*([\]}])', r'\1', target_str)
        return json.loads(cleaned, strict=False)
    except Exception:
        pass

    # Tier 4: json_repair on full content
    try:
        import json_repair
        repaired = json_repair.loads(content)
        if isinstance(repaired, dict) and repaired:
            return repaired
    except Exception:
        pass

    return json.loads(target_str, strict=False)

# Define the LangChain chains using LCEL
generate_vtfr_chain = RunnableLambda(make_vtfr_prompt) | model

suggest_topics_chain = RunnableLambda(make_suggestions_prompt) | suggestions_llm

def run_generate_vtfr_question(inputs: dict) -> dict:
    """
    Executes the generation chain, auto-heals any missing metadata or resources,
    and validates the output structure against VTFRQuestion schema.
    """
    raw_response = generate_vtfr_chain.invoke(inputs)
    raw_result = robust_json_parser(raw_response)

    # Pre-validation auto-healing for syllabus metadata and relatedContent
    if isinstance(raw_result, dict):
        for field in ["grade", "subject", "chapter", "topic"]:
            if not raw_result.get(field) and inputs.get(field):
                raw_result[field] = str(inputs[field])

        topic = raw_result.get("topic") or inputs.get("topic", "this topic")
        subj = raw_result.get("subject") or inputs.get("subject", "this subject")

        if not raw_result.get("relatedContent") or not isinstance(raw_result.get("relatedContent"), dict):
            raw_result["relatedContent"] = {
                "conceptSummary": f"Review foundational principles of {topic} in {subj} to understand step-by-step problem solving."
            }
        elif not raw_result["relatedContent"].get("conceptSummary"):
            raw_result["relatedContent"]["conceptSummary"] = f"Review foundational principles of {topic} in {subj} to understand step-by-step problem solving."

    # Parse and validate structure using Pydantic, then convert back to dict
    validated = VTFRQuestion.model_validate(raw_result)
    return validated.model_dump()

def run_suggest_topics(inputs: dict) -> dict:
    """
    Executes the suggestion chain and extracts JSON robustly.
    """
    try:
        response = suggest_topics_chain.invoke(inputs)
        return robust_json_parser(response)
    except Exception as e:
        print(f"Failed to get AI topic suggestions: {e}")
        return {}
