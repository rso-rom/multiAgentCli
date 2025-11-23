# 🤖 Agentic Auto-Configuration - LLM mit Tool-Nutzung

## 🎯 Übersicht

**Das LLM ist jetzt ein Agent!** Statt dass wir im Code Web-Requests machen, kann das LLM **selbst Tools wie curl/wget nutzen**, um APIs zu erforschen.

### Was ist Agentic AI?

**Agentic AI** = AI, die **Tools nutzen** kann, um Aufgaben selbstständig zu lösen.

**Vorher (Passive AI):**
```
Wir: "Recherchiere Gemini API"
LLM: "Basierend auf meinem Training..."
     [Nutzt veraltetes Wissen]
```

**Jetzt (Agentic AI):**
```
Wir: "Recherchiere Gemini API"
LLM: "Ich werde curl nutzen:"
     [TOOL:curl:https://docs.gemini.ai/api-reference]
     [System führt curl aus]
LLM: "Basierend auf der aktuellen Dokumentation..."
     [Nutzt Live-Daten!]
```

---

## 🚀 Wie funktioniert es?

### 1. LLM bekommt Tools

Das LLM wird informiert, welche Tools verfügbar sind:

```typescript
Tools available:
- curl: Fetch web content
- wget: Download files
- http_get: Simple HTTP requests

Format: [TOOL:curl:https://example.com]
```

### 2. LLM entscheidet selbst

```
LLM: "To research the Gemini API, I will first fetch the docs:
      [TOOL:curl:https://docs.gemini.ai/api-reference]

      Then check the API endpoint:
      [TOOL:http_get:https://generativelanguage.googleapis.com/v1beta/models]"
```

### 3. System führt Tools aus

```typescript
🔧 Executing tool: curl https://docs.gemini.ai/api-reference
✅ Tool executed successfully (15432 bytes)

🔧 Executing tool: http_get https://generativelanguage.googleapis.com/v1beta/models
✅ Tool executed successfully (2891 bytes)
```

### 4. LLM analysiert Ergebnisse

```
LLM: "Based on the documentation and API response:

      API_URL: https://generativelanguage.googleapis.com/v1beta
      AUTH_TYPE: api-key
      DEFAULT_MODEL: gemini-pro
      SUPPORTS_VISION: YES
      SUPPORTS_STREAMING: YES"
```

---

## 💡 3 Modi verfügbar

### Modus 1: **Agentic Tool Use** (Standard, Beste Qualität)

```bash
cacli configure backend gemini --api-key KEY
```

**Was passiert:**
```
🤖 Agentic Tool Use: Enabled (LLM can use curl/wget)
🔄 Agentic iteration 1/3...
🔧 Executing 2 tool call(s)...
  ✅ curl:https://docs.gemini.ai/api-reference
  ✅ http_get:https://generativelanguage.googleapis.com/v1beta/models
🔄 Agentic iteration 2/3...
✅ Research complete!
```

**Vorteile:**
- ✅ LLM entscheidet selbst, welche URLs wichtig sind
- ✅ Kann mehrere Iterationen machen
- ✅ Passt sich dynamisch an
- ✅ Beste Ergebnisse

### Modus 2: **Web Search** (Pre-Fetch)

```bash
cacli configure backend gemini --api-key KEY --no-agentic-tools
```

**Was passiert:**
```
🌐 Web Search: Enabled (pre-fetch documentation)
🌐 Searching web for gemini API documentation...
✅ Found documentation at: https://docs.gemini.ai/api-reference
🔎 Searching GitHub for gemini examples...
✅ Found 847 GitHub examples
```

**Vorteile:**
- ✅ Schneller (keine Iterationen)
- ✅ Weniger LLM-Calls
- ⚠️  Weniger flexibel

### Modus 3: **LLM Knowledge Only** (Offline)

```bash
cacli configure backend gemini --api-key KEY --no-web-search
```

**Was passiert:**
```
📚 LLM Knowledge Only: No web access
[Nutzt nur Training-Daten]
```

**Vorteile:**
- ✅ Funktioniert offline
- ✅ Am schnellsten
- ⚠️  Kann veraltet sein

---

## 📊 Modi-Vergleich

| Feature | Agentic 🤖 | Web Search 🌐 | LLM Only 📚 |
|---------|-----------|---------------|-------------|
| **Genauigkeit** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Aktualität** | Live-Daten | Live-Daten | Training-Cutoff |
| **Flexibilität** | LLM entscheidet | Vordefiniert | Keine |
| **Iterationen** | Ja (max 3) | Nein | Nein |
| **Geschwindigkeit** | ⭐⭐ (~10-20s) | ⭐⭐⭐ (~5-10s) | ⭐⭐⭐⭐⭐ (~2s) |
| **LLM-Calls** | 1-3 | 1 | 1 |
| **Internet** | Erforderlich | Erforderlich | Nicht nötig |

**Empfehlung:** Agentic Tool Use für beste Ergebnisse!

---

## 🔍 Technische Details

### Tool-Format

Das LLM nutzt folgendes Format für Tool-Calls:

```
[TOOL:tool_name:arguments]
```

**Beispiele:**

```
[TOOL:curl:https://docs.gemini.ai/api-reference]
[TOOL:wget:https://api.example.com/docs.html]
[TOOL:http_get:https://api.example.com/v1/models]
```

### Agentic Loop

```typescript
while (iteration < maxIterations) {
  // 1. LLM gibt Antwort (mit Tool-Calls)
  const response = await llm.chat(prompt);

  // 2. Parse Tool-Calls
  const toolCalls = parseToolCalls(response);

  // 3. Führe Tools aus
  const results = await executeTools(toolCalls);

  // 4. Gib Feedback an LLM
  prompt = `Tool results: ${results}\n\nAnalyze and continue...`;

  // 5. Repeat oder finish
}
```

### Sicherheit

**Sanitization:**
```typescript
// Entfernt gefährliche Zeichen:
- ; | & ` $ ( )  // Shell-Operators
- --exec, --config  // Gefährliche Flags

// Erlaubt nur sichere curl/wget Optionen
```

**Timeout:**
```typescript
timeout: 10000ms  // 10 Sekunden max
maxBuffer: 10000  // Max 10KB Output
```

**Output-Limiting:**
```typescript
// Output wird auf 10KB begrenzt
if (output.length > 10000) {
  output = output.substring(0, 10000) + '\n[truncated]';
}
```

---

## 🎯 Use Cases

### Use Case 1: Unbekanntes Backend

**Szenario:** Du willst ein neues, unbekanntes Backend nutzen.

```bash
cacli configure backend fireworks --api-key KEY
```

**Agentic LLM:**
```
🤖 "I don't have training data for 'fireworks', let me research:

[TOOL:curl:https://docs.fireworks.ai/api-reference]
[TOOL:http_get:https://api.fireworks.ai/v1/models]

After analyzing the docs, I found:
API_URL: https://api.fireworks.ai/v1
..."
```

**Ergebnis:** Auch unbekannte Backends funktionieren! ✅

### Use Case 2: API-Version-Update

**Szenario:** Backend hat API aktualisiert.

**Mit Agentic:**
```bash
cacli configure backend gemini  # Holt neueste Version!
```

Das LLM fetcht immer die **aktuelle** Dokumentation.

### Use Case 3: Custom Endpoints

**Szenario:** Backend nutzt non-standard URLs.

**Agentic LLM probiert mehrere:**
```
[TOOL:curl:https://docs.backend.ai/api-reference]  # ❌ 404
[TOOL:curl:https://backend.ai/docs/api]  # ❌ 404
[TOOL:curl:https://developers.backend.com/api]  # ✅ 200
```

Findet automatisch die richtige URL!

---

## 🛠️ Verfügbare Tools

### 1. curl

```bash
[TOOL:curl:https://api.example.com/docs]
```

**Verwendet für:**
- API-Dokumentation abrufen
- Endpoints testen
- HTML/JSON-Responses

**Optionen:**
```bash
[TOOL:curl:https://api.example.com/v1/models -H "Accept: application/json"]
```

### 2. wget

```bash
[TOOL:wget:https://example.com/documentation.html]
```

**Verwendet für:**
- Dokumentations-Downloads
- Static Files
- Große Responses

### 3. http_get

```bash
[TOOL:http_get:https://api.example.com/v1/info]
```

**Verwendet für:**
- Einfache GET-Requests
- API-Tests
- Quick Checks

---

## 📝 Beispiel-Ablauf

### Full Agentic Workflow

```bash
$ cacli configure backend mistral --api-key YOUR_KEY

🎯 Configuration mode:
   🤖 Agentic Tool Use: Enabled (LLM can use curl/wget)

🤖 Auto-configuring backend: mistral
📡 Using OllamaBackend to research and generate code...

🔍 Researching mistral API...
🤖 Using agentic tool-based research...
🤖 Starting agentic research for mistral...

🔄 Agentic iteration 1/3...
🔧 Executing 2 tool call(s)...
  🔧 Executing tool: curl https://docs.mistral.ai/api-reference
  ✅ Tool executed successfully (8523 bytes)
  🔧 Executing tool: http_get https://api.mistral.ai/v1/models
  ✅ Tool executed successfully (1842 bytes)

🔄 Agentic iteration 2/3...

✅ Research complete!
   API URL: https://api.mistral.ai/v1
   Auth: api-key
   Default Model: mistral-medium
   Streaming: Yes
   Vision: No

? Generate backend implementation? Yes

🔨 Generating backend code...
🌐 Searching for mistral code examples...
✅ Found official SDK: mistral-sdk

✅ Saved: src/backends/mistral.ts

🔧 Updating configuration files...
✅ Configuration files updated

⚙️  Configuring environment...
✅ Updated .env.example
✅ Updated .env with API key

🧪 Testing connection...
✅ Connection successful!

🎉 Auto-configuration complete!
```

---

## 🔧 Erweiterte Nutzung

### Custom Tool Timeout

```typescript
const toolExecutor = new ToolExecutor();
toolExecutor.timeout = 20000;  // 20 Sekunden
```

### Mehr Iterationen erlauben

```typescript
// In auto-configurator.ts:
const maxIterations = 5;  // Standard: 3
```

### Debug-Modus

```bash
DEBUG=1 cacli configure backend gemini

# Zeigt alle Tool-Calls und Responses
```

---

## 🎨 LLM-Verhalten

### Was das LLM typischerweise macht:

**Iteration 1:**
```
"I'll start by fetching the main documentation:"
[TOOL:curl:https://docs.gemini.ai/api-reference]
```

**Iteration 2:**
```
"Based on the docs, let me check available models:"
[TOOL:http_get:https://generativelanguage.googleapis.com/v1beta/models]
```

**Iteration 3:**
```
"Now I have all information needed:
API_URL: ...
AUTH_TYPE: ...
..."
```

### Fallback-Logik:

1. **Iteration 1 failed?** → Versucht alternative URLs
2. **Iteration 2 failed?** → Nutzt verfügbare Infos
3. **Iteration 3 failed?** → Fallback auf Web-Search-Modus

---

## ⚙️ Konfiguration

### Agentic deaktivieren

```bash
# Nutze Web-Search statt Agentic:
cacli configure backend gemini --no-agentic-tools

# Nutze nur LLM-Wissen:
cacli configure backend gemini --no-web-search
```

### Programmatisch

```typescript
import { AutoConfigurator } from './setup/auto-configurator';

// Agentic aktiviert:
const configurator = new AutoConfigurator(
  llm,          // LLM Backend
  true,         // Web Search
  true          // Agentic Tools
);

// Nur Web Search:
const configurator = new AutoConfigurator(llm, true, false);

// Nur LLM:
const configurator = new AutoConfigurator(llm, false, false);
```

---

## 🧪 Testing

### Test 1: Agentic Mode

```bash
cacli configure backend gemini --api-key KEY

# Erwartung:
# - LLM macht Tool-Calls
# - curl/wget werden ausgeführt
# - 1-3 Iterationen
# - Erfolgreiche Konfiguration
```

### Test 2: Tool-Call Parsing

```typescript
const response = `
I'll fetch the docs:
[TOOL:curl:https://docs.example.com]

Then check the API:
[TOOL:http_get:https://api.example.com/v1]
`;

const calls = toolExecutor.parseToolCalls(response);
// Ergebnis: 2 Tool-Calls erkannt
```

### Test 3: Fallback

```bash
# Ollama offline → Fallback auf LLM-Wissen
pkill ollama
cacli configure backend mistral

# Sollte trotzdem funktionieren (mit veralteten Daten)
```

---

## 🎓 Fazit

### Das System ist jetzt:

1. **🤖 Agentic** - LLM nutzt Tools selbstständig
2. **🌐 Connected** - Holt Live-Daten aus dem Internet
3. **🔄 Iterative** - Kann mehrfach nachfragen
4. **🎯 Smart** - Passt sich an verschiedene APIs an
5. **🛡️ Sicher** - Sanitization & Timeouts

### Workflow:

```
Nutzer: "Configure Gemini"
    ↓
LLM: "Ich nutze curl..."
    ↓
System: [Führt curl aus]
    ↓
LLM: "Basierend auf der Doku..."
    ↓
System: [Generiert Code]
    ↓
✅ Fertig!
```

### Nächste Schritte:

1. **Ausprobieren:**
   ```bash
   cacli configure backend gemini --api-key YOUR_KEY
   ```

2. **Vergleichen:**
   ```bash
   # Agentic vs. Web Search vs. LLM Only
   ```

3. **Erweitern:**
   - Weitere Tools hinzufügen (git, npm, etc.)
   - Mehr Iterationen erlauben
   - Custom Tool-Executor schreiben

🚀 **Das System kann sich jetzt selbst erweitern - mit Live-Internet-Zugriff!**
