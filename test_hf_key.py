import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
api_key = os.environ.get("huggingface_API_KEY", "")

print(f"Key prefix : {api_key[:10] if api_key else 'MISSING'}")
print(f"Key length : {len(api_key)} characters")
print(f"Starts with hf_: {api_key.startswith('hf_')}")

if not api_key:
    print("\nERROR: huggingface_API_KEY not found in .env")
    exit(1)

client = OpenAI(base_url="https://router.huggingface.co/v1", api_key=api_key)

try:
    resp = client.chat.completions.create(
        model="meta-llama/Llama-3.1-8B-Instruct",
        messages=[{"role": "user", "content": "Say OK"}],
        max_tokens=5
    )
    print("\nSUCCESS! API key is valid.")
    print("Model response:", resp.choices[0].message.content)
except Exception as e:
    print(f"\nFAILED: {e}")
    print("\nFix: Go to https://huggingface.co/settings/tokens and create a new token")
    print("Make sure 'Make calls to the serverless Inference API' permission is enabled.")
