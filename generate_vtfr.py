import os
import sys
import json
import uuid
import random
from urllib.parse import quote_plus
from config import SYLLABUS
import chains
import resource_resolver

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

def generate_vtfr_question(subject: str, chapter: str, topic: str, grade: str, exclude_questions: list = None, num_alternate_questions: int = 3):

    exclude_instruction = ""
    if exclude_questions:
        exclude_instruction = (
            "\nCRITICAL: You MUST NOT generate a question that is identical or highly similar to any of these "
            "previously generated questions:\n"
            + "\n".join(f"- {q}" for q in exclude_questions)
            + "\nYou must choose a completely different mathematical expression or function."
        )

    print(f"Generating VTFR question for Grade: '{grade}', Subject: '{subject}', Chapter: '{chapter}', Topic: '{topic}'...")

    inputs = {
        "grade": grade,
        "subject": subject,
        "chapter": chapter,
        "topic": topic,
        "exclude_instruction": exclude_instruction,
        "num_alternate_questions": num_alternate_questions,
        "exclude_questions": exclude_questions or []
    }

    try:
        result = chains.run_generate_vtfr_question(inputs)
        _enforce_uuids(result)
        _shuffle_options(result)
        _enrich_related_content(result)
        _warn_if_insufficient_alt_steps(result)
        return result
    except Exception as e:
        print(f"VTFR question generation failed: {e}")
        raise e



def _enrich_related_content(data: dict):
    
    grade = data.get("grade", "")
    subject = data.get("subject", "")
    topic = data.get("topic", "")

    if "relatedContent" not in data or not isinstance(data["relatedContent"], dict):
        data["relatedContent"] = {}

    rel = data["relatedContent"]

    # 1. Concept Summary Fallback
    if "conceptSummary" not in rel or not rel["conceptSummary"]:
        rel["conceptSummary"] = f"Review the foundational principles of {topic} in {subject} to understand step-by-step problem solving."

    # 2. YouTube Resource (Exact direct video link)
    yt = rel.get("youtubeResource", {})
    yt_query = yt.get("searchQuery") or f"{grade} {subject} {topic} concept explanation tutorial"
    yt_url = resource_resolver.get_exact_youtube_url(yt_query, topic)
    rel["youtubeResource"] = {
        "title": yt.get("title") or f"{topic} Video Lesson",
        "searchQuery": yt_query,
        "url": yt_url
    }

    # 3. Image Resource (Exact direct diagram/image link)
    img = rel.get("imageResource", {})
    img_query = img.get("searchQuery") or f"{subject} {topic} definition formula types applications mindmap summary"
    img_url = resource_resolver.get_exact_image_url(img_query, topic, subject, grade)
    rel["imageResource"] = {
        "title": img.get("title") or f"{topic} Visual Concept Card / Infographic",
        "searchQuery": img_query,
        "url": img_url
    }

    # 4. PDF Resource (Exact direct PDF notes / study sheet link)
    pdf = rel.get("pdfResource", {})
    pdf_query = pdf.get("searchQuery") or f"{grade} {subject} {topic} study notes revision pdf"
    pdf_url = resource_resolver.get_exact_pdf_url(pdf_query, topic, subject)
    rel["pdfResource"] = {
        "title": pdf.get("title") or f"{topic} Revision Notes PDF",
        "searchQuery": pdf_query,
        "url": pdf_url
    }

    # 5. Web Resource (Exact direct educational article link)
    web = rel.get("webResource", {})
    web_query = web.get("searchQuery") or f"{grade} {subject} {topic} explained examples"
    web_url = resource_resolver.get_exact_web_url(web_query, topic, subject)
    rel["webResource"] = {
        "title": web.get("title") or f"{topic} Reference Article",
        "searchQuery": web_query,
        "url": web_url
    }


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
            print(f"[UUID FIX] {label}: replaced '{qid}' -> '{new_id}'")
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

    # Main question options
    _shuffle_list(data.get("optionsList", []))

    # Main question solution steps
    for step in data.get("solutionSteps", []):
        _shuffle_list(step.get("optionsList", []))

    # Alternate questions and their steps
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
    inputs = {
        "subject": subject,
        "chapter": chapter
    }
    try:
        data = chains.run_suggest_topics(inputs)
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

# SYLLABUS is imported from config

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
    
    # 2. Select Chapter
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
    
    # 3. Select Topic
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
        print("Invalid input. Defaulting to 2.")
        return 2


if __name__ == "__main__":
    # Reconfigure stdout to support unicode characters on Windows terminal
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

    # Step 1: Select grade level
    grade = select_grade()

    # Step 2: Get user selection from syllabus
    sub, chap, top = select_from_syllabus()

    # Step 3: Select number of alternate questions
    num_alt = select_num_alternate_questions()
    
    # Scan output directory to exclude previously generated questions
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_question")
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
            
            # Check if generated question is too similar to any excluded question
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
            
        # Ensure a valid UUID is set if not returned properly
        if "questionId" not in result or result["questionId"] == "UNIQUE_ID":
            result["questionId"] = str(uuid.uuid4())
            
        import re
        grade_slug = re.sub(r'[\\/*?:"<>|]', "", grade.lower().replace(' ', '_').replace('/', '_'))
        sub_slug = re.sub(r'[\\/*?:"<>|]', "", sub.lower().replace(' ', '_'))
        top_slug = re.sub(r'[\\/*?:"<>|]', "", top.lower().replace(' ', '_'))
        base_filename = f"{grade_slug}_{sub_slug}_{top_slug}"
        output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_question")
        os.makedirs(output_dir, exist_ok=True)
        filepath = get_unique_filename(output_dir, base_filename, ".json")
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
        
        print(f"Successfully saved generated question to {filepath}\n")
        
        # Show the generated JSON in the terminal
        print("Generated VTFR JSON Payload:")
        print(json.dumps(result, indent=2))
        print("-" * 40)
    except Exception as e:
        print(f"Failed to generate VTFR question for {sub} - {top}: {e}\n")