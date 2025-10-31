import requests, json

class OpenAIBackend:
    def __init__(self, api_key, model="gpt-4o-mini"):
        self.api_key = api_key
        self.model = model
        self.url = "https://api.openai.com/v1/chat/completions"

    def chat(self, prompt, stream=True, on_stream=None):
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type":"application/json"}
        payload = {
            "model": self.model,
            "messages": [{"role":"user","content":prompt}],
            "stream": stream
        }
        r = requests.post(self.url, headers=headers, json=payload, stream=stream)
        if stream:
            for line in r.iter_lines(decode_unicode=True):
                if line.startswith("data: "):
                    data = line[6:]
                    if data.strip() == "[DONE]":
                        break
                    try:
                        j = json.loads(data)
                        delta = j["choices"][0]["delta"].get("content", "")
                        if on_stream:
                            on_stream(delta)
                    except Exception:
                        pass
        else:
            return r.json()["choices"][0]["message"]["content"]
