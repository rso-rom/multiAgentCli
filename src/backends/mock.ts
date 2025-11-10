import { ModelBackend, StreamCallback } from './base';

export class MockBackend extends ModelBackend {
  async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
    const resp = `\`\`\`python
# Mock improved file
print("Hello from Mock")
\`\`\``;
    if (onStream) {
      for (const ch of resp) {
        onStream(ch);
        await new Promise((r) => setTimeout(r, 2));
      }
      return;
    }
    return resp;
  }
}
