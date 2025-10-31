import requests, json

class OllamaBackend:
    def __init__(self, url="http://localhost:11434", model="llama3"):
        self.url = url.rstrip("/")
        self.model = model

    def chat(self, prompt, stream=True, on_stream=None):
        payload = {"model": self.model, "prompt": prompt}
        r = requests.post(f"{self.url}/api/generate", json=payload, stream=stream)
        if stream:
            for line in r.iter_lines(decode_unicode=True):
                if not line:
                    continue
                try:
                    j = json.loads(line)
                    part = j.get("response", "")
                    if on_stream:
                        on_stream(part)
                except Exception:
                    pass
        else:
            return r.text
