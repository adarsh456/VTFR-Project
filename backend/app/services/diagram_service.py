import os
import uuid
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend suitable for server environments
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
IMAGE_QUESTIONS_DIR = os.path.join(BASE_DIR, "static", "image_questions")
os.makedirs(IMAGE_QUESTIONS_DIR, exist_ok=True)

def generate_function_graph_diagram(expression_type: str = "quadratic") -> str:
    """Generates a high-quality 2D function graph PNG using Matplotlib."""
    fig, ax = plt.subplots(figsize=(6, 4.5), dpi=150)
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#0f172a')

    x = np.linspace(-5, 5, 400)
    if expression_type == "quadratic":
        y = x**2 - 4
        title = r"Function Graph: $f(x) = x^2 - 4$"
    elif font_type := "trigonometric" if expression_type == "trigonometric" else None:
        y = 2 * np.sin(x)
        title = r"Function Graph: $f(x) = 2\sin(x)$"
    else:
        y = x**3 - 3*x
        title = r"Function Graph: $f(x) = x^3 - 3x$"

    ax.plot(x, y, color='#6366f1', linewidth=2.5, label='f(x)')
    ax.axhline(0, color='#64748b', linestyle='--', linewidth=1)
    ax.axvline(0, color='#64748b', linestyle='--', linewidth=1)

    ax.set_title(title, color='#f8fafc', fontsize=12, pad=12, fontweight='bold')
    ax.tick_params(colors='#94a3b8', labelsize=9)
    ax.grid(True, linestyle=':', alpha=0.3, color='#475569')

    for spine in ax.spines.values():
        spine.set_color('#334155')

    filename = f"diagram_{uuid.uuid4().hex[:8]}.png"
    filepath = os.path.join(IMAGE_QUESTIONS_DIR, filename)
    plt.tight_layout()
    plt.savefig(filepath, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)

    return f"/static/image_questions/{filename}"

def generate_geometry_triangle_diagram(a=3, b=4, c=5) -> str:
    """Generates a right-angled or arbitrary geometric triangle diagram."""
    fig, ax = plt.subplots(figsize=(6, 4.5), dpi=150)
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#0f172a')

    # Coordinates for triangle ABC
    A = (0, 0)
    B = (4, 0)
    C = (0, 3)

    triangle = patches.Polygon([A, B, C], closed=True, fill=True, facecolor='#6366f122', edgecolor='#818cf8', linewidth=2.5)
    ax.add_patch(triangle)

    # Labels
    ax.text(-0.2, -0.2, 'A (0,0)', color='#f8fafc', fontweight='bold', fontsize=10)
    ax.text(4.1, -0.2, 'B (4,0)', color='#f8fafc', fontweight='bold', fontsize=10)
    ax.text(-0.2, 3.2, 'C (0,3)', color='#f8fafc', fontweight='bold', fontsize=10)

    # Right angle symbol
    square = patches.Rectangle((0, 0), 0.4, 0.4, fill=False, edgecolor='#f43f5e', linewidth=1.5)
    ax.add_patch(square)

    ax.set_xlim(-1, 5)
    ax.set_ylim(-1, 4)
    ax.set_aspect('equal')
    ax.axis('off')
    ax.set_title("Right-Angled Triangle ABC", color='#f8fafc', fontsize=12, pad=12, fontweight='bold')

    filename = f"geom_{uuid.uuid4().hex[:8]}.png"
    filepath = os.path.join(IMAGE_QUESTIONS_DIR, filename)
    plt.tight_layout()
    plt.savefig(filepath, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)

    return f"/static/image_questions/{filename}"
