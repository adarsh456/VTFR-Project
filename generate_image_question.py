"""
generate_image_question.py
==========================
AI-Powered Image-Based MCQ Generator — VTFR Adaptive Learning Platform.

Pipeline (3 steps):
    Step 1 — Planning   : A fast LLM decides WHETHER a topic needs a visual
                          and WHICH diagram type fits best.
    Step 2 — Generation : A guided LLM call produces a structured MCQ JSON
                          with exact diagram data ready for rendering.
    Step 3 — Rendering  : Matplotlib draws the diagram and composites it
                          with the question text into a single PNG image.

Supported diagram types:
    parallel_circuit · series_circuit · right_triangle · triangle
    rectangle · circle · graph · scatter_3d

Author: MKCL Internship — AI VTFR Team
"""

# =============================================================================
# Standard-library imports
# =============================================================================
import os
import sys
import json
import uuid
import random
import textwrap
from pathlib import Path
from typing import Optional

# =============================================================================
# Third-party imports
# =============================================================================
from dotenv import load_dotenv
from openai import OpenAI
from image_config import VALID_DIAGRAM_TYPES, SYLLABUS
import image_prompt_templates

# ── Optional: Matplotlib (only needed for diagram rendering) ─────────────────
try:
    import matplotlib
    matplotlib.use("Agg")                          # non-interactive backend
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches          # noqa: F401
    from matplotlib.patches import FancyBboxPatch
    import numpy as np
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False
    print("[WARNING] matplotlib not installed — run: pip install matplotlib numpy\n")

# =============================================================================
# Environment & API client
# =============================================================================
load_dotenv()

# Initialize AI client (Groq or HuggingFace router)
groq_key = os.environ.get("GROQ_API_KEY")
hf_key = os.environ.get("huggingface_API_KEY")

if groq_key:
    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=groq_key,
    )
    MODEL_PRIMARY  = "llama-3.3-70b-versatile"
    MODEL_FALLBACK = "llama-3.1-8b-instant"
    print("AI Client initialized using Groq (llama-3.3-70b-versatile).")
elif hf_key:
    client = OpenAI(
        base_url="https://router.huggingface.co/v1",
        api_key=hf_key,
    )
    MODEL_PRIMARY  = "meta-llama/Llama-3.3-70B-Instruct"
    MODEL_FALLBACK = "meta-llama/Llama-3.1-8B-Instruct"
    print("AI Client initialized using HuggingFace Router.")
else:
    print("Error: Neither GROQ_API_KEY nor huggingface_API_KEY environment variable is set. Please set one of them in a .env file.")
    sys.exit(1)

# Console separator widths
SEP_WIDE   = "=" * 60
SEP_NARROW = "-" * 50

# Supported diagram types: key → human-readable description (single source of truth)
# VALID_DIAGRAM_TYPES is imported from image_config


# =============================================================================
# Logging helper
# =============================================================================

def _log(message: str, indent: int = 2) -> None:
    """Print a console message with consistent indentation."""
    print(" " * indent + message)


# =============================================================================
# STEP 1 — PLANNING
# =============================================================================

def plan_image_question(subject: str, chapter: str, topic: str, grade: str) -> dict:
    """
    Ask the AI to decide whether a topic genuinely benefits from an image-based
    MCQ and, if so, which diagram type fits best.

    Args:
        subject: Subject name (e.g. "Mathematics").
        chapter: Chapter name (e.g. "Geometry").
        topic:   Topic name  (e.g. "Pythagoras Theorem").
        grade:   Grade level (e.g. "Grade 10").

    Returns:
        A dict with the following keys:
            can_generate      (bool) – True if an image question is feasible.
            reason            (str)  – One-sentence justification.
            diagram_type      (str)  – One of the VALID_DIAGRAM_TYPES keys.
            question_hint     (str)  – Concrete MCQ idea (empty if can_generate=False).
            diagram_data_hint (dict) – Real numbers/dimensions for the diagram.
    """
    valid_list = "\n".join(
        f'  "{k}" — {v}' for k, v in VALID_DIAGRAM_TYPES.items()
    )

    system_prompt = image_prompt_templates.get_planning_system_prompt(grade, subject, chapter, topic, valid_list)
    user_prompt = image_prompt_templates.get_planning_user_prompt(grade, subject, chapter, topic)

    print(f"\n{SEP_WIDE}")
    _log("[STEP 1] Analysing topic for image suitability …")
    _log(f"Grade: {grade}  |  {subject} → {chapter} → {topic}")
    print(SEP_WIDE)

    # ── API call ──────────────────────────────────────────────────────────────────────
    try:
        response = client.chat.completions.create(
            model=MODEL_PRIMARY,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,   # low temperature → deterministic judgement
            max_tokens=600,
        )
        plan: dict = json.loads(response.choices[0].message.content)

    except Exception as exc:
        _log(f"[WARNING] Planning call failed: {exc}")
        plan = {
            "can_generate":      False,
            "reason":            f"Planning step failed: {exc}",
            "diagram_type":      "none",
            "question_hint":     "",
            "diagram_data_hint": {},
        }

    # ── Validate diagram_type ────────────────────────────────────────────────────────────
    diagram_type = plan.get("diagram_type", "none").strip().lower()
    if diagram_type not in VALID_DIAGRAM_TYPES:
        diagram_type = "none"
        plan["can_generate"] = False
    plan["diagram_type"] = diagram_type

    # ── Console summary ───────────────────────────────────────────────────────────────
    can_generate = plan.get("can_generate", False)
    status_icon  = "✅" if can_generate else "❌"

    print()
    _log(f"{status_icon}  can_generate  : {can_generate}")
    _log(f"📝  reason        : {plan.get('reason', '')}")
    if can_generate:
        _log(f"🖼️  diagram_type  : {diagram_type}  ({VALID_DIAGRAM_TYPES.get(diagram_type, '')})")
        _log(f"💡  question_hint  : {plan.get('question_hint', '')}")
        _log(f"📐  diagram_data   : {plan.get('diagram_data_hint', {})}")
    print()

    return plan


# =============================================================================
# STEP 2 — QUESTION GENERATION
# =============================================================================

def generate_image_question(
    subject: str,
    chapter: str,
    topic: str,
    grade: str,
    diagram_type: str,
    question_hint: str,
    diagram_data_hint: dict,
) -> dict:
    """
    Generate a single image-based MCQ, guided by the planning output from Step 1.

    The LLM is asked to produce:
      • questionText / questionLatex
      • diagramType  / diagramData  (must use the hint values verbatim)
      • optionsList  (1 correct + 3 distractors)
      • correctAnswer / correctExplanation
      • calculationDraft (internal working, not shown to students)

    Args:
        subject:           Subject name.
        chapter:           Chapter name.
        topic:             Topic name.
        grade:             Grade level.
        diagram_type:      Validated diagram type key from Step 1.
        question_hint:     Concrete MCQ idea from Step 1.
        diagram_data_hint: Real diagram values (resistances, side lengths, …).

    Returns:
        Parsed JSON dict representing the image-MCQ question.
    """
    system_prompt = image_prompt_templates.get_generation_system_prompt(grade, subject, chapter, topic, diagram_type, question_hint, diagram_data_hint)
    user_prompt = image_prompt_templates.get_generation_user_prompt(grade, subject, chapter, topic, diagram_type, diagram_data_hint, question_hint)

    _log("[STEP 2] Generating question …")

    # ── Primary model call ──────────────────────────────────────────────────────────────
    try:
        response = client.chat.completions.create(
            model=MODEL_PRIMARY,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=2000,
        )
        data: dict = json.loads(response.choices[0].message.content)

    except Exception as exc:
        _log(f"Primary model failed: {exc}")
        _log(f"Falling back to {MODEL_FALLBACK} …")
        response = client.chat.completions.create(
            model=MODEL_FALLBACK,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=2000,
        )
        data = json.loads(response.choices[0].message.content)

    # ── Post-processing: enforce UUID and diagram type ────────────────────────────────
    import re
    uuid4_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    question_id = data.get("questionId", "")
    if not question_id or not uuid4_pattern.match(str(question_id)):
        data["questionId"] = str(uuid.uuid4())

    data["diagramType"] = diagram_type          # always enforce the planned type
    if not data.get("diagramData"):
        data["diagramData"] = diagram_data_hint  # fall back to hint values

    _shuffle_options(data)
    return data

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


# =============================================================================
# DIAGRAM RENDERERS  (private helpers called by render_question_image)
# =============================================================================

def _draw_parallel_circuit(ax, resistors: list, voltage: Optional[float] = None) -> None:
    """
    Draw a parallel resistor circuit on the given Axes.

    Layout: two vertical rails bridged top and bottom, each resistor on its
    own horizontal branch, battery symbol on the left rail.
    """
    n = len(resistors) or 1
    if not resistors:
        resistors = ["R"]

    rail_x_left  = 0.08
    rail_x_right = 0.92
    branch_h     = min(0.22, 0.80 / n)
    total_h      = n * branch_h
    top_y        = 0.5 + total_h / 2
    bot_y        = 0.5 - total_h / 2
    mid_x        = (rail_x_left + rail_x_right) / 2

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_facecolor("#F8FBFF")
    lw = 2.0
    wc = "#1A1A2E"   # wire colour

    # Outer rails
    ax.plot([rail_x_left,  rail_x_left],  [bot_y, top_y], color=wc, lw=lw)
    ax.plot([rail_x_right, rail_x_right], [bot_y, top_y], color=wc, lw=lw)
    ax.plot([rail_x_left,  rail_x_right], [top_y, top_y], color=wc, lw=lw)
    ax.plot([rail_x_left,  rail_x_right], [bot_y, bot_y], color=wc, lw=lw)

    # Resistor branches
    for i, R in enumerate(resistors):
        y     = top_y - branch_h * (i + 0.5)
        label = f"R{i+1} = {R} Ω" if isinstance(R, (int, float)) else f"R{i+1} = {R}"
        rl, rr = mid_x - 0.12, mid_x + 0.12
        ax.plot([rail_x_left, rl], [y, y], color=wc, lw=lw)
        ax.plot([rr, rail_x_right], [y, y], color=wc, lw=lw)
        rect = FancyBboxPatch(
            (rl, y - 0.04), rr - rl, 0.08,
            boxstyle="round,pad=0.005",
            lw=1.8, edgecolor="#E74C3C", facecolor="#FADBD8",
        )
        ax.add_patch(rect)
        ax.text(mid_x, y, label, ha="center", va="center",
                fontsize=9, fontweight="bold", color="#922B21")

    # Battery symbol
    bat_y = (top_y + bot_y) / 2
    bw    = 0.022
    ax.plot([rail_x_left - bw, rail_x_left + bw], [bat_y + 0.04] * 2, color="#1A5276", lw=3)
    ax.plot([rail_x_left - bw * .6, rail_x_left + bw * .6], [bat_y - 0.04] * 2,
            color="#1A5276", lw=1.5)
    ax.text(rail_x_left - 0.055, bat_y,
            f"{voltage} V" if voltage is not None else "V",
            ha="center", va="center", fontsize=8.5, fontweight="bold", color="#1A5276")
    ax.text(rail_x_left + 0.01, top_y + 0.05, "+", fontsize=11,
            color="#1A5276", fontweight="bold")
    ax.text(rail_x_left + 0.01, bot_y - 0.05, "−", fontsize=11,
            color="#1A5276", fontweight="bold")

    ax.set_title(
        f"Parallel Circuit  ({n} resistor{'s' if n > 1 else ''})",
        fontsize=11, fontweight="bold", color="#1A2856", pad=6,
    )


def _draw_series_circuit(ax, resistors: list, voltage: Optional[float] = None) -> None:
    """
    Draw a series resistor circuit on the given Axes.

    Layout: a rectangular loop — battery on the top-left segment, resistors
    across the remaining top segments, return wire at the bottom.
    """
    n = len(resistors) or 1
    if not resistors:
        resistors = ["R"]

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_facecolor("#F8FBFF")

    lw    = 2.0
    wc    = "#1A1A2E"
    top_y = 0.72
    bot_y = 0.28
    lx    = 0.08
    rx    = 0.92
    seg_w = (rx - lx) / (n + 1)

    # Battery on segment 0 (top-left)
    bat_cx = lx + seg_w * 0.5
    ax.plot([lx, bat_cx - 0.04], [top_y] * 2, color=wc, lw=lw)
    ax.plot([bat_cx + 0.04, lx + seg_w], [top_y] * 2, color=wc, lw=lw)
    bh = 0.07
    ax.plot([bat_cx, bat_cx], [top_y - bh, top_y + bh], color="#1A5276", lw=3)
    ax.plot([bat_cx - .025] * 2, [top_y - bh * .5, top_y + bh * .5],
            color="#1A5276", lw=1.5)
    ax.text(bat_cx + .07, top_y,
            f"{voltage} V" if voltage is not None else "V",
            fontsize=8.5, color="#1A5276", ha="left", va="center", fontweight="bold")

    # Resistors on segments 1 … n
    for i, R in enumerate(resistors):
        ss  = lx + seg_w * (i + 1)
        se  = ss + seg_w
        mx  = (ss + se) / 2
        rh  = 0.055
        label = f"R{i+1}={R}Ω" if isinstance(R, (int, float)) else f"R{i+1}"
        ax.plot([ss, mx - rh], [top_y] * 2, color=wc, lw=lw)
        ax.plot([mx + rh, se], [top_y] * 2, color=wc, lw=lw)
        rect = FancyBboxPatch(
            (mx - rh, top_y - .045), rh * 2, .09,
            boxstyle="round,pad=0.005",
            lw=1.8, edgecolor="#E74C3C", facecolor="#FADBD8",
        )
        ax.add_patch(rect)
        ax.text(mx, top_y, label, ha="center", va="center",
                fontsize=8.5, fontweight="bold", color="#922B21")

    # Return-path wires
    ax.plot([lx, lx], [bot_y, top_y], color=wc, lw=lw)
    ax.plot([rx, rx], [bot_y, top_y], color=wc, lw=lw)
    ax.plot([lx, rx], [bot_y] * 2,   color=wc, lw=lw)

    ax.set_title(
        f"Series Circuit  ({n} resistor{'s' if n > 1 else ''})",
        fontsize=11, fontweight="bold", color="#1A2856", pad=6,
    )


def _draw_geometry(ax, shape: str, labels: dict) -> None:
    """
    Draw a 2-D geometric shape with dimension labels.

    Supported shapes: right_triangle, triangle, rectangle / square, circle.

    Args:
        ax:     Matplotlib Axes to draw on.
        shape:  Normalised shape name.
        labels: Dict mapping label names to display strings (e.g. {"base": "6 cm"}).
    """
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_facecolor("#F8FBFF")

    ec   = "#1A5276"   # edge colour
    fc   = "#D6EAF8"   # fill colour
    lc   = "#154360"   # label colour
    lw   = 2.2

    shape = shape.lower()
    vals  = list(labels.values())

    if "right_triangle" in shape:
        pts = np.array([[0.15, 0.20], [0.85, 0.20], [0.15, 0.75]])
        ax.add_patch(plt.Polygon(pts, closed=True, lw=lw, edgecolor=ec, facecolor=fc))
        # Right-angle mark
        ax.add_patch(plt.Polygon(
            [[0.15, 0.20], [0.22, 0.20], [0.22, 0.27], [0.15, 0.27]],
            closed=True, lw=1, edgecolor=ec, facecolor="none",
        ))
        ax.text(0.50, 0.11, vals[0] if vals else "",            ha="center", fontsize=10, color=lc, fontweight="bold")
        ax.text(0.07, 0.47, vals[1] if len(vals) > 1 else "",  ha="center", fontsize=10, color=lc, fontweight="bold")
        ax.text(0.53, 0.50, vals[2] if len(vals) > 2 else "",  ha="center", fontsize=10, color=lc, fontweight="bold", rotation=-38)
        
        # Add vertex labels
        ax.text(0.11, 0.17, "A", ha="center", va="center", fontsize=11, color="#2C3E50", fontweight="bold")
        ax.text(0.11, 0.78, "B", ha="center", va="center", fontsize=11, color="#2C3E50", fontweight="bold")
        ax.text(0.89, 0.17, "C", ha="center", va="center", fontsize=11, color="#2C3E50", fontweight="bold")
        
        ax.set_title("Right Triangle", fontsize=11, fontweight="bold", color="#1A2856", pad=6)

    elif "triangle" in shape:
        pts = np.array([[0.50, 0.78], [0.15, 0.22], [0.85, 0.22]])
        ax.add_patch(plt.Polygon(pts, closed=True, lw=lw, edgecolor=ec, facecolor=fc))
        ax.text(0.50, 0.14, vals[0] if vals else "",            ha="center", fontsize=10, color=lc, fontweight="bold")
        ax.text(0.25, 0.53, vals[1] if len(vals) > 1 else "",  ha="center", fontsize=10, color=lc, fontweight="bold")
        ax.text(0.75, 0.53, vals[2] if len(vals) > 2 else "",  ha="center", fontsize=10, color=lc, fontweight="bold")
        
        # Add vertex labels
        ax.text(0.11, 0.18, "A", ha="center", va="center", fontsize=11, color="#2C3E50", fontweight="bold")
        ax.text(0.50, 0.82, "B", ha="center", va="center", fontsize=11, color="#2C3E50", fontweight="bold")
        ax.text(0.89, 0.18, "C", ha="center", va="center", fontsize=11, color="#2C3E50", fontweight="bold")
        
        ax.set_title("Triangle", fontsize=11, fontweight="bold", color="#1A2856", pad=6)

    elif "rect" in shape or "square" in shape:
        ax.add_patch(FancyBboxPatch(
            (0.15, 0.25), 0.70, 0.50,
            boxstyle="square,pad=0",
            lw=lw, edgecolor=ec, facecolor=fc,
        ))
        ax.text(0.50, 0.17, vals[0] if vals else "",           ha="center", fontsize=10, color=lc, fontweight="bold")
        ax.text(0.92, 0.50, vals[1] if len(vals) > 1 else "",  va="center", fontsize=10, color=lc, fontweight="bold")
        title = "Square" if "square" in shape else "Rectangle"
        ax.set_title(title, fontsize=11, fontweight="bold", color="#1A2856", pad=6)

    elif "circle" in shape:
        ax.add_patch(plt.Circle((0.50, 0.50), 0.32, lw=lw, edgecolor=ec, facecolor=fc))
        ax.plot([0.50, 0.82], [0.50] * 2, color=lc, lw=1.5, linestyle="--")
        ax.text(0.66, 0.54, vals[0] if vals else "r",
                ha="center", fontsize=10, color=lc, fontweight="bold")
        ax.set_title("Circle", fontsize=11, fontweight="bold", color="#1A2856", pad=6)

    else:
        ax.text(0.5, 0.5, f"[shape: {shape}]", ha="center", va="center",
                fontsize=11, color="#888888")


def _draw_graph(ax, expression: str, x_range: list, label: str) -> None:
    """
    Plot a single 2-D function y = f(x).

    The expression is evaluated with a safe-eval context that exposes common
    numpy functions (sin, cos, tan, sqrt, exp, log) and constants (pi, e).

    Args:
        ax:         Matplotlib Axes to draw on.
        expression: Python expression string using 'x' as the variable.
        x_range:    [x_min, x_max] plotting domain.
        label:      Legend / title label (e.g. "y = sin(x)").
    """
    try:
        x_min, x_max = float(x_range[0]), float(x_range[1])
    except Exception:
        x_min, x_max = -5.0, 5.0

    x = np.linspace(x_min, x_max, 500)
    safe_namespace = {
        "__builtins__": {},
        "x":    x,
        "np":   np,
        "sin":  np.sin,  "cos":  np.cos,  "tan":  np.tan,
        "sqrt": np.sqrt, "exp":  np.exp,  "log":  np.log,
        "pi":   np.pi,   "e":    np.e,    "abs":  np.abs,
    }
    try:
        y = eval(expression, safe_namespace)
    except Exception:
        y = x * 0   # fallback: zero line

    ax.set_facecolor("#F8FBFF")
    for spine in ("top", "right"):
        ax.spines[spine].set_visible(False)
    for spine in ("left", "bottom"):
        ax.spines[spine].set_color("#AAB7B8")
    ax.tick_params(colors="#555555", labelsize=8)
    ax.axhline(0, color="#AAB7B8", lw=0.8)
    ax.axvline(0, color="#AAB7B8", lw=0.8)
    ax.plot(x, y, color="#1A5276", lw=2.2, label=label or expression)
    ax.legend(fontsize=9, loc="best", framealpha=0.7)
    ax.set_title(label or f"y = {expression}",
                 fontsize=11, fontweight="bold", color="#1A2856", pad=6)


def _draw_scatter_3d(
    ax,
    points: list,
    point_labels: Optional[list] = None,
    x_range: Optional[list] = None,
    y_range: Optional[list] = None,
    z_range: Optional[list] = None,
) -> None:
    """
    Render a 3-D scatter plot on the given 3-D Axes (projection='3d').

    Each point is drawn with a distinct colour and labelled with its
    coordinates and optional alphabetic label.

    Args:
        ax:           Matplotlib 3-D Axes instance.
        points:       List of [x, y, z] coordinate triples.
        point_labels: Optional alphabetic labels (e.g. ["A", "B", "C"]).
        x_range:      Optional [min, max] for the X axis.
        y_range:      Optional [min, max] for the Y axis.
        z_range:      Optional [min, max] for the Z axis.
    """
    if not points:
        ax.text(0.5, 0.5, 0.5, "No points provided", ha="center", va="center")
        return

    palette = ["#E74C3C", "#1A5276", "#27AE60", "#8E44AD", "#D35400", "#17A589"]

    xs = [float(p[0]) for p in points]
    ys = [float(p[1]) for p in points]
    zs = [float(p[2]) for p in points]

    for i, (x, y, z) in enumerate(zip(xs, ys, zs)):
        colour = palette[i % len(palette)]
        ax.scatter([x], [y], [z], color=colour, s=120, zorder=5,
                   edgecolors="white", linewidths=0.8)
        lbl = (point_labels[i] if point_labels and i < len(point_labels)
               else f"P{i+1}")
        ax.text(x, y, z, f"  {lbl}({x},{y},{z})",
                fontsize=8.5, color=colour, fontweight="bold")

    # Axes styling
    ax.set_facecolor("#F8FBFF")
    ax.set_xlabel("X", labelpad=6, fontsize=10, color="#1A5276", fontweight="bold")
    ax.set_ylabel("Y", labelpad=6, fontsize=10, color="#1A5276", fontweight="bold")
    ax.set_zlabel("Z", labelpad=6, fontsize=10, color="#1A5276", fontweight="bold")
    ax.tick_params(colors="#555555", labelsize=7)
    ax.xaxis.pane.fill = False
    ax.yaxis.pane.fill = False
    ax.zaxis.pane.fill = False
    ax.xaxis.pane.set_edgecolor("#D5D8DC")
    ax.yaxis.pane.set_edgecolor("#D5D8DC")
    ax.zaxis.pane.set_edgecolor("#D5D8DC")
    ax.grid(True, linestyle="--", alpha=0.4)

    # Optional axis-range constraints
    if x_range and len(x_range) == 2:
        ax.set_xlim(float(x_range[0]), float(x_range[1]))
    if y_range and len(y_range) == 2:
        ax.set_ylim(float(y_range[0]), float(y_range[1]))
    if z_range and len(z_range) == 2:
        ax.set_zlim(float(z_range[0]), float(z_range[1]))

    ax.set_title("3D Coordinate System",
                 fontsize=11, fontweight="bold", color="#1A2856", pad=10)


# =============================================================================
# STEP 3 — COMPOSITE IMAGE RENDERER
# =============================================================================

def render_question_image(question_data: dict, output_path: str) -> bool:
    """
    Render the question text and diagram into a single PNG image file.

    Layout:
        Top panel    — question text inside a styled rounded box.
        Bottom panel — the appropriate diagram (circuit, shape, graph, or 3-D).

    Args:
        question_data: The MCQ dict returned by generate_image_question().
        output_path:   Absolute path where the PNG should be written.

    Returns:
        True if the image was saved successfully, False otherwise.
    """
    if not HAS_MATPLOTLIB:
        return False

    diagram_type = question_data.get("diagramType", "none").strip().lower()
    diagram_data = question_data.get("diagramData", {}) or {}

    if diagram_type == "none":
        return False

    # ── Prepare question text ────────────────────────────────────────────────────────────
    question_text  = question_data.get("questionText", "")
    question_latex = question_data.get("questionLatex", "").strip()
    use_latex      = bool(question_latex)
    body_text      = question_latex if use_latex else question_text
    if not use_latex:
        body_text = "\n".join(textwrap.wrap(body_text, width=85))

    # ── Figure layout ──────────────────────────────────────────────────────────────
    is_3d = (diagram_type == "scatter_3d")

    fig = plt.figure(figsize=(12, 7.5 if is_3d else 7))
    fig.patch.set_facecolor("#FFFFFF")
    gs = fig.add_gridspec(2, 1, height_ratios=[1, 1.8], hspace=0.10)

    ax_question = fig.add_subplot(gs[0])
    if is_3d:
        from mpl_toolkits.mplot3d import Axes3D  # noqa: F401  (registers the projection)
        ax_diagram = fig.add_subplot(gs[1], projection="3d")
    else:
        ax_diagram = fig.add_subplot(gs[1])

    # ── Question panel ─────────────────────────────────────────────────────────────
    ax_question.set_xlim(0, 1)
    ax_question.set_ylim(0, 1)
    ax_question.axis("off")
    ax_question.set_facecolor("#F0F7FF")
    ax_question.add_patch(FancyBboxPatch(
        (0.01, 0.05), 0.98, 0.90,
        boxstyle="round,pad=0.015",
        lw=2.2, edgecolor="#2980B9", facecolor="#EBF5FB",
        transform=ax_question.transAxes, zorder=0,
    ))
    ax_question.text(0.035, 0.82, "Q.", transform=ax_question.transAxes,
                     fontsize=16, fontweight="bold", color="#1A5276",
                     va="top", ha="left", zorder=2)
    try:
        ax_question.text(0.085, 0.82, body_text, transform=ax_question.transAxes,
                         fontsize=13, color="#1C2833",
                         va="top", ha="left", linespacing=1.55, usetex=False, zorder=2)
    except Exception:
        plain = "\n".join(textwrap.wrap(question_text, width=85))
        ax_question.text(0.085, 0.82, plain, transform=ax_question.transAxes,
                         fontsize=13, color="#1C2833",
                         va="top", ha="left", linespacing=1.55, zorder=2)

    # ── Diagram panel — dispatch to the correct renderer ────────────────────────────
    dispatch = {
        "parallel_circuit": lambda: _draw_parallel_circuit(
            ax_diagram,
            diagram_data.get("resistors", [10, 20]),
            diagram_data.get("voltage"),
        ),
        "series_circuit": lambda: _draw_series_circuit(
            ax_diagram,
            diagram_data.get("resistors", [10, 20]),
            diagram_data.get("voltage"),
        ),
        "right_triangle": lambda: _draw_geometry(
            ax_diagram, diagram_data.get("shape", diagram_type), diagram_data.get("labels", {})
        ),
        "triangle": lambda: _draw_geometry(
            ax_diagram, diagram_data.get("shape", diagram_type), diagram_data.get("labels", {})
        ),
        "rectangle": lambda: _draw_geometry(
            ax_diagram, diagram_data.get("shape", diagram_type), diagram_data.get("labels", {})
        ),
        "circle": lambda: _draw_geometry(
            ax_diagram, diagram_data.get("shape", diagram_type), diagram_data.get("labels", {})
        ),
        "graph": lambda: _draw_graph(
            ax_diagram,
            diagram_data.get("expression", "x**2"),
            diagram_data.get("x_range", [-5, 5]),
            diagram_data.get("label", ""),
        ),
        "scatter_3d": lambda: _draw_scatter_3d(
            ax_diagram,
            diagram_data.get("points", []),
            diagram_data.get("point_labels"),
            diagram_data.get("x_range"),
            diagram_data.get("y_range"),
            diagram_data.get("z_range"),
        ),
    }

    renderer = dispatch.get(diagram_type)
    if renderer:
        renderer()
    else:
        ax_diagram.axis("off")
        ax_diagram.text(0.5, 0.5, f"[Unknown diagram type: {diagram_type}]",
                        ha="center", va="center", fontsize=11, color="#888888")

    if not is_3d:
        fig.text(0.5, 0.505, "▼  Diagram", ha="center", va="center",
                 fontsize=9, color="#7F8C8D", style="italic")

    plt.savefig(output_path, dpi=150, bbox_inches="tight",
                facecolor="white", edgecolor="none")
    plt.close()
    _log(f"[OK] Image saved → {output_path}")
    return True


# =============================================================================
# SYLLABUS  (pre-built subject / chapter / topic catalogue)
# =============================================================================

# SYLLABUS is imported from image_config


# =============================================================================
# INTERACTIVE MENU HELPERS
# =============================================================================

def get_topic_suggestions_img(subject: str, chapter: str) -> list:
    """
    Ask a lightweight LLM to suggest 3-4 topic names for the given chapter.

    Used when the teacher selects a custom subject/chapter not in the SYLLABUS.

    Args:
        subject: Subject name.
        chapter: Chapter name.

    Returns:
        List of up to 4 suggested topic strings, or [] on failure.
    """
    _log(f"Asking AI for topic suggestions for '{chapter}' …")
    try:
        response = client.chat.completions.create(
            model=MODEL_FALLBACK,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Suggest exactly 3–4 specific sub-topics for an MCQ question bank. "
                        'Return strictly: {"topics": ["Topic 1", "Topic 2", "Topic 3"]}'
                    ),
                },
                {"role": "user", "content": f"Subject: {subject}\nChapter: {chapter}"},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=300,
        )
        return json.loads(response.choices[0].message.content).get("topics", [])[:4]
    except Exception:
        return []


def select_grade() -> str:
    """
    Display a numbered grade menu and return the selected grade string.

    Returns:
        Grade string (e.g. "Grade 10", "College / University", or a custom value).
    """
    grades = [f"Grade {i}" for i in range(1, 13)] + ["College / University"]

    print(f"\n{SEP_NARROW}")
    print("           SELECT GRADE LEVEL")
    print(SEP_NARROW)
    for idx, grade in enumerate(grades, 1):
        print(f"  {idx:2}. {grade}")
    custom_key = len(grades) + 1
    print(f"  {custom_key:2}. Custom (Enter manually)")

    choice = input(f"\nEnter choice (1-{custom_key}): ").strip()
    if choice == str(custom_key):
        return input("Enter Custom Grade: ").strip()

    try:
        idx = int(choice) - 1
        if 0 <= idx < len(grades):
            grade = grades[idx]
            _log(f"Selected Grade: {grade}")
            return grade
    except ValueError:
        pass

    _log("Invalid — defaulting to Grade 12.")
    return "Grade 12"


def select_from_syllabus() -> tuple:
    """
    Walk the teacher through a 3-level syllabus menu (Subject → Chapter → Topic).

    Each level offers a "Custom" escape hatch that triggers AI topic suggestions.

    Returns:
        Tuple of (subject, chapter, topic) strings.
    """
    print(f"\n{SEP_NARROW}")
    print("   IMAGE-MCQ QUESTION GENERATOR — SYLLABUS")
    print(SEP_NARROW)

    # ── Select subject ──────────────────────────────────────────────────────────────
    print("\nSelect Subject:")
    for key, val in SYLLABUS.items():
        print(f"  {key}. {val['subject']}")
    custom_sub_key = str(len(SYLLABUS) + 1)
    print(f"  {custom_sub_key}. Custom Subject")

    sub_choice = input(f"Enter choice (1-{custom_sub_key}): ").strip()
    if sub_choice == custom_sub_key:
        subject = input("Enter Custom Subject Name: ").strip()
        chapter = input("Enter Custom Chapter Name: ").strip()
        topic   = _prompt_topic(subject, chapter, get_topic_suggestions_img(subject, chapter))
        return subject, chapter, topic

    if sub_choice not in SYLLABUS:
        _log("Invalid — defaulting to Mathematics.")
        sub_choice = "1"

    sub_data = SYLLABUS[sub_choice]
    subject  = sub_data["subject"]

    # ── Select chapter ─────────────────────────────────────────────────────────────
    print(f"\nSelect Chapter for {subject}:")
    for key, val in sub_data["chapters"].items():
        print(f"  {key}. {val['chapter']}")
    custom_chap_key = str(len(sub_data["chapters"]) + 1)
    print(f"  {custom_chap_key}. Custom Chapter")

    chap_choice = input(f"Enter choice (1-{custom_chap_key}): ").strip()
    if chap_choice == custom_chap_key:
        chapter = input("Enter Custom Chapter Name: ").strip()
        topic   = _prompt_topic(subject, chapter, get_topic_suggestions_img(subject, chapter))
        return subject, chapter, topic

    if chap_choice not in sub_data["chapters"]:
        chap_choice = list(sub_data["chapters"].keys())[0]
    chap_data = sub_data["chapters"][chap_choice]
    chapter   = chap_data["chapter"]

    # ── Select topic ─────────────────────────────────────────────────────────────
    print(f"\nSelect Topic for {chapter}:")
    for idx, t in enumerate(chap_data["topics"], 1):
        print(f"  {idx}. {t}")
    custom_topic_key = str(len(chap_data["topics"]) + 1)
    print(f"  {custom_topic_key}. Custom Topic")

    topic_choice = input(f"Enter choice (1-{custom_topic_key}): ").strip()
    if topic_choice == custom_topic_key:
        return subject, chapter, input("Enter Custom Topic Name: ").strip()

    try:
        tidx = int(topic_choice) - 1
        if not (0 <= tidx < len(chap_data["topics"])):
            raise ValueError
    except ValueError:
        tidx = 0

    topic = chap_data["topics"][tidx]
    _log(f"Selected: {subject} → {chapter} → {topic}")
    return subject, chapter, topic


def _prompt_topic(subject: str, chapter: str, suggestions: list) -> str:
    """
    Prompt the teacher to choose from AI-suggested topics or enter a custom one.

    Args:
        subject:     Subject name (for display context).
        chapter:     Chapter name (for display context).
        suggestions: AI-suggested topic strings.

    Returns:
        The selected or manually entered topic string.
    """
    if not suggestions:
        return input("Enter Custom Topic Name: ").strip()

    print(f"\n  AI-suggested topics for '{chapter}':")
    for idx, topic in enumerate(suggestions, 1):
        print(f"    {idx}. {topic}")

    custom_key = str(len(suggestions) + 1)
    print(f"    {custom_key}. Custom Topic")

    choice = input(f"  Enter choice (1-{custom_key}): ").strip()
    if choice == custom_key:
        return input("Enter Custom Topic Name: ").strip()

    try:
        idx = int(choice) - 1
        if 0 <= idx < len(suggestions):
            return suggestions[idx]
    except ValueError:
        pass

    return suggestions[0]


def get_unique_filename(directory: str, base_name: str, ext: str = ".json") -> str:
    """
    Return the next available numbered filename in *directory*.

    For example, if ``grade12_physics_topic_1.json`` already exists the function
    returns ``grade12_physics_topic_2.json``.

    Args:
        directory: Target directory path.
        base_name: Filename stem (no extension, no counter).
        ext:       File extension including leading dot (default: ".json").

    Returns:
        Full absolute path to the first available file.
    """
    counter = 1
    while True:
        path = os.path.join(directory, f"{base_name}_{counter}{ext}")
        if not os.path.exists(path):
            return path
        counter += 1



# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

def main() -> None:
    """
    Orchestrate the full image-MCQ generation pipeline:

        1. Select grade and topic from the interactive syllabus menu.
        2. [Step 1] AI decides if the topic suits an image question.
        3. [Step 2] AI generates the structured MCQ JSON.
        4. [Step 3] Matplotlib renders and saves the diagram image.
        5. Results are saved as <topic>.json + <topic>.png and summarised.
    """
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

    print(f"\n{SEP_WIDE}")
    print("         IMAGE-MCQ QUESTION GENERATOR")
    print(SEP_WIDE)
    print("  Step 1 — AI evaluates if the topic suits an image question")
    print("  Step 2 — If yes, generates the question + real diagram data")
    print("  Step 3 — Diagram is rendered and saved as a PNG image")
    print("  (If no suitable diagram exists → you'll be informed and exited)\n")

    # ── User selections ────────────────────────────────────────────────────────────
    grade                   = select_grade()
    subject, chapter, topic = select_from_syllabus()

    # ── Step 1: Planning ──────────────────────────────────────────────────────────
    plan = plan_image_question(subject, chapter, topic, grade)

    if not plan.get("can_generate", False):
        print(f"\n{SEP_WIDE}")
        print("  ⚠️   CANNOT GENERATE AN IMAGE QUESTION FOR THIS TOPIC")
        print(SEP_WIDE)
        print(f"  Reason     : {plan.get('reason', 'No visual diagram is meaningful here.')}")
        print("\n  Suggestions — topics that work well with image questions:")
        print("    • Physics      → Electricity → Parallel / Series Resistance")
        print("    • Mathematics  → Geometry    → Pythagoras Theorem / Area of Triangle")
        print("    • Mathematics  → Calculus    → Definite Integrals (graph)\n")
        print("  Tip: Re-run the script and choose a different topic.\n")
        sys.exit(0)

    diagram_type      = plan["diagram_type"]
    question_hint     = plan.get("question_hint", "")
    diagram_data_hint = plan.get("diagram_data_hint", {})

    # ── Step 2: Generate the MCQ ────────────────────────────────────────────────────
    question_data = generate_image_question(
        subject, chapter, topic, grade,
        diagram_type, question_hint, diagram_data_hint,
    )

    # ── Build output paths ──────────────────────────────────────────────────────────
    grade_slug = grade.lower().replace(" ", "_").replace("/", "_")
    sub_slug   = subject.lower().replace(" ", "_")
    top_slug   = topic.lower().replace(" ", "_")
    base_name  = f"{grade_slug}_{sub_slug}_{top_slug}"

    output_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "generated_question", "image_questions",
    )
    os.makedirs(output_dir, exist_ok=True)

    json_path  = get_unique_filename(output_dir, base_name, ".json")
    image_path = os.path.join(output_dir, Path(json_path).stem + ".png")

    # ── Step 3: Render and save the diagram image ─────────────────────────────────
    image_saved = render_question_image(question_data, image_path)
    question_data["questionImagePath"] = (
        os.path.relpath(image_path, os.path.dirname(os.path.abspath(__file__)))
        if image_saved else ""
    )

    # ── Persist the JSON ───────────────────────────────────────────────────────────
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(question_data, f, indent=2, ensure_ascii=False)
    _log(f"[OK] JSON saved → {json_path}\n")

    # ── Summary ──────────────────────────────────────────────────────────────
    print(SEP_WIDE)
    print("  GENERATED QUESTION SUMMARY")
    print(SEP_WIDE)
    print(f"  Grade    : {question_data.get('grade')}")
    print(f"  Subject  : {question_data.get('subject')}")
    print(f"  Chapter  : {question_data.get('chapter')}")
    print(f"  Topic    : {question_data.get('topic')}")
    print(f"  Diagram  : {diagram_type}")
    print(f"\n  Question : {question_data.get('questionText')}")
    if question_data.get("questionLatex"):
        print(f"  LaTeX    : {question_data.get('questionLatex')}")
    print("\n  Options:")
    for opt in question_data.get("optionsList", []):
        marker = "✓" if opt.get("isCorrect") else " "
        print(f"    ({marker}) {opt['optionSequenceNo']}. {opt['optionText']}")
    print(f"\n  Correct  : {question_data.get('correctAnswer')}")
    print(f"  Why      : {question_data.get('correctExplanation')}")
    print(SEP_WIDE)
    if image_saved:
        print(f"\n  🖼️  Image → {image_path}")
    print(f"  📄  JSON  → {json_path}\n")


if __name__ == "__main__":
    main()
