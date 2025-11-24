# Neues Backend/Model anbinden

## 🎯 Übersicht

Diese Anleitung zeigt Schritt-für-Schritt, wie du ein neues AI-Backend (z.B. Google Gemini, Mistral AI, Cohere, etc.) zu cacli hinzufügst.

---

## 📋 Voraussetzungen

Du solltest verstehen:
- TypeScript Grundlagen
- REST APIs und HTTP Requests
- Async/Await
- Die Struktur des Projekts

---

## 🔧 Schritt 1: Backend-Klasse erstellen

Erstelle eine neue Datei in `src/backends/`:

```typescript
// src/backends/gemini.ts
import axios from 'axios';
import { ModelBackend, StreamCallback } from './base';
import { ImageInput } from '../utils/image-handler';

export class GeminiBackend extends ModelBackend {
  private apiKey: string;
  private model: string;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey?: string, model = 'gemini-pro') {
    super();

    if (!apiKey) {
      throw new Error('Google Gemini API key is required');
    }

    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Check if model supports vision
   */
  supportsVision(): boolean {
    return this.model.includes('vision') || this.model === 'gemini-pro-vision';
  }

  /**
   * Main chat method - REQUIRED
   */
  async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
    const url = `${this.apiUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    try {
      if (!onStream) {
        // Non-streaming request
        const response = await axios.post(url, payload);
        return response.data.candidates[0].content.parts[0].text;
      }

      // Streaming request
      const response = await axios.post(url, payload, {
        responseType: 'stream',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      for await (const chunk of response.data as any) {
        const text = chunk.toString();
        try {
          const json = JSON.parse(text);
          if (json.candidates && json.candidates[0]) {
            const content = json.candidates[0].content.parts[0].text;
            onStream(content);
          }
        } catch {
          onStream(text);
        }
      }
    } catch (error: any) {
      const errorMsg = `Gemini API Error: ${error.message}`;
      if (onStream) {
        onStream(errorMsg);
      }
      return errorMsg;
    }
  }

  /**
   * Vision support - OPTIONAL
   */
  async analyzeImage(
    prompt: string,
    images: ImageInput[],
    onStream?: StreamCallback
  ): Promise<string | void> {
    if (!this.supportsVision()) {
      throw new Error(`Model ${this.model} does not support vision. Use 'gemini-pro-vision'.`);
    }

    const url = `${this.apiUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const parts = [
      { text: prompt },
      ...images.map(img => ({
        inline_data: {
          mime_type: img.mimeType || 'image/jpeg',
          data: img.base64
        }
      }))
    ];

    const payload = {
      contents: [{ parts }]
    };

    try {
      const response = await axios.post(url, payload);
      const result = response.data.candidates[0].content.parts[0].text;

      if (onStream) {
        onStream(result);
      }

      return result;
    } catch (error: any) {
      const errorMsg = `Gemini Vision Error: ${error.message}`;
      if (onStream) {
        onStream(errorMsg);
      }
      return errorMsg;
    }
  }
}
```

---

## 🔌 Schritt 2: Backend registrieren

Füge das Backend in `src/config.ts` hinzu:

### 2.1 Import hinzufügen

```typescript
// src/config.ts
import { GeminiBackend } from './backends/gemini';
```

### 2.2 Type erweitern

```typescript
export type BackendName = 'ollama' | 'openwebui' | 'openai' | 'anthropic' | 'claude' | 'gemini' | 'mock';
```

### 2.3 Factory-Funktion erweitern

```typescript
export function getBackend(name?: string) {
  const backend = (name || process.env.MODEL_BACKEND || 'mock').toLowerCase();

  // ... existing backends ...

  if (backend === 'gemini') {
    return new GeminiBackend(
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_MODEL || 'gemini-pro'
    );
  }

  return new MockBackend();
}
```

---

## ⚙️ Schritt 3: Environment-Variablen

Füge die Konfiguration in `.env.example` hinzu:

```env
# Google Gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-pro
```

---

## 🎨 Schritt 4: Backend-Selector erweitern

Füge das Backend in `src/orchestrator/backend-selector.ts` hinzu:

### 4.1 Backend-Detection

```typescript
private static async detectAvailableBackends(): Promise<BackendOption[]> {
  const backends: BackendOption[] = [];

  // ... existing backends ...

  // Gemini
  if (process.env.GEMINI_API_KEY) {
    backends.push({
      name: 'Google Gemini',
      backend: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-pro',
      description: 'Google\'s multimodal AI',
      cost: 'paid',
      available: true
    });
  }

  return backends;
}
```

### 4.2 Model-Defaults

```typescript
private static getDefaultModel(backend: string): string {
  const defaults: Record<string, string> = {
    ollama: 'llama3',
    openai: 'gpt-4o-mini',
    claude: 'claude-3-5-sonnet-20241022',
    anthropic: 'claude-3-5-sonnet-20241022',
    openwebui: 'llama3',
    gemini: 'gemini-pro',  // ← Hier!
    mock: 'mock'
  };

  return defaults[backend] || 'llama3';
}
```

### 4.3 Modell-Beschreibungen

```typescript
private static getModelDescription(backend: string, model: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    // ... existing descriptions ...
    gemini: {
      'gemini-pro': 'General purpose, multimodal',
      'gemini-pro-vision': 'Vision-enabled model',
      'gemini-ultra': 'Most capable model'
    }
  };

  return descriptions[backend]?.[model] || 'AI model';
}
```

---

## 📚 Schritt 5: Setup-Wizard erweitern

Füge das Backend in `src/setup/setup-wizard.ts` hinzu:

```typescript
private getBackendChoices(): any[] {
  return [
    { name: '🦙 Ollama (Free, Local)', value: 'ollama' },
    { name: '🌐 OpenWebUI (Free, Local)', value: 'openwebui' },
    { name: '🤖 OpenAI (Paid, Cloud)', value: 'openai' },
    { name: '🧠 Claude/Anthropic (Paid, Cloud)', value: 'anthropic' },
    { name: '💎 Google Gemini (Paid, Cloud)', value: 'gemini' },  // ← Hier!
    { name: '🧪 Mock (Testing)', value: 'mock' },
  ];
}
```

Und füge die Konfigurationslogik hinzu:

```typescript
private async collectAnswers(): Promise<SetupAnswers> {
  const answers = await inquirer.prompt([
    // ... existing questions ...
  ]);

  // Backend-specific configuration
  if (answers.backend === 'gemini') {
    const geminiConfig = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your Google Gemini API key:',
        validate: (input: string) => input.length > 0 || 'API key is required'
      },
      {
        type: 'list',
        name: 'model',
        message: 'Select Gemini model:',
        choices: [
          'gemini-pro',
          'gemini-pro-vision',
          'gemini-ultra'
        ],
        default: 'gemini-pro'
      }
    ]);

    answers.geminiApiKey = geminiConfig.apiKey;
    answers.geminiModel = geminiConfig.model;
  }

  return answers;
}
```

---

## ✅ Schritt 6: Testen

### 6.1 Unit-Test erstellen

Erstelle `src/backends/__tests__/gemini.test.ts`:

```typescript
import { GeminiBackend } from '../gemini';

describe('GeminiBackend', () => {
  it('should create instance with API key', () => {
    const backend = new GeminiBackend('test-api-key', 'gemini-pro');
    expect(backend).toBeDefined();
  });

  it('should throw error without API key', () => {
    expect(() => new GeminiBackend()).toThrow('API key is required');
  });

  it('should detect vision support', () => {
    const backend = new GeminiBackend('key', 'gemini-pro-vision');
    expect(backend.supportsVision()).toBe(true);
  });

  it('should not detect vision for non-vision models', () => {
    const backend = new GeminiBackend('key', 'gemini-pro');
    expect(backend.supportsVision()).toBe(false);
  });
});
```

### 6.2 Integration-Test

```bash
# .env
MODEL_BACKEND=gemini
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-pro

# Test
npm start
> Hello from Gemini!
```

### 6.3 Build-Test

```bash
npm run build
# → Sollte ohne Fehler kompilieren
```

---

## 📊 Backend-Vergleich

| Feature | Ollama | OpenAI | Claude | Gemini |
|---------|--------|--------|--------|--------|
| **Kosten** | Kostenlos | Bezahlt | Bezahlt | Bezahlt |
| **Offline** | ✅ | ❌ | ❌ | ❌ |
| **Vision** | ✅ (llava) | ✅ | ✅ | ✅ |
| **Streaming** | ✅ | ✅ | ✅ | ✅ |
| **OAuth** | ❌ | ❌ | ✅ | ❌ |
| **API Key** | ❌ | ✅ | ✅ | ✅ |

---

## 🎯 Best Practices

### 1. Error Handling

Behandle alle möglichen Fehler:

```typescript
try {
  const response = await axios.post(url, payload);
  return response.data.result;
} catch (error: any) {
  // Spezifische Fehler
  if (error.response?.status === 401) {
    throw new Error('Invalid API key');
  }
  if (error.response?.status === 429) {
    throw new Error('Rate limit exceeded');
  }

  // Allgemeine Fehler
  throw new Error(`API Error: ${error.message}`);
}
```

### 2. Streaming

Implementiere sowohl Streaming als auch Non-Streaming:

```typescript
async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
  if (!onStream) {
    // Non-streaming: Warte auf komplette Antwort
    const response = await api.generate(prompt);
    return response.text;
  }

  // Streaming: Sende Chunks sofort
  for await (const chunk of api.stream(prompt)) {
    onStream(chunk.text);
  }
}
```

### 3. Vision Support

Nur wenn das Backend es unterstützt:

```typescript
supportsVision(): boolean {
  // Prüfe ob Modell Vision unterstützt
  return this.model.includes('vision');
}

async analyzeImage(...): Promise<string | void> {
  if (!this.supportsVision()) {
    throw new Error('Vision not supported');
  }

  // Implementierung...
}
```

### 4. Konfiguration

Nutze Environment-Variablen:

```typescript
constructor(apiKey?: string, model?: string) {
  super();

  // Fallback auf ENV
  this.apiKey = apiKey || process.env.BACKEND_API_KEY;
  this.model = model || process.env.BACKEND_MODEL || 'default-model';

  // Validierung
  if (!this.apiKey) {
    throw new Error('API key required');
  }
}
```

### 5. TypeScript Types

Definiere klare Typen:

```typescript
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface GeminiPayload {
  contents: Array<{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
  }>;
}
```

---

## 🔍 Debugging

### Logs aktivieren

```typescript
async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
  if (process.env.DEBUG) {
    console.log('[Gemini] Request:', { model: this.model, prompt });
  }

  const response = await this.callAPI(prompt);

  if (process.env.DEBUG) {
    console.log('[Gemini] Response:', response);
  }

  return response;
}
```

### Test-Modus

```typescript
constructor(apiKey?: string, model?: string, testMode = false) {
  super();
  this.testMode = testMode || process.env.NODE_ENV === 'test';

  if (this.testMode) {
    // Mock responses
    return;
  }

  // Normale Initialisierung
}
```

---

## 📝 Dokumentation

Erstelle eine Feature-Dokumentation:

```markdown
# docs/features/gemini-backend.md

## Google Gemini Backend

### Konfiguration

\`\`\`env
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-pro
\`\`\`

### Modelle

- **gemini-pro**: General purpose
- **gemini-pro-vision**: Mit Bild-Support
- **gemini-ultra**: Höchste Qualität

### Verwendung

\`\`\`bash
cacli -b gemini
> Hello from Gemini!
\`\`\`
```

---

## 🚀 Deployment

### NPM Package aktualisieren

1. **package.json** aktualisieren
2. **README.md** erweitern
3. **CHANGELOG.md** schreiben
4. Version bumpen: `npm version minor`
5. Publishen: `npm publish`

---

## 📋 Checkliste

Bei jedem neuen Backend:

- [ ] Backend-Klasse in `src/backends/` erstellt
- [ ] `ModelBackend` korrekt erweitert
- [ ] `chat()` Methode implementiert
- [ ] Streaming unterstützt
- [ ] Vision (optional) implementiert
- [ ] In `src/config.ts` registriert
- [ ] Type `BackendName` erweitert
- [ ] In `backend-selector.ts` hinzugefügt
- [ ] In `setup-wizard.ts` hinzugefügt
- [ ] Environment-Variablen in `.env.example`
- [ ] Unit-Tests geschrieben
- [ ] Integration-Tests durchgeführt
- [ ] Dokumentation erstellt
- [ ] README.md aktualisiert
- [ ] Build erfolgreich (`npm run build`)
- [ ] Commit & Push

---

## 🎉 Beispiele

### Minimales Backend (Nur Chat)

```typescript
export class SimpleBackend extends ModelBackend {
  async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
    const response = await fetch('https://api.example.com/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    return data.response;
  }
}
```

### Backend mit Streaming

```typescript
export class StreamingBackend extends ModelBackend {
  async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
    const response = await fetch('https://api.example.com/stream', {
      method: 'POST',
      body: JSON.stringify({ prompt, stream: true })
    });

    if (!onStream) {
      const data = await response.json();
      return data.response;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      onStream(chunk);
    }
  }
}
```

### Backend mit Vision

```typescript
export class VisionBackend extends ModelBackend {
  supportsVision(): boolean {
    return true;
  }

  async analyzeImage(
    prompt: string,
    images: ImageInput[],
    onStream?: StreamCallback
  ): Promise<string | void> {
    const payload = {
      prompt,
      images: images.map(img => ({
        data: img.base64,
        type: img.mimeType
      }))
    };

    const response = await fetch('https://api.example.com/vision', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    return data.analysis;
  }
}
```

---

## 💡 Häufige Backends

### Mistral AI

```typescript
export class MistralBackend extends ModelBackend {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model = 'mistral-medium') {
    super();
    this.apiKey = apiKey || process.env.MISTRAL_API_KEY || '';
    this.model = model;
  }

  async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        stream: !!onStream
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: onStream ? 'stream' : 'json'
      }
    );

    if (!onStream) {
      return response.data.choices[0].message.content;
    }

    // Handle streaming...
  }
}
```

### Cohere

```typescript
export class CohereBackend extends ModelBackend {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model = 'command') {
    super();
    this.apiKey = apiKey || process.env.COHERE_API_KEY || '';
    this.model = model;
  }

  async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
    const response = await axios.post(
      'https://api.cohere.ai/v1/generate',
      {
        model: this.model,
        prompt,
        stream: !!onStream
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.generations[0].text;
  }
}
```

---

## 🎓 Zusammenfassung

**Neue Backend hinzufügen:**

1. ✅ Klasse in `src/backends/` erstellen
2. ✅ `ModelBackend` erweitern
3. ✅ In `src/config.ts` registrieren
4. ✅ In `backend-selector.ts` hinzufügen
5. ✅ Environment-Variablen definieren
6. ✅ Tests schreiben
7. ✅ Dokumentieren

**Benötigte Dateien:**

- `src/backends/new-backend.ts` (Implementierung)
- `src/backends/__tests__/new-backend.test.ts` (Tests)
- `docs/features/new-backend.md` (Dokumentation)

**Änderungen in existierenden Dateien:**

- `src/config.ts` (Registration)
- `src/orchestrator/backend-selector.ts` (Detection)
- `src/setup/setup-wizard.ts` (Setup)
- `.env.example` (Konfiguration)

🚀 **Viel Erfolg beim Integrieren neuer Backends!**
