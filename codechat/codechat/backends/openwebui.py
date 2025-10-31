import requests

class OpenWebUIBackend:
    def __init__(self, url):
        self.url = url.rstrip("/")

    def chat(self, prompt, stream=True, on_stream=None):
        payload = {"prompt": prompt, "stream": stream}
        r = requests.post(self.url, json=payload, stream=stream)
        if stream:
            for line in r.iter_lines(decode_unicode=True):
                if line and on_stream:
                    on_stream(line)
        else:
            return r.text
