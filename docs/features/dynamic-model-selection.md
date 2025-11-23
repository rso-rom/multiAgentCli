# Dynamische Model-Auswahl

## 🎯 Übersicht

Die Model-Auswahl ist **dynamisch** und **nicht statisch**! Das System:

✅ **Erkennt** verfügbare Ollama-Modelle automatisch
✅ **Zeigt** nur tatsächlich vorhandene Modelle an
✅ **Erlaubt** manuelle Eingabe für Custom Models
✅ **Aktualisiert** sich bei jedem Start

---

## 🔍 Wie funktioniert die Erkennung?

### 1. Ollama-Modelle (Dynamisch)

```typescript
// Automatisch erkennen:
ollama list
// → llama3:latest
// → codellama:latest
// → mistral:7b
// → custom-model:v2

// cacli zeigt alle diese Modelle an!
```

**Ablauf:**
1. cacli ruft `GET http://localhost:11434/api/tags` auf
2. Liest alle installierten Modelle aus
3. Zeigt sie im Auswahlmenü an
4. Falls Ollama nicht läuft: Fallback auf Standardmodelle

### 2. OpenAI-Modelle (Vordefiniert)

Da OpenAI eine fixe Liste hat, sind diese hart-codiert:
- GPT-4o
- GPT-4o-mini
- GPT-4-turbo

### 3. Claude-Modelle (Vordefiniert)

Anthropic's aktuelle Modelle:
- Claude 3.5 Sonnet
- Claude 3 Opus
- Claude 3 Haiku

### 4. Custom Models (Freie Eingabe)

```
? Select backend/model:
❯ Custom Model (enter name manually)

? Select backend for custom model: ollama
? Enter model name: my-custom-llama3:finetune

✅ Verwendet: ollama/my-custom-llama3:finetune
```

---

## 📊 Beispiel-Ablauf

### Szenario 1: Ollama mit vielen Modellen

```bash
# Du hast mehrere Modelle installiert:
ollama list
NAME                    SIZE
llama3:latest          4.7GB
llama3.2:latest        2.0GB
codellama:latest       3.8GB
mistral:7b             4.1GB
mixtral:8x7b          26GB
custom-model:v1        5.2GB

# cacli zeigt ALLE diese Modelle:
cacli
> Entwickle eine App

? Select backend/model for all agents:
  🤖 Auto
  ─── Available Backends ───
  Ollama (llama3:latest) - General purpose, free
  Ollama (llama3.2:latest) - Latest version, free
  Ollama (codellama:latest) - Code-specialized, free
  Ollama (mistral:7b) - Fast and capable, free
  Ollama (mixtral:8x7b) - High quality, free
❯ Ollama (custom-model:v1) - Local model, free
  Custom Model (enter manually)
```

### Szenario 2: Ollama offline

```bash
# Ollama läuft nicht:
? Select backend/model for all agents:
  🤖 Auto
  ─── Available Backends ───
  Ollama (llama3) - General purpose, free
  Ollama (codellama) - Code-specialized, free
  Ollama (mistral) - Fast and capable, free
  Custom Model (enter manually)

# → Fallback auf Standard-Modelle
```

### Szenario 3: Custom Model

```bash
? Select backend/model:
❯ Custom Model (enter name manually)

? Select backend: ollama
? Enter model name: deepseek-coder:33b

✅ Using: ollama/deepseek-coder:33b

📋 Backend Selection Summary:
────────────────────────────────────────
  requirements → ollama/deepseek-coder:33b
  architect    → ollama/deepseek-coder:33b
  developer    → ollama/deepseek-coder:33b
```

---

## 🚀 Vorteile

### 1. Immer Aktuell
```bash
# Neues Modell installieren:
ollama pull phi3

# Sofort verfügbar in cacli:
cacli
→ Zeigt "Ollama (phi3)" automatisch!
```

### 2. Keine Limitierung
```bash
# Eigene Fine-Tuned Models:
ollama create my-finance-llm -f Modelfile
ollama create my-code-assistant -f Modelfile

# Beide sofort nutzbar in cacli!
```

### 3. Flexible Backends
```
Custom Model funktioniert mit:
- Ollama (beliebiges Modell)
- OpenAI (beta-Modelle, custom endpoints)
- Claude (neue Modelle vor offiziellem Support)
- OpenWebUI (jedes verfügbare Modell)
```

---

## 🔧 Technische Details

### API-Aufruf

```typescript
// cacli ruft auf:
GET http://localhost:11434/api/tags

// Response:
{
  "models": [
    { "name": "llama3:latest", "size": 4700000000 },
    { "name": "codellama:latest", "size": 3800000000 },
    ...
  ]
}

// Wird zu Auswahloptionen:
[
  "Ollama (llama3:latest)",
  "Ollama (codellama:latest)",
  ...
]
```

### Fallback-Logik

```typescript
try {
  // Versuche Ollama API
  const models = await getOllamaModels();
} catch {
  // Falls offline: Standard-Modelle
  return ['llama3', 'codellama', 'mistral'];
}
```

### Model-Tags

```bash
# Voller Model-Name mit Tag:
llama3:latest
llama3:13b
llama3:70b
codellama:python

# Wird korrekt erkannt und angezeigt
```

---

## 💡 Use Cases

### Use Case 1: Entwicklung mit Custom Models

```bash
# Fine-Tuned für dein Projekt:
ollama create project-assistant -f Modelfile

# In cacli nutzen:
cacli
? Select model:
❯ Ollama (project-assistant) ✓
```

### Use Case 2: Experimentieren mit neuen Models

```bash
# Neues experimentelles Modell:
ollama pull experimental-llama4

# Sofort testen:
cacli -b ollama
# → Automatisch verfügbar in der Liste!
```

### Use Case 3: Verschiedene Model-Größen

```bash
ollama pull llama3:8b   # Klein, schnell
ollama pull llama3:13b  # Mittel, balanced
ollama pull llama3:70b  # Groß, beste Qualität

# Dynamisch je nach Task wählen:
- Simple Tasks → llama3:8b (schnell)
- Moderate → llama3:13b (balanced)
- Complex → llama3:70b (beste Qualität)
```

---

## 🎨 Erweiterte Konfiguration

### Eigene Modell-Beschreibungen

Für bessere UX kannst du Beschreibungen im Code anpassen:

```typescript
// In backend-selector.ts:
const ollamaDescriptions: Record<string, string> = {
  'llama3': 'General purpose, versatile',
  'codellama': 'Code-specialized model',
  'your-custom-model': 'Your custom description'  // ← Hier!
};
```

### Model-Aliase

```bash
# Freundliche Namen für Models:
ollama create gpt-killer -f Modelfile

# Wird angezeigt als:
"Ollama (gpt-killer) - Local model, free"
```

---

## 🧪 Testen

### Test 1: Dynamische Erkennung

```bash
# Vor dem Test:
ollama list
# 3 Modelle

# cacli starten:
cacli
? Select model:
# → Zeigt 3 Modelle

# Neues Modell installieren:
ollama pull phi3

# cacli neu starten:
cacli
? Select model:
# → Zeigt 4 Modelle! ✓
```

### Test 2: Custom Model

```bash
cacli
? Select backend/model:
❯ Custom Model

? Backend: ollama
? Model name: deepseek-coder:33b

# Test ob es funktioniert:
> Hello from DeepSeek!
```

### Test 3: Offline-Fallback

```bash
# Ollama stoppen:
pkill ollama

# cacli starten:
cacli
# → Zeigt Standard-Modelle (llama3, codellama, mistral)
# → Kein Fehler!
```

---

## ❓ FAQ

### Warum werden nicht alle Ollama-Modelle angezeigt?

→ cacli zeigt alle Modelle, die `ollama list` zeigt. Falls ein Modell fehlt:
```bash
ollama list  # Prüfe ob es hier ist
```

### Kann ich OpenAI-Custom-Models nutzen?

→ Ja! Wähle "Custom Model":
```
Backend: openai
Model: my-custom-gpt-4-fine-tune
```

### Wie füge ich neue Claude-Modelle hinzu?

→ Temporär: Nutze "Custom Model"
→ Dauerhaft: Füge in `backend-selector.ts` hinzu

### Werden Model-Listen gecached?

→ Nein! Bei jedem Workflow-Start wird neu abgefragt
→ Immer aktuell, keine veralteten Listen

---

## 🎯 Zusammenfassung

✅ **Ollama:** Vollständig dynamisch via API
✅ **Custom Models:** Freie Eingabe möglich
✅ **OpenAI/Claude:** Vordefiniert (fixe Listen)
✅ **Fallback:** Bei Offline/Fehler
✅ **Keine Limits:** Beliebige Custom Models
✅ **Immer aktuell:** Bei jedem Start neu

**Nächste Schritte:**
1. Installiere mehrere Ollama-Modelle
2. Starte cacli und sieh die dynamische Liste
3. Teste "Custom Model" für Experimente
4. Fine-Tune eigene Models und nutze sie sofort!

🚀 **Models sind jetzt dynamisch, nicht statisch!**
