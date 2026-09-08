import os
import sys
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()

def get_llm():
    """
    Returns the primary LangChain model with multi-provider fallbacks.
    Prioritizes active working Hugging Face Router models (Llama 3.3 70B and Qwen 2.5 72B)
    and Groq API.
    """
    llms = []

    # Provider 1: Hugging Face Router - Llama 3.3 70B (Primary - Active & Working)
    hf_key = (os.environ.get("HUGGINGFACEHUB_API_TOKEN") or os.environ.get("huggingface_API_KEY") or "").strip().strip('"\'')
    if hf_key:
        llms.append(
            ChatOpenAI(
                openai_api_base="https://router.huggingface.co/v1",
                openai_api_key=hf_key,
                model_name="meta-llama/Llama-3.3-70B-Instruct",
                temperature=0.4,
                max_tokens=6000
            )
        )
        # Provider 2: Hugging Face Router - Qwen 2.5 72B (Fallback 1)
        llms.append(
            ChatOpenAI(
                openai_api_base="https://router.huggingface.co/v1",
                openai_api_key=hf_key,
                model_name="Qwen/Qwen2.5-72B-Instruct",
                temperature=0.4,
                max_tokens=6000
            )
        )

    # Provider 3: Groq API (Fallback 2)
    groq_key = (os.environ.get("GROQ_API_KEY") or "").strip().strip('"\'')
    if groq_key:
        llms.append(
            ChatOpenAI(
                openai_api_base="https://api.groq.com/openai/v1",
                openai_api_key=groq_key,
                model_name="llama-3.3-70b-versatile",
                temperature=0.4,
                max_tokens=6000
            )
        )

    if not llms:
        print("Error: Neither HUGGINGFACEHUB_API_TOKEN nor GROQ_API_KEY is set in .env file.")
        sys.exit(1)

    primary = llms[0]
    fallbacks = llms[1:]
    
    if fallbacks:
        return primary.with_fallbacks(fallbacks)
    return primary


def get_suggestions_llm():
    """
    Returns a model instance for suggestions with multi-provider fallbacks.
    """
    llms = []

    hf_key = (os.environ.get("HUGGINGFACEHUB_API_TOKEN") or os.environ.get("huggingface_API_KEY") or "").strip().strip('"\'')
    if hf_key:
        llms.append(
            ChatOpenAI(
                openai_api_base="https://router.huggingface.co/v1",
                openai_api_key=hf_key,
                model_name="meta-llama/Llama-3.3-70B-Instruct",
                temperature=0.7,
                max_tokens=1500
            )
        )
        llms.append(
            ChatOpenAI(
                openai_api_base="https://router.huggingface.co/v1",
                openai_api_key=hf_key,
                model_name="Qwen/Qwen2.5-72B-Instruct",
                temperature=0.7,
                max_tokens=1500
            )
        )

    groq_key = (os.environ.get("GROQ_API_KEY") or "").strip().strip('"\'')
    if groq_key:
        llms.append(
            ChatOpenAI(
                openai_api_base="https://api.groq.com/openai/v1",
                openai_api_key=groq_key,
                model_name="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=1500
            )
        )

    if not llms:
        print("Error: Neither HUGGINGFACEHUB_API_TOKEN nor GROQ_API_KEY is set in .env file.")
        sys.exit(1)

    primary = llms[0]
    fallbacks = llms[1:]
    if fallbacks:
        return primary.with_fallbacks(fallbacks)
    return primary
