import os
import re
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/config", tags=["Configuration & API Keys"])

def get_env_paths() -> List[str]:
    """Returns absolute paths to all .env files in the project."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    backend_env = os.path.join(base_dir, ".env")
    root_env = os.path.abspath(os.path.join(base_dir, "..", ".env"))
    
    paths = []
    if os.path.exists(root_env):
        paths.append(root_env)
    if os.path.exists(backend_env) and backend_env not in paths:
        paths.append(backend_env)
        
    # If neither exists, default to creating at both locations
    if not paths:
        paths = [root_env, backend_env]
    return paths

def mask_key(key: Optional[str]) -> Optional[str]:
    if not key or not key.strip():
        return None
    k = key.strip().strip("'\"")
    if len(k) <= 8:
        return "••••••••"
    return f"{k[:4]}••••••••{k[-4:]}"

def update_env_file(filepath: str, key_name: str, key_value: str):
    """Updates or appends a key=value pair in the given .env file."""
    lines = []
    key_found = False
    clean_val = key_value.strip().strip("'\"")
    pattern = re.compile(rf"^\s*{re.escape(key_name)}\s*=", re.IGNORECASE)

    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            lines = f.readlines()

    new_lines = []
    for line in lines:
        if pattern.match(line):
            new_lines.append(f"{key_name}={clean_val}\n")
            key_found = True
        else:
            new_lines.append(line)

    if not key_found:
        if new_lines and not new_lines[-1].endswith("\n"):
            new_lines.append("\n")
        new_lines.append(f"{key_name}={clean_val}\n")

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

def read_key_from_env_or_os(key_names: List[str]) -> str:
    """Checks os.environ first, then .env files."""
    for kn in key_names:
        val = os.environ.get(kn)
        if val and val.strip():
            return val.strip().strip("'\"")

    for p in get_env_paths():
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    for kn in key_names:
                        if re.match(rf"^\s*{re.escape(kn)}\s*=", line, re.IGNORECASE):
                            parts = line.strip().split("=", 1)
                            if len(parts) == 2 and parts[1].strip():
                                return parts[1].strip().strip("'\"")
    return ""

class UpdateApiKeysRequest(BaseModel):
    provider: Optional[str] = "all"  # 'groq', 'huggingface', or 'all'
    groq_api_key: Optional[str] = None
    huggingface_api_key: Optional[str] = None

@router.get("/api-keys")
def get_api_keys_status():
    """Returns the current configuration status and masked keys for Groq and Hugging Face."""
    groq_key = read_key_from_env_or_os(["GROQ_API_KEY"])
    hf_key = read_key_from_env_or_os(["HUGGINGFACEHUB_API_TOKEN", "HUGGINGFACE_API_KEY", "huggingface_API_KEY"])
    env_paths = get_env_paths()

    return {
        "status": "success",
        "envFiles": env_paths,
        "providers": {
            "groq": {
                "id": "groq",
                "name": "Groq Cloud API",
                "isConfigured": bool(groq_key),
                "maskedKey": mask_key(groq_key),
                "models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
                "envVar": "GROQ_API_KEY"
            },
            "huggingface": {
                "id": "huggingface",
                "name": "Hugging Face Inference API",
                "isConfigured": bool(hf_key),
                "maskedKey": mask_key(hf_key),
                "models": ["meta-llama/Llama-3.3-70B-Instruct", "Qwen/Qwen2.5-72B-Instruct"],
                "envVar": "HUGGINGFACEHUB_API_TOKEN"
            }
        }
    }

@router.post("/api-keys")
def update_api_keys(req: UpdateApiKeysRequest):
    """
    Updates the Groq and/or Hugging Face API keys in all .env files and current os.environ.
    """
    env_paths = get_env_paths()
    updated = {}

    if req.groq_api_key is not None:
        clean_groq = req.groq_api_key.strip().strip("'\"")
        if clean_groq:
            os.environ["GROQ_API_KEY"] = clean_groq
            for path in env_paths:
                update_env_file(path, "GROQ_API_KEY", clean_groq)
            updated["groq"] = True

    if req.huggingface_api_key is not None:
        clean_hf = req.huggingface_api_key.strip().strip("'\"")
        if clean_hf:
            os.environ["HUGGINGFACEHUB_API_TOKEN"] = clean_hf
            os.environ["HUGGINGFACE_API_KEY"] = clean_hf
            for path in env_paths:
                update_env_file(path, "HUGGINGFACEHUB_API_TOKEN", clean_hf)
            updated["huggingface"] = True

    if not updated and req.groq_api_key is None and req.huggingface_api_key is None:
        raise HTTPException(status_code=400, detail="No API key provided to update.")

    return {
        "status": "success",
        "message": f"Successfully updated API key(s) in {len(env_paths)} .env file(s) and runtime environment.",
        "updated": updated,
        "envFiles": env_paths,
        "currentStatus": get_api_keys_status()
    }
