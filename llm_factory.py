import os
import sys
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()

def get_llm():
    """
    Returns the primary LangChain model with multi-provider fallbacks (Groq + HuggingFace Router).
    """
    llms = []

    # Provider 1: Groq API (Primary - Free & Fast)
    groq_key = (os.environ.get("GROQ_API_KEY") or "").strip().strip('"\'')
    if groq_key:
        llms.append(
            ChatOpenAI(
                openai_api_base="https://api.groq.com/openai/v1",
                openai_api_key=groq_key,
                model_name="llama-3.1-8b-instant",
                temperature=0.4,
                max_tokens=6000
            )
        )

    # Provider 2: Hugging Face Router
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

    if not llms:
        print("Error: Neither GROQ_API_KEY nor HUGGINGFACEHUB_API_TOKEN is set in .env file.")
        sys.exit(1)

    primary = llms[0]
    fallbacks = llms[1:]
    
    if fallbacks:
        return primary.with_fallbacks(fallbacks)
    return primary


def get_suggestions_llm():
    """
    Returns a lighter model instance with higher temperature for creative suggestions and evaluation.
    """
    groq_key = (os.environ.get("GROQ_API_KEY") or "").strip().strip('"\'')
    if groq_key:
        return ChatOpenAI(
            openai_api_base="https://api.groq.com/openai/v1",
            openai_api_key=groq_key,
            model_name="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=1500
        )

    hf_key = (os.environ.get("HUGGINGFACEHUB_API_TOKEN") or os.environ.get("huggingface_API_KEY") or "").strip().strip('"\'')
    if hf_key:
        return ChatOpenAI(
            openai_api_base="https://router.huggingface.co/v1",
            openai_api_key=hf_key,
            model_name="meta-llama/Llama-3.1-8B-Instruct",
            temperature=0.7,
            max_tokens=1500
        )

    print("Error: Neither GROQ_API_KEY nor HUGGINGFACEHUB_API_TOKEN is set in .env file.")
    sys.exit(1)
