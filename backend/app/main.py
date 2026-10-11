import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

from .db import init_db
from .api.v1 import api_v1_router

app = FastAPI(
    title="VTFR System API",
    description="Virtual Time Fixed Response AI-Powered Intelligent Learning & Assessment Engine",
    version="1.0.0"
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static asset directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount concept cards directory for direct image access
concept_cards_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "generated_question", "concept_cards"))
if not os.path.exists(concept_cards_dir):
    concept_cards_dir = os.path.abspath("generated_question/concept_cards")
os.makedirs(concept_cards_dir, exist_ok=True)
app.mount("/concept_cards", StaticFiles(directory=concept_cards_dir), name="concept_cards")
app.mount("/static/concept_cards", StaticFiles(directory=concept_cards_dir), name="static_concept_cards")

# Mount full generated_question directory
gen_q_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "generated_question"))
if not os.path.exists(gen_q_dir):
    gen_q_dir = os.path.abspath("generated_question")
os.makedirs(gen_q_dir, exist_ok=True)
app.mount("/generated_question", StaticFiles(directory=gen_q_dir), name="generated_question")

# Include API Routers
app.include_router(api_v1_router)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "VTFR Backend Engine",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
