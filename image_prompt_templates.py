import json

def get_planning_system_prompt(grade: str, subject: str, chapter: str, topic: str, valid_list: str) -> str:
    return f"""You are a senior curriculum designer for an adaptive learning platform.
Decide WHETHER a given educational topic genuinely benefits from an image-based MCQ,
and if so, WHICH visual diagram type fits best.

Grade   : {grade}
Subject : {subject}
Chapter : {chapter}
Topic   : {topic}

Valid diagram types:
{valid_list}

RULES FOR Suitability & Design Planning:
1. Set "can_generate": true ONLY when:
   a) The topic REQUIRES a visual diagram to make the question meaningful, AND
   b) The diagram type is one of the valid keys listed above.
2. Pure text, conceptual, or memory-recall topics (e.g. definitions, historical facts) must return "can_generate": false.
3. "question_hint" must be a concrete MCQ idea that DIRECTLY references and tests the diagram's features (e.g., "Find the equivalent resistance of R1 and R2 connected in parallel", "Find the length of the hypotenuse in the right triangle shown").
4. "diagram_data_hint" must contain realistic, mathematically consistent numeric inputs.
   - For right_triangle/triangle: side lengths that satisfy the triangle inequality (and Pythagorean theorem if right-angled).
   - For circles: clean integer radii or angle measures.
   - For circuits: simple integer resistance and voltage values.
5. Return ONLY valid JSON — no markdown fences.

JSON Schema:
{{
  "can_generate": true | false,
  "reason": "one sentence explaining your decision",
  "diagram_type": "<one of the valid keys above, or 'none'>",
  "question_hint": "<specific MCQ question idea, or empty string>",
  "diagram_data_hint": {{}}
}}
"""

def get_planning_user_prompt(grade: str, subject: str, chapter: str, topic: str) -> str:
    return (
        f"Should we generate an image-based MCQ for: "
        f"{grade} | {subject} | {chapter} | {topic}? "
        f"Think carefully and return your analysis."
    )

def get_generation_system_prompt(grade: str, subject: str, chapter: str, topic: str, diagram_type: str, question_hint: str, diagram_data_hint: dict) -> str:
    return f"""You are an expert educational AI.
Generate a single, high-quality Multiple Choice Question (MCQ) that directly integrates the provided diagram and includes scaffolded solution steps.

Grade        : {grade}
Subject      : {subject}
Chapter      : {chapter}
Topic        : {topic}
Diagram type : {diagram_type}
Question hint: {question_hint}
Diagram data hint (use these exact values): {json.dumps(diagram_data_hint)}

CRITICAL QUALITY RULES:
1. DIRECT DIAGRAM INTEGRATION: The questionText must explicitly refer to the diagram (e.g. "In the circuit diagram shown below...", "Find the length of side BC in the triangle below..."). Do not make a generic question.
2. STRICT MATHEMATICAL RIGOR: 
   - All options must be mathematically correct and consistent.
   - Calculate answers using exact formulas. Double-check all intermediate and final calculations.
   - Ensure the correct option is exactly equal to the mathematical result.
3. SOPHISTICATED DISTRACTOR DESIGN:
   - Provide exactly 4 options (sequence 1 to 4). One correct option and three distractors.
   - Distractors must represent common student misconceptions or errors:
     * Distractor A: Computational error (e.g., adding instead of multiplying, wrong arithmetic operation).
     * Distractor B: Conceptual misconception (e.g., applying series formula instead of parallel formula, using sin instead of cos).
     * Distractor C: Trap/Partial answer (e.g., intermediate step, correct value but wrong unit).
4. VARY THE CORRECT OPTION POSITION:
   - Do NOT always place the correct answer at the same position. Distribute the correct option randomly across sequence numbers 1, 2, 3, or 4.
5. SCAFFOLDED SOLUTION STEPS:
   - Generate EXACTLY 1 to 2 solution steps ("solutionSteps" array) that scaffold the solution process for this visual question.
   - Each stepText must be phrased as a GUIDING QUESTION referencing specific values from that step (e.g., "What is the formula to calculate the area of the rectangle?", "What is the equivalent resistance of R1 and R2?").
   - Each step must contain its own optionsList with exactly 4 options (1 correct and 3 step-specific distractors).
6. DIAGRAM DATA SCHEMA ADHERENCE:
   - "diagramType" must be exactly: "{diagram_type}".
   - "diagramData" must exactly match the schema for the diagram type:

     parallel_circuit / series_circuit:
       {{ "voltage": <number or null>, "resistors": [<R1_ohms>, <R2_ohms>, ...] }}

     right_triangle / triangle / rectangle / circle:
       {{ "shape": "{diagram_type}",
          "labels": {{ "key": "value cm/m/°", ... }} }}
          (Ensure labels match side names or angles, e.g. for right_triangle: {{"hypotenuse": "?", "base": "6 cm", "height": "8 cm"}})

     graph:
       {{ "expression": "python-eval expression using x (e.g. x**2 or np.sin(x))",
          "x_range":    [min, max],
          "label":      "y = ..." }}

     scatter_3d:
       {{ "points":       [[x1,y1,z1], [x2,y2,z2], ...],
          "point_labels": ["A", "B", "C", ...],
          "x_range": [min, max], "y_range": [min, max], "z_range": [min, max] }}

   Use the exact values from diagram_data_hint.

7. Return ONLY valid, parseable JSON. Do NOT wrap inside markdown block fences.

JSON Schema:
{{
  "calculationDraft": "Step-by-step derivation of the correct answer AND the logic/misconception for each of the 3 distractors",
  "questionId":       "UUID",
  "questionType":     "image_mcq",
  "grade":            "{grade}",
  "subject":          "{subject}",
  "chapter":          "{chapter}",
  "topic":            "{topic}",
  "questionText":     "plain English question — must reference the diagram",
  "questionLatex":    "LaTeX version or empty string",
  "diagramType":      "{diagram_type}",
  "diagramData":      {{ }},
  "optionsList": [
    {{"optionSequenceNo": 1, "optionText": "...", "isCorrect": false}},
    {{"optionSequenceNo": 2, "optionText": "...", "isCorrect": false}},
    {{"optionSequenceNo": 3, "optionText": "...", "isCorrect": true}},
    {{"optionSequenceNo": 4, "optionText": "...", "isCorrect": false}}
  ],
  "solutionSteps": [
    {{
      "stepSequenceNo": 1,
      "stepText": "string — phrased as a GUIDING QUESTION referencing specific values from this step",
      "optionsList": [
        {{"optionSequenceNo": 1, "optionText": "Distractor Type A", "isCorrect": false}},
        {{"optionSequenceNo": 2, "optionText": "CORRECT intermediate result", "isCorrect": true}},
        {{"optionSequenceNo": 3, "optionText": "Distractor Type B", "isCorrect": false}},
        {{"optionSequenceNo": 4, "optionText": "Distractor Type C", "isCorrect": false}}
      ]
    }}
  ],
  "correctAnswer":      "the correct option text",
  "correctExplanation": "brief explanation"
}}
"""

def get_generation_user_prompt(grade: str, subject: str, chapter: str, topic: str, diagram_type: str, diagram_data_hint: dict, question_hint: str) -> str:
    return (
        f"Generate an image-MCQ for {grade} — {subject} — {chapter} — {topic}.\n"
        f"Diagram type : {diagram_type}\n"
        f"Diagram data : {json.dumps(diagram_data_hint)}\n"
        f"Base the question on: {question_hint}"
    )
