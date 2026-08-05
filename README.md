# VTFR Intelligent Learning System - Question Generator

Welcome to the **VTFR Question Generator** project! This is an AI-powered system designed to generate Virtual Time Fixed Response (VTFR) adaptive learning questions for students across various grades and subjects.

---

## 📂 Project Structure

This project uses a simple and flat folder structure, making it easy for anyone on the team to find and edit code:

```text
VTFR-Intelligent-Learning-System/
│
├── run_generator.py      # Entry point — Run this to start generating questions
├── generator.py          # Core logic (interacts with LLMs, shuffles options, validates outputs)
├── config.py             # Syllabus configuration (Subjects, Chapters, and Topics)
├── prompt_templates.py   # AI instructions (System & User prompt structures)
├── requirements.txt      # Required Python packages
├── .gitignore            # Tells Git which files to ignore (like .env and __pycache__)
│
├── .env.example          # Template for your local environment variables
└── output/               # Folder where generated JSON questions are saved
```

---

## 🚀 Setup Instructions

Follow these simple steps to set up and run the project locally on your machine:

### Step 1: Clone the Repository
```bash
git clone https://github.com/adarsh456/VTFR-Project.git
cd VTFR-Project
```

### Step 2: Install Dependencies
Install the required Python libraries using `pip`:
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables (`.env`)
1. Create a copy of the `.env.example` file and name it `.env`:
   * On Windows: `copy .env.example .env`
   * On macOS/Linux: `cp .env.example .env`
2. Open your new `.env` file and add your API keys:
   ```env
   # Add one or both API keys
   GROQ_API_KEY=your_groq_api_key_here
   huggingface_API_KEY=your_huggingface_api_key_here
   ```
   *(Note: Do **not** commit your `.env` file to GitHub. It is ignored by default).*

---

## 🎮 How to Run

To run the interactive question generator, simply execute:
```bash
python run_generator.py
```

### What happens next?
1. The generator will ask you to select a **Grade Level** (Grade 1 - 12, College/University, or Custom).
2. It will prompt you to select a **Subject** (Mathematics, Physics, Chemistry, or Custom).
3. It will ask for a **Chapter** and **Topic** (either chosen from the syllabus or custom).
4. The system will call the AI model to generate a question, shuffle the options, fix any UUIDs, and save the result as a `.json` file inside the `output/` directory.

---

## 🤝 Contributing Guidelines
* **Create a Branch**: If adding a new feature, create a new branch (`git checkout -b feature-name`).
* **Keep it Simple**: Keep the flat folder structure unless we agree as a team to organize into folders.
* **Test Before Committing**: Run `python run_generator.py` to verify your changes did not break the app.
