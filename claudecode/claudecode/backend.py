import os
import time
import requests
import json

# Simple adapter pattern. Add more backends by implementing the functions used below.

def get_backend(model=None):
    backend = os.getenv("MODEL_BACKEND", "mock").lower()
    if model:
        backend = model
    if backend == "openai":
        return OpenAIBackend(api_key=os.getenv("OPENAI_API_KEY"), model_name=os.getenv("OPENAI_MODEL","gpt-4o-mini"))
    if backend == "ollama":
        return OllamaBackend(url=os.getenv("OLLAMA_URL","http://localhost:11434"), model_name=os.getenv("OLLAMA_MODEL","llama2"))
    return MockBackend()

class MockBackend:
    def chat(self, prompt, stream=False, on_stream=None):
        # naive mock that echoes back with code fence if "code" in prompt
        if "code" in prompt.lower():
            resp = "```python\n# example generated\nprint('Hello from mock')\n```"
        else:
            resp = "Mock response to: " + (prompt[:200] + "..." if len(prompt)>200 else prompt)
        if stream and on_stream:
            for ch in resp:
                on_stream(ch)
                time.sleep(0.002)
            return ""
        return resp

class OpenAIBackend:
    def __init__(self, api_key, model_name="gpt-4o-mini"):
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY missing for OpenAI backend")
        self.api_key = api_key
        self.model_name = model_name
        self.url = "https://api.openai.com/v1/chat/completions"

    def chat(self, prompt, stream=False, on_stream=None):
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type":"application/json"}
        payload = {
            "model": self.model_name,
            "messages":[{"role":"user","content":prompt}],
            "max_tokens": 800,
            "temperature":0.2,
            "stream": stream
        }
        if stream:
            with requests.post(self.url, headers=headers, json=payload, stream=True, timeout=120) as r:
                buf = ""
                for line in r.iter_lines(decode_unicode=True):
                    if not line:
                        continue
                    # OpenAI streaming sends lines like: data: {...}
                    text = line.lstrip("data: ").strip()
                    if text == "[DONE]":
                        break
                    try:
                        j = json.loads(text)
                        delta = j["choices"][0]["delta"].get("content", "")
                    except Exception:
                        delta = ""
                    if on_stream:
                        on_stream(delta)
                    else:
                        buf += delta
                return buf
        else:
            r = requests.post(self.url, headers=headers, json=payload, timeout=60)
            r.raise_for_status()
            j = r.json()
            return j["choices"][0]["message"]["content"]

class OllamaBackend:
    def __init__(self, url="http://localhost:11434", model_name="llama2"):
        self.url = url.rstrip("/")
        self.model = model_name

    def chat(self, prompt, stream=False, on_stream=None):
        # Ollama local HTTP API (simple variant)
        inst = {"model": self.model, "input": prompt}
        r = requests.post(f"{self.url}/api/generate", json=inst, stream=stream, timeout=120)
        if stream:
            buf = ""
            for chunk in r.iter_content(chunk_size=None, decode_unicode=True):
                if not chunk:
                    continue
                if on_stream:
                    on_stream(chunk)
                else:
                    buf += chunk
            return buf
        else:
            return r.text
