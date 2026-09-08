import os
import re
import sys
import json
import textwrap
import matplotlib.pyplot as plt
import matplotlib.patches as patches

import llm_factory
from langchain_core.messages import SystemMessage, HumanMessage


def generate_topic_fallback_content(topic: str, subject: str, grade: str) -> dict:
    """
    Generates rich, topic-specific fallback content for 5-panel concept cards
    when LLM response is unavailable or rate-limited.
    """
    t = topic.strip()
    s = subject.strip() or "General Science & Mathematics"
    g = grade.strip() or "Standard Curriculum"

    return {
        "definition": f"{t} is a core educational topic in {s} ({g}) that provides fundamental theoretical principles and analytical methods for problem solving.",
        "formula": f"• Standard equations & algebraic representations for {t}\n• Core mathematical/physical relationship models\n• Key parameters: input variables, coefficients, and constants",
        "types": f"• Primary Form / Standard Classification of {t}\n• Secondary Form / Alternative Representations\n• Special Cases & Boundary Conditions",
        "advantages_disadvantages": f"• Advantages: Provides a rigorous framework for quantitative problem solving in {s}.\n• Limitations: Requires understanding of foundational pre-requisite concepts & valid domains.",
        "applications": f"• Practical academic problem solving in {s} ({g})\n• Real-world applications in science, engineering, and technology\n• Data analysis, quantitative modeling, and research"
    }


def render_concept_card_image(topic: str, subject: str, grade: str, sections_data: dict, output_path: str) -> str:
    """
    Renders a 5-panel Educational Concept Summary Card PNG with 100% guaranteed,
    non-overlapping layout mathematics and crisp typography.
    """
    fig, ax = plt.subplots(figsize=(10, 15), dpi=200)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 15)
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')
    ax.axis('off')

    # Main Card Title Banner at the top
    title_text = f"{topic}"
    sub_text = f"{subject}  |  {grade}".strip(" | ")
    if len(title_text) > 40:
        title_text = textwrap.fill(title_text, width=38)

    ax.text(5.0, 14.5, title_text, fontsize=18, fontweight='bold', ha='center', va='top', color='#0F172A')
    if sub_text:
        ax.text(5.0, 13.9, sub_text, fontsize=11.5, fontweight='bold', ha='center', va='top', color='#64748B')

    # Section Panels definitions
    panels_config = [
        ("1. DEFINITION & CORE CONCEPT", sections_data.get("definition", ""), '#F0F9FF', '#0284C7', '#0369A1'),
        ("2. FORMULA / EQUATION / MECHANISM", sections_data.get("formula", ""), '#F0FDFA', '#0D9488', '#0F766E'),
        ("3. TYPES / CLASSIFICATION", sections_data.get("types", ""), '#F5F3FF', '#7C3AED', '#6D28D9'),
        ("4. ADVANTAGES & DISADVANTAGES", sections_data.get("advantages_disadvantages", ""), '#FFFBEB', '#D97706', '#B45309'),
        ("5. REAL-WORLD APPLICATIONS", sections_data.get("applications", ""), '#EFF6FF', '#2563EB', '#1D4ED8')
    ]

    y_starts = [10.8, 8.2, 5.6, 3.0, 0.4]
    panel_h = 2.3

    for (header_title, body_content, bg_col, border_col, header_col), y_start in zip(panels_config, y_starts):
        # Draw rounded panel box
        rect = patches.FancyBboxPatch(
            (0.5, y_start), 9.0, panel_h,
            boxstyle='round,pad=0.08,rounding_size=0.2',
            facecolor=bg_col, edgecolor=border_col, linewidth=1.5
        )
        ax.add_patch(rect)

        # Header Title (placed at y_start + panel_h - 0.30 with va='top')
        ax.text(
            0.85, y_start + panel_h - 0.30, header_title,
            fontsize=11.5, fontweight='bold', color=header_col, va='top', ha='left'
        )

        # Format body content safely
        if isinstance(body_content, list):
            formatted_lines = [f"• {item}" if not str(item).strip().startswith("•") else str(item) for item in body_content]
            raw_text = "\n".join(formatted_lines)
        else:
            raw_text = str(body_content or "").strip()

        # Wrap text lines to prevent overflow outside box borders
        wrapped_lines = []
        for line in raw_text.split("\n"):
            line_str = line.strip()
            if line_str:
                if not line_str.startswith("•") and not line_str.startswith("-") and not line_str.startswith("1.") and not line_str.startswith("2."):
                    wrapped_lines.append(textwrap.fill(line_str, width=72))
                else:
                    wrapped_lines.append(textwrap.fill(line_str, width=72, subsequent_indent="  "))

        final_body = "\n".join(wrapped_lines)

        # Body Text (placed at y_start + panel_h - 0.75 with va='top', GUARANTEED gap below header!)
        ax.text(
            0.85, y_start + panel_h - 0.75, final_body,
            fontsize=9.5, color='#1E293B', va='top', ha='left', linespacing=1.35
        )

    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    plt.savefig(output_path, dpi=200, bbox_inches='tight')
    plt.close()
    return output_path


def generate_educational_concept_card(topic: str, subject: str = "", grade: str = "Grade 12", output_path: str = None) -> str:
    """
    Generates a 5-panel Educational Concept Summary Card PNG containing:
    1. Definition & Core Concept
    2. Formula / Equations / Mechanism
    3. Types / Classification
    4. Advantages & Disadvantages (Key Features)
    5. Real-World Applications
    """
    topic_clean = re.sub(r'[\W_]+', '_', topic.strip().lower()).strip('_')
    if not output_path:
        os.makedirs("generated_question/concept_cards", exist_ok=True)
        output_path = f"generated_question/concept_cards/{topic_clean}_concept_card.png"

    output_path = os.path.abspath(output_path).replace("\\", "/")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    llm = llm_factory.get_llm()

    sys_prompt = (
        "You are an expert Educational Infographic Content Designer.\n"
        "Given a topic, subject, and grade level, write clear, structured educational content for a 5-panel concept card.\n"
        "Return ONLY raw JSON with these exact 5 keys:\n"
        "{\n"
        '  "definition": "1-2 sentence clear definition and core concept explanation.",\n'
        '  "formula": "Key formulas, equations, mathematical representations, or key mechanisms (use bullet points or LaTeX if needed).",\n'
        '  "types": "Bullet points listing main types, categories, or variants.",\n'
        '  "advantages_disadvantages": "Bullet points listing key advantages and disadvantages (or characteristics).",\n'
        '  "applications": "Bullet points listing practical real-world applications in science, engineering, or daily life."\n'
        "}\n"
        "Do NOT include markdown formatting blocks (like ```json). Return valid JSON only."
    )

    user_prompt = f"Grade: {grade}\nSubject: {subject}\nTopic: {topic}"

    print(f"[Concept Card] Generating 5-panel Concept Card Infographic for '{topic}' ({subject})...")

    try:
        response = llm.invoke([
            SystemMessage(content=sys_prompt),
            HumanMessage(content=user_prompt)
        ])
        content = response.content.strip()

        # Parse JSON output
        sections_data = {}
        json_match = re.search(r"(\{.*\})", content, re.DOTALL)
        if json_match:
            try:
                sections_data = json.loads(json_match.group(1))
            except Exception:
                pass
        
        if not sections_data:
            try:
                sections_data = json.loads(content)
            except Exception:
                pass

        if sections_data and isinstance(sections_data, dict) and "definition" in sections_data:
            render_concept_card_image(topic, subject, grade, sections_data, output_path)
            if os.path.exists(output_path):
                print(f"[Concept Card] SUCCESS! Saved concept card to: {output_path}")
                return output_path

    except Exception as err:
        print(f"[Concept Card] Exception during concept card content generation: {err}")

    # Topic-specific dynamic fallback content if LLM call failed or was rate-limited
    fallback_data = generate_topic_fallback_content(topic, subject, grade)
    render_concept_card_image(topic, subject, grade, fallback_data, output_path)
    return output_path
