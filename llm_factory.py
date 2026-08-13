import os
import sys
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()

def get_llm():
    """
    Returns the primary LangChain ChatOpenAI model configured with fallbacks.
    Uses Hugging Face router.
    """
    hf_key = os.environ.get("HUGGINGFACEHUB_API_TOKEN") or os.environ.get("huggingface_API_KEY")

    if hf_key:
        primary_llm = ChatOpenAI(
            openai_api_base="https://router.huggingface.co/v1",
            openai_api_key=hf_key,
            model_name="meta-llama/Llama-3.3-70B-Instruct",
            temperature=0.4,
            max_tokens=6000
        )
        fallback_llm = ChatOpenAI(
            openai_api_base="https://router.huggingface.co/v1",
            openai_api_key=hf_key,
            model_name="meta-llama/Llama-3.1-8B-Instruct",
            temperature=0.4,
            max_tokens=6000
        )
        print("AI Model initialized using HuggingFace Router with Llama-3.3-70B (and Llama-3.1-8B fallback).")
    else:
        print("Error: HUGGINGFACEHUB_API_TOKEN environment variable is not set. Please set it in a .env file.")
        sys.exit(1)

    return primary_llm.with_fallbacks([fallback_llm])

def get_suggestions_llm():
    """
    Returns a lighter model instance with higher temperature for creative suggestions.
    """
    hf_key = os.environ.get("HUGGINGFACEHUB_API_TOKEN") or os.environ.get("huggingface_API_KEY")

    if hf_key:
        return ChatOpenAI(
            openai_api_base="https://router.huggingface.co/v1",
            openai_api_key=hf_key,
            model_name="meta-llama/Llama-3.1-8B-Instruct",
            temperature=0.7,
            max_tokens=300
        )
    else:
        print("Error: HUGGINGFACEHUB_API_TOKEN environment variable is not set. Please set it in a .env file.")
        sys.exit(1)
