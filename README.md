# 🤖 AI-Powered VTFR – Intelligent Learning & Assessment System

> **AI-powered step-by-step learning and assessment platform that evaluates not only the final answer, but also the student's reasoning process.**

---

## 📌 Overview

**VTFR (Virtual Time Fixed Response)** is an AI-powered intelligent learning and assessment system designed to improve traditional online examinations.

Traditional assessment systems generally evaluate whether a student's **final answer is correct or incorrect**. VTFR goes beyond this by analyzing the student's **step-by-step reasoning and conceptual understanding**.

The system uses **Generative AI, LangChain, and structured question generation** to create conceptual questions, guided reasoning steps, similar questions, and learning resources.

If a student makes a mistake during a reasoning step, VTFR provides appropriate learning resources and generates similar questions to help the student understand the concept.

---

## 🎯 Problem Statement

In traditional online examinations:

* Only the final answer is evaluated.
* The student's reasoning process is not captured.
* Teachers cannot easily identify where students made mistakes.
* Students may guess the correct answer without understanding the concept.
* Incorrect answers do not automatically lead to personalized learning.

### 💡 VTFR Solution

VTFR evaluates the student's **complete reasoning journey**.

```text
Topic
  ↓
AI Question Generation
  ↓
Main Question
  ↓
Step-by-Step Reasoning
  ↓
MCQ at Each Step
  ↓
Evaluate Student Response
  ↓
 ┌───────────────────┐
 │                   │
Correct            Incorrect
 │                   │
 ↓                   ↓
Next Step      Learning Resource
                     ↓
              Similar Question
                     ↓
                  Re-attempt
```

---

## 🚀 Key Features

### 1. 🧠 AI-Based Question Generation
The system generates conceptual questions based on the selected topic.
Each main question contains:
* Question & 4 multiple-choice options
* Correct answer
* Difficulty level
* Bloom's taxonomy level
* Guided reasoning steps
* Similar alternate questions for scaffolding

---

## 📂 Project Structure

This project uses a modular folder structure separating schemas, LLM configurations, prompts, and chains:

```text
MKCL_VTFR/
│
├── generate_vtfr.py      # Entry point — Interactive CLI VTFR Question Generator
├── config.py             # Syllabus configuration (Subjects, Chapters, and Topics)
├── schemas.py            # Pydantic schemas for structured question output
├── llm_factory.py        # Initializes LangChain models and handles fallback routing
├── prompts.py            # Prompts defined using ChatPromptTemplate
├── chains.py             # LangChain chains pairing prompts + LLMs + schemas
├── requirements.txt      # Required Python packages
├── .gitignore            # Tells Git which files to ignore (like .env and __pycache__)
│
├── .env.example          # Template for local environment variables
└── generated_question/   # Folder where generated JSON questions are saved
```

---

## 🚀 Setup Instructions

### Step 1: Clone the Repository
```bash
git clone https://github.com/adarsh456/VTFR-Project.git
cd VTFR-Project
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables (`.env`)
1. Create a copy of the `.env.example` file and name it `.env`.
2. Open your new `.env` file and add your API keys:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   HUGGINGFACEHUB_API_TOKEN=your_huggingface_api_key_here
   ```

---

## 🎮 How to Run

To run the interactive question generator, simply execute:
```bash
python generate_vtfr.py
```
