import os
import sys
import json
import uuid
import random
from dotenv import load_dotenv
from openai import OpenAI
from config.config import SYLLABUS
from templates import prompt_templates


load_dotenv()


groq_key = os.environ.get("GROQ_API_KEY")
hf_key = os.environ.get("huggingface_API_KEY")

if groq_key:
    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=groq_key,
    )
    DEFAULT_MODEL = "llama-3.3-70b-versatile"
    FALLBACK_MODEL = "llama-3.1-8b-instant"
    print("AI Client initialized using Groq (llama-3.3-70b-versatile).")
elif hf_key:
    client = OpenAI(
        base_url="https://router.huggingface.co/v1",
        api_key=hf_key,
    )
    DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct"
    FALLBACK_MODEL = "meta-llama/Llama-3.1-8B-Instruct"
    print("AI Client initialized using HuggingFace Router.")
else:
    print("Error: Neither GROQ_API_KEY nor huggingface_API_KEY environment variable is set. Please set one of them in a .env file.")
    sys.exit(1)

def generate_vtfr_question(subject: str, chapter: str, topic: str, grade: str, exclude_questions: list = None, num_alternate_questions: int = 3):
    
    exclude_instruction = ""
    if exclude_questions:
        exclude_instruction = (
            "\nCRITICAL: You MUST NOT generate a question that is identical or highly similar to any of these "
            "previously generated questions:\n"
            + "\n".join(f"- {q}" for q in exclude_questions)
            + "\nYou must choose a completely different mathematical expression or function."
        )

    system_prompt = prompt_templates.get_system_prompt(grade, subject, chapter, topic, exclude_instruction, num_alternate_questions)
    user_prompt = prompt_templates.get_user_prompt(grade, subject, chapter, topic, exclude_questions)

    print(f"Generating VTFR question for Grade: '{grade}', Subject: '{subject}', Chapter: '{chapter}', Topic: '{topic}'...")

    try:
       
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=6000
        )
        content = response.choices[0].message.content
        result = json.loads(content)
        _enforce_uuids(result)
        _shuffle_options(result)
        _warn_if_insufficient_alt_steps(result)
        return result

    except Exception as e:
        print(f"Primary model failed or error occurred: {e}")
        print(f"Attempting fallback model: {FALLBACK_MODEL}...")
        try:
            response = client.chat.completions.create(
                model=FALLBACK_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=6000
            )
            content = response.choices[0].message.content
            result = json.loads(content)
            _enforce_uuids(result)
            _shuffle_options(result)
            _warn_if_insufficient_alt_steps(result)
            return result
        except Exception as e_fallback:
            print(f"Fallback model also failed: {e_fallback}")
            raise e_fallback


def _enforce_uuids(data: dict):
    
    import re
    uuid4_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        re.IGNORECASE
    )

    def _fix(obj: dict, label: str):
        qid = obj.get("questionId", "")
        if not qid or not uuid4_pattern.match(str(qid)):
            new_id = str(uuid.uuid4())
            print(f"[UUID FIX] {label}: replaced '{qid}' → '{new_id}'")
            obj["questionId"] = new_id

    _fix(data, "main question")
    for i, alt in enumerate(data.get("alternateQuestions", [])):
        _fix(alt, f"alternateQuestions[{i}]")


def _shuffle_options(data: dict):
   
    def _shuffle_list(options: list):
        if not options:
            return
        random.shuffle(options)
        for idx, opt in enumerate(options, 1):
            opt["optionSequenceNo"] = idx

    
    _shuffle_list(data.get("optionsList", []))

    
    for step in data.get("solutionSteps", []):
        _shuffle_list(step.get("optionsList", []))

   
    for alt in data.get("alternateQuestions", []):
        _shuffle_list(alt.get("optionsList", []))
        for step in alt.get("solutionSteps", []):
            _shuffle_list(step.get("optionsList", []))


def _warn_if_insufficient_alt_steps(data: dict):
    
    alt_questions = data.get("alternateQuestions", [])
    for i, alt in enumerate(alt_questions):
        steps = alt.get("solutionSteps", [])
        if len(steps) < 2:
            print(
                f"[WARNING] alternateQuestions[{i}] has only {len(steps)} solutionStep(s). "
                f"Minimum required is 2. Question: '{alt.get('questionText', 'N/A')}'"
            )
        else:
            print(
                f"[OK] alternateQuestions[{i}] has {len(steps)} solutionStep(s). "
                f"Question: '{alt.get('questionText', 'N/A')}'"
            )

def get_topic_suggestions(subject: str, chapter: str):
   
    
    print(f"\nAsking AI for topic suggestions for Subject: '{subject}', Chapter: '{chapter}'...")
    system_prompt = (
        "You are an educational curriculum assistant. "
        "Given a subject and a chapter, suggest exactly 3 to 4 specific, distinct, and high-quality sub-topics "
        "suitable for creating Veriable Time Fixed Response (VTFR) educational questions. "
        "Return the output strictly in the following JSON format:\n"
        "{\n"
        '  "topics": ["Topic 1", "Topic 2", "Topic 3"]\n'
        "}"
    )
    user_prompt = f"Subject: {subject}\nChapter: {chapter}"
    
    try:
        response = client.chat.completions.create(
            model=FALLBACK_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=300
        )
        data = json.loads(response.choices[0].message.content)
        topics = data.get("topics", [])
        return topics[:4]  # Enforce maximum of 4 suggestions
    except Exception as e:
        print(f"Failed to get AI topic suggestions: {e}")
        return []


def prompt_suggested_topic(subject: str, chapter: str, suggestions: list):
    if not suggestions:
        return input("Enter Custom Topic Name: ").strip()
        
    print(f"\nSelect Topic for {chapter} (Suggested by AI):")
    for idx, topic in enumerate(suggestions, 1):
        print(f"  {idx}. {topic}")
    
    custom_key = str(len(suggestions) + 1)
    print(f"  {custom_key}. Custom Topic (Enter manually)")
    
    choice = input(f"Enter choice (1-{custom_key}): ").strip()
    if choice == custom_key:
        return input("Enter Custom Topic Name: ").strip()
        
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(suggestions):
            return suggestions[idx]
    except ValueError:
        pass
    print("Invalid choice, defaulting to first suggested topic.")
    return suggestions[0]


def get_unique_filename(directory, base_name, extension=".json"):
    counter = 1
    while True:
        filename = f"{base_name}_{counter}{extension}"
        filepath = os.path.join(directory, filename)
        if not os.path.exists(filepath):
            return filepath
        counter += 1


def select_from_syllabus():
    print("\n" + "="*50)
    print("      VTFR QUESTION GENERATOR SYLLABUS MENU")
    print("="*50)
    
    # 1. Select Subject
    print("\nSelect Subject:")
    for key, val in SYLLABUS.items():
        print(f"  {key}. {val['subject']}")
    print("  4. Custom Subject (Enter manually)")
    
    sub_choice = input("Enter choice (1-4): ").strip()
    
    if sub_choice == "4":
        subject = input("Enter Custom Subject Name: ").strip()
        chapter = input("Enter Custom Chapter Name: ").strip()
        suggestions = get_topic_suggestions(subject, chapter)
        topic = prompt_suggested_topic(subject, chapter, suggestions)
        print("\n" + "="*50)
        print(f"Selected Custom Syllabus: {subject} -> {chapter} -> {topic}")
        print("="*50 + "\n")
        return subject, chapter, topic
        
    if sub_choice not in SYLLABUS:
        print("Invalid choice, defaulting to Mathematics.")
        sub_choice = "1"
    
    sub_data = SYLLABUS[sub_choice]
    subject = sub_data["subject"]
    
    
    print(f"\nSelect Chapter for {subject}:")
    for key, val in sub_data["chapters"].items():
        print(f"  {key}. {val['chapter']}")
        
    chap_custom_key = str(len(sub_data["chapters"]) + 1)
    print(f"  {chap_custom_key}. Custom Chapter (Enter manually)")
    
    chap_choice = input(f"Enter choice (1-{chap_custom_key}): ").strip()
    
    if chap_choice == chap_custom_key:
        chapter = input("Enter Custom Chapter Name: ").strip()
        suggestions = get_topic_suggestions(subject, chapter)
        topic = prompt_suggested_topic(subject, chapter, suggestions)
        print("\n" + "="*50)
        print(f"Selected Syllabus: {subject} -> {chapter} -> {topic}")
        print("="*50 + "\n")
        return subject, chapter, topic


    if chap_choice not in sub_data["chapters"]:
        print("Invalid choice, defaulting to first chapter.")
        chap_choice = list(sub_data["chapters"].keys())[0]
        
    chap_data = sub_data["chapters"][chap_choice]
    chapter = chap_data["chapter"]
    
    
    print(f"\nSelect Topic for {chapter}:")
    for idx, topic_name in enumerate(chap_data["topics"], 1):
        print(f"  {idx}. {topic_name}")
        
    topic_custom_key = str(len(chap_data["topics"]) + 1)
    print(f"  {topic_custom_key}. Custom Topic (Enter manually)")
    
    topic_choice = input(f"Enter choice (1-{topic_custom_key}): ").strip()
    
    if topic_choice == topic_custom_key:
        topic = input("Enter Custom Topic Name: ").strip()
        print("\n" + "="*50)
        print(f"Selected Syllabus: {subject} -> {chapter} -> {topic}")
        print("="*50 + "\n")
        return subject, chapter, topic

    try:
        topic_idx = int(topic_choice) - 1
        if topic_idx < 0 or topic_idx >= len(chap_data["topics"]):
            raise ValueError
    except ValueError:
        print("Invalid choice, defaulting to first topic.")
        topic_idx = 0
        
    topic = chap_data["topics"][topic_idx]
    
    print("\n" + "="*50)
    print(f"Selected Syllabus: {subject} -> {chapter} -> {topic}")
    print("="*50 + "\n")
    return subject, chapter, topic


def select_grade():
    
    grades = [
        "Grade 1", "Grade 2", "Grade 3", "Grade 4",
        "Grade 5", "Grade 6", "Grade 7", "Grade 8",
        "Grade 9", "Grade 10", "Grade 11", "Grade 12",
        "College / University"
    ]

    print("\n" + "="*50)
    print("         SELECT GRADE LEVEL")
    print("="*50)
    for idx, g in enumerate(grades, 1):
        print(f"  {idx:2}. {g}")
    custom_key = len(grades) + 1
    print(f"  {custom_key:2}. Custom (Enter manually)")

    choice = input(f"\nEnter choice (1-{custom_key}): ").strip()

    if choice == str(custom_key):
        return input("Enter Custom Grade: ").strip()

    try:
        idx = int(choice) - 1
        if 0 <= idx < len(grades):
            grade = grades[idx]
            print(f"\nSelected Grade: {grade}")
            return grade
    except ValueError:
        pass

    print("Invalid choice, defaulting to Grade 10.")
    return "Grade 10"


def select_num_alternate_questions() -> int:
   
    print("\n" + "="*50)
    print("    NUMBER OF ALTERNATE QUESTIONS (1-5)")
    print("="*50)
    print("  Each alternate question is a simpler variant")
    print("  of the main question to scaffold learning.")
    print()
    choice = input("How many alternate questions? [default: 2, range: 1-5]: ").strip()

    if choice == "":
        print("No input — using default: 2 alternate questions.")
        return 2

    try:
        n = int(choice)
        if 1 <= n <= 5:
            print(f"Selected: {n} alternate question(s).")
            return n
        else:
            print(f"Value {n} is out of range. Defaulting to 3.")
            return 2
    except ValueError:
        print("Invalid input. Defaulting to .")
        return 2


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

    grade = select_grade()
    sub, chap, top = select_from_syllabus()
    num_alt = select_num_alternate_questions()
    
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
    exclude_list = []
    if os.path.isdir(output_dir):
        for filename in os.listdir(output_dir):
            if filename.endswith(".json"):
                try:
                    with open(os.path.join(output_dir, filename), "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if "questionText" in data:
                            exclude_list.append(data["questionText"])
                except Exception:
                    pass

    print(f"Loaded {len(exclude_list)} existing questions to exclude:")
    for eq in exclude_list:
        print(f"  - {eq}")

    max_retries = 3
    result = None
    for attempt in range(max_retries):
        try:
            result = generate_vtfr_question(sub, chap, top, grade=grade, exclude_questions=exclude_list, num_alternate_questions=num_alt)
            q_text = result.get("questionText", "")
            
            is_duplicate = False
            for eq in exclude_list:
                if q_text.strip().lower() == eq.strip().lower() or (q_text and q_text in eq) or (eq and eq in q_text):
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                break
            else:
                print(f"Attempt {attempt + 1}: Generated duplicate question ('{q_text}'). Retrying...")
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt == max_retries - 1:
                raise e

    try:
        if not result:
            raise Exception("Failed to generate a unique question after max retries")
            
        if "questionId" not in result or result["questionId"] == "UNIQUE_ID":
            result["questionId"] = str(uuid.uuid4())
            
        grade_slug = grade.lower().replace(' ', '_').replace('/', '_')
        base_filename = f"{grade_slug}_{sub.lower().replace(' ', '_')}_{top.lower().replace(' ', '_')}"
        os.makedirs(output_dir, exist_ok=True)
        filepath = get_unique_filename(output_dir, base_filename, ".json")
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
        
        print(f"Successfully saved generated question to {filepath}\n")
        print("Generated VTFR JSON Payload:")
        print(json.dumps(result, indent=2))
        print("-" * 40)
    except Exception as e:
        print(f"Failed to generate VTFR question for {sub} - {top}: {e}\n")


if __name__ == "__main__":
    main()
