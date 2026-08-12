import os
import sys
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()

def get_llm():
    """
    Returns the primary LangChain ChatOpenAI model configured with fallbacks.
    Prioritizes Groq if GROQ_API_KEY is present, otherwise falls back to Hugging Face router.
    """
    groq_key = os.environ.get("GROQ_API_KEY")
    hf_key = os.environ.get("HUGGINGFACEHUB_API_TOKEN")

    if groq_key:
        primary_llm = ChatOpenAI(
            openai_api_base="https://api.groq.com/openai/v1",
            openai_api_key=groq_key,
            model_name="llama-3.3-70b-versatile",
            temperature=0.4,
            max_tokens=6000
        )
        fallback_llm = ChatOpenAI(
            openai_api_base="https://api.groq.com/openai/v1",
            openai_api_key=groq_key,
            model_name="llama-3.1-8b-instant",
            temperature=0.4,
            max_tokens=6000
        )
        print("AI Model initialized using Groq with llama-3.3-70b-versatile (and llama-3.1-8b-instant fallback).")
    elif hf_key:
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
        print("Error: Neither GROQ_API_KEY nor HUGGINGFACEHUB_API_TOKEN environment variable is set. Please set one of them in a .env file.")
        sys.exit(1)

    return primary_llm.with_fallbacks([fallback_llm])

def get_suggestions_llm():
    """
    Returns a lighter model instance with higher temperature for creative suggestions.
    """
    groq_key = os.environ.get("GROQ_API_KEY")
    hf_key = os.environ.get("HUGGINGFACEHUB_API_TOKEN")

    if groq_key:
        return ChatOpenAI(
            openai_api_base="https://api.groq.com/openai/v1",
            openai_api_key=groq_key,
            model_name="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=300
        )
    elif hf_key:
        return ChatOpenAI(
            openai_api_base="https://router.huggingface.co/v1",
            openai_api_key=hf_key,
            model_name="meta-llama/Llama-3.1-8B-Instruct",
            temperature=0.7,
            max_tokens=300
        )
    else:
        print("Error: Neither GROQ_API_KEY nor HUGGINGFACEHUB_API_TOKEN environment variable is set. Please set one of them in a .env file.")
        sys.exit(1)
