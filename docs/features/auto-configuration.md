# 🤖 Auto-Configuration - Self-Configuring Backend System

## 🎯 Übersicht

**Das System konfiguriert sich selbst!** cacli kann ein bereits konfiguriertes LLM nutzen, um automatisch neue Backends zu integrieren - ohne dass du Code schreiben musst.

### Wie funktioniert es?

1. **Research**: Ein bereits konfiguriertes Model (z.B. Ollama) recherchiert die API-Struktur des neuen Backends
2. **Generate**: Das System generiert automatisch den TypeScript-Code
3. **Configure**: Environment-Variablen werden automatisch gesetzt
4. **Test**: Die Verbindung wird getestet

**Das ist Meta-Programming:** Code, der Code schreibt! 🚀

---

## 💡 Warum Auto-Configuration?

### Problem: Backend-Integration ist aufwändig

Normalerweise musst du:
1. ❌ API-Dokumentation lesen
2. ❌ Backend-Klasse schreiben
3. ❌ Config-Dateien anpassen
4. ❌ Environment-Variablen setzen
5. ❌ Testen und Debuggen

**Zeitaufwand:** ~2-4 Stunden pro Backend

### Lösung: Auto-Configuration

Mit Auto-Configuration:
1. ✅ `cacli configure backend gemini`
2. ✅ API-Key eingeben
3. ✅ **Fertig!**

**Zeitaufwand:** ~2 Minuten! 🎉

---

## 🚀 Verwendung

### Methode 1: Direkter Befehl

```bash
# Backend mit API-Key konfigurieren
cacli configure backend gemini --api-key YOUR_API_KEY

# Backend ohne API-Key (wird später gesetzt)
cacli configure backend mistral
```

### Methode 2: Interaktiver Wizard

```bash
cacli configure interactive

# oder
cacli configure wizard
```

**Interaktiver Ablauf:**

```
🤖 Auto-Configuration Wizard

? Which backend would you like to configure?
  ❯ Gemini
    Mistral
    Cohere
    Huggingface
    Replicate
    Together
    Perplexity
    Groq
    Custom (enter manually)

? Enter your gemini API key (optional): ••••••••

🔍 Researching gemini API...
✅ Research complete!
   API URL: https://generativelanguage.googleapis.com/v1beta
   Auth: api-key
   Default Model: gemini-pro
   Streaming: Yes
   Vision: Yes

? Generate backend implementation? Yes

🔨 Generating backend code...
✅ Saved: src/backends/gemini.ts

🔧 Updating configuration files...
✅ Configuration files updated

⚙️  Configuring environment...
✅ Updated .env.example
✅ Updated .env with API key

🧪 Testing connection...
✅ Connection successful!
   Response: Hello from Gemini! I'm ready to help...

🎉 Auto-configuration complete!

📝 Next steps:
   1. Review generated code: src/backends/gemini.ts
   2. Set API key: GEMINI_API_KEY in .env
   3. Test: cacli -b gemini
```

### Methode 3: Liste verfügbarer Backends

```bash
cacli configure list

# Output:
🤖 Backends that can be auto-configured:

  • Gemini
  • Mistral
  • Cohere
  • Huggingface
  • Replicate
  • Together
  • Perplexity
  • Groq

Usage: cacli configure backend <name>
   or: cacli configure interactive
```

---

## 🔍 Wie funktioniert es technisch?

### Schritt 1: Research Phase

Das System nutzt ein bereits konfiguriertes LLM (z.B. Ollama mit llama3):

```typescript
const prompt = `Research the ${backendName} API and provide:

API_URL: [base endpoint]
AUTH_TYPE: [api-key, oauth, or none]
DEFAULT_MODEL: [recommended model]
SUPPORTS_VISION: [YES or NO]
SUPPORTS_STREAMING: [YES or NO]`;

const response = await llm.chat(prompt);
```

**Beispiel-Response:**

```
API_URL: https://api.mistral.ai/v1
AUTH_TYPE: api-key
DEFAULT_MODEL: mistral-medium
SUPPORTS_VISION: NO
SUPPORTS_STREAMING: YES
```

### Schritt 2: Code Generation

Das LLM generiert die komplette Backend-Implementierung:

```typescript
const prompt = `Generate TypeScript code for a ${backendName} backend.

Requirements:
- Class: ${className}
- Extends: ModelBackend
- API URL: ${config.apiUrl}
- Auth: ${config.authType}
- Streaming: ${config.supportsStreaming}
- Vision: ${config.supportsVision}

Generate ONLY TypeScript code, no explanations.`;

const code = await llm.chat(prompt);
```

**Generierter Code:**

```typescript
import axios from 'axios';
import { ModelBackend, StreamCallback } from './base';

export class GeminiBackend extends ModelBackend {
  private apiKey: string;
  private model: string;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey?: string, model = 'gemini-pro') {
    super();
    if (!apiKey) {
      throw new Error('API key required');
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
    // Implementation...
  }
}
```

### Schritt 3: Integration

Das System aktualisiert automatisch:

**src/config.ts:**
```typescript
// Auto-generated import
import { GeminiBackend } from './backends/gemini';

export type BackendName = '...' | 'gemini';

export function getBackend(name?: string) {
  // ...
  if (backend === 'gemini') {
    return new GeminiBackend(
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_MODEL || 'gemini-pro'
    );
  }
}
```

**src/orchestrator/backend-selector.ts:**
```typescript
// Auto-generated detection
if (process.env.GEMINI_API_KEY) {
  options.push({
    name: 'Gemini (gemini-pro)',
    backend: 'gemini',
    model: 'gemini-pro',
    available: true,
    description: 'Google\'s multimodal AI',
    cost: 'Paid'
  });
}
```

**.env.example:**
```env
# Gemini Configuration
GEMINI_API_KEY=
GEMINI_MODEL=gemini-pro
```

### Schritt 4: Testing

Das System testet die Verbindung:

```typescript
const backend = new GeminiBackend(apiKey, model);
const response = await backend.chat('Say "Hello from gemini!"');

if (response) {
  console.log('✅ Connection successful!');
} else {
  console.log('⚠️  Test failed');
}
```

---

## 📊 Unterstützte Backends

### Vorkonfiguriert

Diese Backends sind bereits vorbereitet:

| Backend | Provider | Hauptfeature | Kosten |
|---------|----------|--------------|--------|
| **gemini** | Google | Multimodal, Vision | Paid |
| **mistral** | Mistral AI | Schnell, Französisch | Paid |
| **cohere** | Cohere | Embeddings, RAG | Paid |
| **huggingface** | Hugging Face | Open Source Models | Free/Paid |
| **replicate** | Replicate | Community Models | Paid |
| **together** | Together AI | Open Source | Paid |
| **perplexity** | Perplexity | Web-Search-fähig | Paid |
| **groq** | Groq | Ultra-schnell | Paid |

### Custom Backends

Du kannst auch **beliebige andere Backends** hinzufügen:

```bash
cacli configure interactive

? Which backend would you like to configure?
  ❯ Custom (enter manually)

? Enter backend name: fireworks

🔍 Researching fireworks API...
# System recherchiert automatisch die API
```

---

## 🎯 Use Cases

### Use Case 1: Schnelles Experimentieren

**Situation:** Du willst ein neues Model ausprobieren

**Ohne Auto-Configuration:**
```bash
# 2 Stunden Arbeit:
# 1. Dokumentation lesen
# 2. Backend-Klasse schreiben
# 3. Tests schreiben
# 4. Debuggen
```

**Mit Auto-Configuration:**
```bash
cacli configure backend gemini --api-key YOUR_KEY
# 2 Minuten! ✅
cacli -b gemini
```

### Use Case 2: Multi-Backend Setup

**Situation:** Du willst mehrere Backends für verschiedene Tasks

```bash
# Alle Backends in 10 Minuten konfigurieren:
cacli configure backend gemini --api-key KEY1
cacli configure backend mistral --api-key KEY2
cacli configure backend cohere --api-key KEY3

# Jetzt verfügbar:
cacli -b gemini    # Vision-Tasks
cacli -b mistral   # Schnelle Tasks
cacli -b cohere    # RAG/Embeddings
```

### Use Case 3: Team-Onboarding

**Situation:** Neues Teammitglied will cacli nutzen

**Ohne Auto-Configuration:**
```
📖 Lies die 20-seitige Dokumentation
⌨️  Schreibe Backend-Code
🐛 Debug Fehler
⏰ Zeit: 4-6 Stunden
```

**Mit Auto-Configuration:**
```bash
cacli configure interactive
# Wizard führt durch die Konfiguration
# Zeit: 5 Minuten! ✅
```

### Use Case 4: Neue API-Version

**Situation:** Backend-Provider released neue API-Version

```bash
# Alte Version entfernen:
rm src/backends/gemini-old.ts

# Neue Version auto-generieren:
cacli configure backend gemini --api-key YOUR_KEY

# System generiert Code für die neueste API! ✅
```

---

## 🛠️ Anforderungen

### Mindestanforderungen

1. **Ein konfiguriertes Backend**
   - Ollama (empfohlen, kostenlos)
   - OpenAI
   - Claude
   - OpenWebUI
   - Jedes andere

2. **Internet-Verbindung**
   - Für API-Research
   - Für Backend-Tests

### Empfohlene Konfiguration

```env
# Mindestens ein Backend:
MODEL_BACKEND=ollama
OLLAMA_MODEL=llama3

# Optional: Bessere Models für Code-Generation:
MODEL_BACKEND=claude
ANTHROPIC_USE_OAUTH=true
```

**Tipp:** Für beste Code-Generierung nutze Claude oder GPT-4!

---

## 🎨 Erweiterte Nutzung

### Custom Model für Generation

Nutze ein spezifisches Model für die Code-Generierung:

```typescript
import { AutoConfigurator } from './setup/auto-configurator';
import { getBackend } from './config';

// Nutze Claude für bessere Code-Qualität
const llm = getBackend('claude');
const configurator = new AutoConfigurator(llm);

await configurator.configure('gemini', 'YOUR_API_KEY');
```

### Batch-Configuration

Konfiguriere mehrere Backends auf einmal:

```typescript
const backends = ['gemini', 'mistral', 'cohere'];
const apiKeys = {
  gemini: 'KEY1',
  mistral: 'KEY2',
  cohere: 'KEY3'
};

for (const backend of backends) {
  await configurator.configure(backend, apiKeys[backend]);
}
```

### Dry-Run Mode

Generiere Code ohne zu speichern:

```typescript
const config = await configurator.researchBackend('gemini');
const code = await configurator.generateBackendCode('gemini', config);

console.log('Generated code:');
console.log(code);

// Code wird nicht gespeichert
```

---

## 📝 Generierte Dateien

Nach Auto-Configuration werden folgende Dateien **automatisch** erstellt/aktualisiert:

### Neue Dateien

```
src/backends/gemini.ts          # Backend-Implementierung
```

### Aktualisierte Dateien

```
src/config.ts                   # Backend-Registration
src/orchestrator/backend-selector.ts  # Backend-Detection
.env.example                    # Environment-Template
.env                           # Deine Konfiguration
```

---

## 🧪 Testing

### Manuelle Tests

Nach der Konfiguration:

```bash
# 1. Backend verfügbar?
cacli configure list

# 2. Connection testen:
cacli -b gemini ask "Hello!"

# 3. Im REPL:
cacli -b gemini
> Hello from Gemini!
```

### Automatische Tests

Das System führt automatisch Tests durch:

```typescript
✅ Research successful
✅ Code generation successful
✅ Files saved
✅ Configuration updated
✅ Environment configured
🧪 Testing connection...
✅ Connection successful!
```

Falls ein Test fehlschlägt:

```
⚠️  Connection test failed: Invalid API key
   This is normal - you may need to adjust the generated code
```

---

## 🔧 Troubleshooting

### Problem: Research schlägt fehl

**Symptom:**
```
❌ Could not research backend API
```

**Lösung:**
1. Prüfe Internet-Verbindung
2. Stelle sicher, dass ein Backend konfiguriert ist
3. Nutze ein besseres Model (Claude statt Ollama)

```bash
# Besseres Model nutzen:
MODEL_BACKEND=claude cacli configure backend gemini
```

### Problem: Code-Generierung fehlerhaft

**Symptom:**
```
⚠️  Test failed: Syntax error
```

**Lösung:**
1. Review den generierten Code in `src/backends/gemini.ts`
2. Manuell korrigieren
3. Oder erneut generieren mit besserem Model

```bash
# Code-Qualität verbessern:
cacli configure backend gemini --api-key KEY
# Nutzt das beste verfügbare Model
```

### Problem: API-Key falsch

**Symptom:**
```
⚠️  Test failed: 401 Unauthorized
```

**Lösung:**
1. Prüfe API-Key in `.env`
2. Generiere neuen Key beim Provider
3. Update .env und test erneut

```bash
# .env
GEMINI_API_KEY=your-new-api-key-here

# Test:
cacli -b gemini ask "Test"
```

### Problem: Backend existiert bereits

**Symptom:**
```
❌ Backend file already exists
```

**Lösung:**
1. Backup der alten Datei erstellen
2. Datei löschen oder umbenennen
3. Erneut konfigurieren

```bash
# Backup:
mv src/backends/gemini.ts src/backends/gemini.old.ts

# Neu generieren:
cacli configure backend gemini
```

---

## 🎯 Best Practices

### 1. Nutze gute Models für Generation

**Empfehlung:**
- ✅ Claude 3.5 Sonnet (beste Code-Qualität)
- ✅ GPT-4 (sehr gut)
- ⚠️  Llama3 (ok, manchmal Fehler)
- ❌ Kleine Models (<7B) - zu unzuverlässig

```env
# Für Auto-Configuration:
MODEL_BACKEND=claude
ANTHROPIC_USE_OAUTH=true
```

### 2. Review generierten Code

Auch wenn das System Code generiert - **immer reviewen!**

```bash
# Nach Generierung:
cat src/backends/gemini.ts

# Prüfe:
# - Imports korrekt?
# - Error Handling vorhanden?
# - Streaming implementiert?
# - Types korrekt?
```

### 3. Version Control

Committe generierten Code:

```bash
git add src/backends/gemini.ts
git commit -m "feat: add Gemini backend (auto-generated)"

# Falls Änderungen nötig:
git add src/backends/gemini.ts
git commit -m "fix: adjust Gemini API calls"
```

### 4. Teste gründlich

```bash
# Unit-Tests:
npm test src/backends/gemini.test.ts

# Integration-Tests:
cacli -b gemini ask "Hello!"
cacli -b gemini  # REPL-Test

# Vision-Test (falls unterstützt):
cacli -b gemini vision "Describe this image" image.jpg
```

### 5. Dokumentiere Custom Backends

```markdown
# docs/backends/gemini.md

## Gemini Backend

Auto-generated: 2024-01-15
Model: gemini-pro

### Configuration
\`\`\`env
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-pro
\`\`\`

### Features
- ✅ Chat
- ✅ Streaming
- ✅ Vision
- ❌ Function Calling
```

---

## 📊 Vergleich: Manuell vs. Auto-Configuration

| Aspekt | Manuell | Auto-Configuration |
|--------|---------|-------------------|
| **Zeit** | 2-4 Stunden | 2-5 Minuten |
| **Code-Qualität** | Hoch (wenn erfahren) | Mittel-Hoch |
| **Fehleranfälligkeit** | Mittel | Niedrig |
| **Dokumentation** | Manuell schreiben | Auto-generiert |
| **API-Updates** | Manuell anpassen | Neu generieren |
| **Learning Curve** | Steil | Flach |
| **Customization** | Voll | Begrenzt |

**Empfehlung:**
- 🚀 **Prototyping:** Auto-Configuration
- 🏗️ **Produktion:** Auto-Configuration + Review
- 🎯 **Custom Features:** Manuell erweitern

---

## 🔮 Zukünftige Features

### In Planung

- [ ] **Model-Switcher für Generation**
  ```bash
  cacli configure backend gemini --generator-model claude
  ```

- [ ] **Dry-Run Mode**
  ```bash
  cacli configure backend gemini --dry-run
  # Zeigt generierten Code, speichert nicht
  ```

- [ ] **Template System**
  ```bash
  cacli configure backend gemini --template openai-compatible
  # Nutzt Template für ähnliche APIs
  ```

- [ ] **Update Command**
  ```bash
  cacli configure update gemini
  # Regeneriert für neue API-Version
  ```

- [ ] **Batch Configuration**
  ```bash
  cacli configure batch gemini,mistral,cohere
  # Konfiguriert mehrere auf einmal
  ```

---

## 🎉 Zusammenfassung

### Was ist Auto-Configuration?

Ein **selbst-konfigurierendes System**, das:
- ✅ Ein bestehendes LLM nutzt, um neue Backends zu recherchieren
- ✅ Automatisch TypeScript-Code generiert
- ✅ Konfigurationsdateien aktualisiert
- ✅ Environment-Variablen setzt
- ✅ Verbindungen testet

### Warum Auto-Configuration?

- ⏱️ **Zeit:** 2 Minuten statt 4 Stunden
- 🎯 **Einfachheit:** Ein Befehl statt 10 Dateien
- 🚀 **Geschwindigkeit:** Sofort loslegen
- 🔄 **Updates:** Neu generieren statt manuell anpassen

### Wie nutze ich es?

```bash
# Einfach:
cacli configure backend gemini --api-key YOUR_KEY

# Interaktiv:
cacli configure interactive

# Liste:
cacli configure list
```

### Wann nutze ich es?

- ✅ Neues Backend ausprobieren
- ✅ Team-Onboarding
- ✅ Prototyping
- ✅ API-Updates
- ⚠️  Production (mit Review!)

---

## 📚 Nächste Schritte

1. **Ausprobieren:**
   ```bash
   cacli configure interactive
   ```

2. **Dokumentation:**
   - [Backend hinzufügen (manuell)](adding-new-backend.md)
   - [Multi-Backend Setup](multi-backend-agents.md)
   - [Setup Wizard](../setup/setup-wizard.md)

3. **Support:**
   - GitHub Issues: [Report a Bug](https://github.com/your-repo/issues)
   - Discussions: [Ask Questions](https://github.com/your-repo/discussions)

🚀 **Viel Erfolg mit Auto-Configuration!**
