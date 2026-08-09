VALID_DIAGRAM_TYPES: dict = {
    "parallel_circuit": "Parallel resistors + battery  (Physics / Electricity)",
    "series_circuit":   "Series resistors + battery    (Physics / Electricity)",
    "right_triangle":   "Right-angled triangle with labelled sides  (Geometry / Trig)",
    "triangle":         "General triangle with angles/sides  (Geometry)",
    "rectangle":        "Rectangle or square with dimensions  (Geometry / Mensuration)",
    "circle":           "Circle with radius/diameter  (Geometry / Mensuration)",
    "graph":            "Cartesian 2D graph of a math function, e.g. y = sin(x)",
    "scatter_3d":       "3D coordinate system with labelled points  (Geometry / 3-D)",
    "none":             "No meaningful visual — do NOT generate an image question",
}

# SYLLABUS optimized specifically for topics that require diagrams supported by our Matplotlib renderer
SYLLABUS: dict = {
    "1": {
        "subject": "Mathematics",
        "chapters": {
            "1": {
                "chapter": "Geometry",
                "topics": [
                    "Pythagoras Theorem",
                    "Circle Theorems",
                    "Properties of Rectangle",
                    "Triangle Side and Angle Rules"
                ]
            },
            "2": {
                "chapter": "Trigonometry",
                "topics": [
                    "Right-Angled Triangle Problems",
                    "Sine and Cosine Rules"
                ]
            },
            "3": {
                "chapter": "Coordinate Geometry",
                "topics": [
                    "Plotting 2D Functions and Curves",
                    "3D Coordinate Plots"
                ]
            }
        }
    },
    "2": {
        "subject": "Physics",
        "chapters": {
            "1": {
                "chapter": "Electricity",
                "topics": [
                    "Series Resistor Circuits",
                    "Parallel Resistor Circuits"
                ]
            }
        }
    }
}
