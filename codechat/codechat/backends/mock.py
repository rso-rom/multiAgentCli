import time

class MockBackend:
    def chat(self, prompt, stream=True, on_stream=None):
        response = "```python\nprint('Hello from Mock!')\n```"
        if stream:
            for c in response:
                if on_stream:
                    on_stream(c)
                time.sleep(0.001)
        else:
            return response
