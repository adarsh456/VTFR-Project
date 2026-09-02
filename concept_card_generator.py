import os
import re
import sys
import matplotlib.pyplot as plt

import llm_factory
from langchain_core.messages import SystemMessage, HumanMessage

def generate_educational_concept_card(topic: str, subject: str = "", grade: str = "Grade 12", output_path: str = None) -> str:
    """
    Generates a 5-panel Educational Concept Summary Card PNG containing:
    1. 📌 Definition & Core Concept
    2. 🧮 Formula / Equations / Mechanism
    3. 📂 Types / Classification
    4. ⚖️ Advantages & Disadvantages (Key Features)
    5. 🚀 Real-World Applications
    """
    topic_clean = re.sub(r'[\W_]+', '_', topic.strip().lower()).strip('_')
    if not output_path:
        os.makedirs("generated_question/concept_cards", exist_ok=True)
        output_path = f"generated_question/concept_cards/{topic_clean}_concept_card.png"

    output_path = os.path.abspath(output_path).replace("\\", "/")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    llm = llm_factory.get_llm()

    sys_prompt = (
        "You are an expert Educational Graphic & Infographic Designer.\n"
        "Your task is to write a Python script using Matplotlib to render a clean, high-resolution "
        "5-PANEL EDUCATIONAL CONCEPT SUMMARY CARD (Infographic Image) for a student studying the topic.\n\n"
        "THE CONCEPT CARD MUST CONTAIN 5 CLEAR VISUAL SECTIONS:\n"
        "1. 📌 DEFINITION & CORE CONCEPT (Clear 1-2 sentence explanation)\n"
        "2. 🧮 FORMULA / EQUATION / MECHANISM (Key mathematical, physical, or chemical representation)\n"
        "3. 📂 TYPES / CLASSIFICATION (Categorization or key variants)\n"
        "4. ⚖️ ADVANTAGES & DISADVANTAGES (or Key Pros/Cons / Characteristics)\n"
        "5. 🚀 REAL-WORLD APPLICATIONS (Practical uses in science, engineering, or daily life)\n\n"
        "DESIGN RULES:\n"
        "- Use `fig, ax = plt.subplots(figsize=(10, 14), dpi=200)`.\n"
        "- Set background to a clean canvas (`#F8FAFC`).\n"
        "- Turn off axes (`ax.axis('off')`).\n"
        "- Draw colored rounded bounding boxes or panels for each section using FancyBboxPatch or ax.text with bbox.\n"
        "- Use clean typography, contrasting dark text, and distinct section header colors (Navy, Teal, Slate, Coral).\n"
        "- DO NOT call plt.show(). Prepend `OUTPUT_PATH = r'" + output_path + "'` and save using `plt.savefig(OUTPUT_PATH, dpi=200, bbox_inches='tight')` then `plt.close()`.\n"
        "- Return ONLY executable Python code inside a ```python ... ``` block."
    )

    user_prompt = f"Grade: {grade}\nSubject: {subject}\nTopic: {topic}\nTarget Save Location: {output_path}"

    print(f"[Concept Card] Generating 5-panel Concept Card Infographic for '{topic}' ({subject})...")

    try:
        response = llm.invoke([
            SystemMessage(content=sys_prompt),
            HumanMessage(content=user_prompt)
        ])
        content = response.content.strip()

        # Extract python code block safely
        code_match = re.search(r"```(?:python)?\s*\n?(.*?)\n?```", content, re.DOTALL)
        if code_match:
            code = code_match.group(1).strip()
        else:
            code = re.sub(r"^```.*$", "", content, flags=re.MULTILINE).strip()
            lines = code.split("\n")
            start_idx = 0
            for idx, line in enumerate(lines):
                if line.strip().startswith("import ") or line.strip().startswith("#") or line.strip().startswith("from "):
                    start_idx = idx
                    break
            code = "\n".join(lines[start_idx:])

        code = code.replace("plt.show()", "# plt.show()")
        code = re.sub(r"^\s*OUTPUT_PATH\s*=.*$", "", code, flags=re.MULTILINE)
        code = re.sub(r"plt\.savefig\([^)]*\)", "plt.savefig(OUTPUT_PATH, dpi=200, bbox_inches='tight')", code)
        if "plt.savefig" not in code:
            code += "\nplt.savefig(OUTPUT_PATH, dpi=200, bbox_inches='tight')\n"

        full_code = f"OUTPUT_PATH = r'{output_path}'\n" + code

        exec_globals = {
            "OUTPUT_PATH": output_path,
            "__builtins__": __builtins__
        }

        exec(full_code, exec_globals)
        if os.path.exists(output_path):
            print(f"[Concept Card] SUCCESS! Saved concept card to: {output_path}")
            return output_path
    except Exception as err:
        print(f"[Concept Card] Exception during concept card generation: {err}")

    return None
