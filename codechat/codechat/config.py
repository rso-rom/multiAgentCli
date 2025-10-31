import os
from codechat.backends.ollama import OllamaBackend
from codechat.backends.openwebui import OpenWebUIBackend
from codechat.backends.openai import OpenAIBackend
from codechat.backends.mock import MockBackend

def get_backend(override=None):
    backend = (override or os.getenv("MODEL_BACKEND", "mock")).lower()
    if backend == "ollama":
        return OllamaBackend(
            url=os.getenv("OLLAMA_URL", "http://localhost:11434"),
            model=os.getenv("OLLAMA_MODEL", "llama3")
        )
    if backend == "openwebui":
        return OpenWebUIBackend(
            url=os.getenv("OPENWEBUI_URL", "http://localhost:3000/api/v1/generate")
        )
    if backend == "openai":
        return OpenAIBackend(
            api_key=os.getenv("OPENAI_API_KEY"),
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        )
    return MockBackend()
