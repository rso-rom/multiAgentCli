# Memory System Testing Guide

## ✅ Status: Alle 4 Memory-Ebenen aktiviert!

### Was läuft:
- ✅ **Qdrant**: `http://localhost:6333` (Docker Container)
- ✅ **LMDB**: `./memory` (Lokaler Ordner)
- ✅ **Embeddings**: LM Studio (für Semantic Search)

---

## 🧠 Die 4 Memory-Ebenen

### 1. **Short-term Memory** (LMDB, ephemeral)
- **Lebensdauer**: Nur während der aktuellen Session
- **Geschwindigkeit**: ⚡⚡⚡ Ultra-schnell
- **Verwendung**: Temporäre Variablen, Session-State
- **Beispiel**: Aktueller Konversations-Kontext

### 2. **Mid-term Memory** (LMDB, persistent)
- **Lebensdauer**: Über Sessions hinweg
- **Geschwindigkeit**: ⚡⚡ Sehr schnell
- **Verwendung**: Agent-Konfigurationen, Token-Cache
- **Beispiel**: OAuth2 Tokens, API Keys

### 3. **Long-term Memory** (Qdrant, semantic)
- **Lebensdauer**: Dauerhaft
- **Geschwindigkeit**: ⚡ Schnell
- **Verwendung**: Wissens-Datenbank mit Semantic Search
- **Beispiel**: Code-Snippets, Dokumentationen, Projektinfos

### 4. **Global Memory** (Qdrant, shared)
- **Lebensdauer**: Projekt-übergreifend
- **Geschwindigkeit**: ⚡ Schnell
- **Verwendung**: Wiederverwendbares Wissen
- **Beispiel**: Best Practices, Pattern Libraries

---

## 🧪 Memory Testing

### Test 1: Prompt-History mit Semantic Search

**Starte REPL:**
```bash
npm run build
npm start repl
```

**Stelle verschiedene Fragen:**
```
> ask Wie erstelle ich einen Webshop?
> ask Was ist das MVC Pattern?
> ask Erkläre REST APIs
> ask Wie funktioniert OAuth2?
```

**Suche in der History (Semantic Search):**
```
> history webshop
```
→ Findet ähnliche Prompts auch wenn Wortlaut anders ist!

```
> history authentication
```
→ Findet "OAuth2" Prompt, obwohl du "authentication" gesucht hast!

**Liste letzte Prompts:**
```
> history
```
→ Zeigt die letzten 10 Prompts

---

### Test 2: Memory in Workflows

**Erstelle einen Test-Workflow mit Memory:**

```yaml
# memory-test-workflow.yml
name: memory-test
description: Testet Memory-Features

agents:
  learner:
    role: "Lernender Agent"
    backend: ollama
    model: llama-3.2-3b-instruct

  teacher:
    role: "Lehrender Agent"
    backend: ollama
    model: llama-3.2-3b-instruct

steps:
  - agent: learner
    input: |
      Lerne folgende Information:
      "Das Singleton Pattern stellt sicher, dass eine Klasse nur eine Instanz hat."

      Speichere dies in deinem Gedächtnis.

  - agent: teacher
    input: |
      Erkläre das Singleton Pattern basierend auf dem was du gelernt hast.
    context_keys: ["learner"]
```

**Führe aus:**
```bash
> orchestrate memory-test-workflow.yml
```

Agents nutzen automatisch:
- **Short-term**: Für aktuellen Step-Kontext
- **Mid-term**: Für Agent-spezifische Daten
- **Long-term**: Für semantische Suche

---

### Test 3: Code-Speicherung mit Semantic Search

**Im REPL:**
```
> load beispiel.py
> ask Speichere diesen Code in meinem Long-term Memory mit dem Tag "python-examples"
```

Später kannst du nach ähnlichem Code suchen!

---

### Test 4: Persistent Memory über Sessions

**Session 1:**
```bash
npm start repl
> ask Merke dir: Mein Lieblings-Framework ist React
> exit
```

**Session 2 (Neu starten):**
```bash
npm start repl
> ask Was ist mein Lieblings-Framework?
```

Die KI sollte sich erinnern (über Mid-term Memory)!

---

## 📊 Memory Inspector

**Prüfe was gespeichert ist:**

### LMDB (Short/Mid-term):
```bash
# Schaue in den memory Ordner
dir memory
```

Du siehst:
- `short-term.mdb` - Aktuelle Session
- `mid-term.mdb` - Persistent

### Qdrant (Long-term/Global):

**Web UI öffnen:**
```
http://localhost:6333/dashboard
```

Hier siehst du:
- Collections (Datenbank-Tables)
- Gespeicherte Vektoren
- Anzahl der Einträge

**API Check:**
```bash
curl http://localhost:6333/collections
```

---

## 🎯 Praktischer Test: Webshop-Projekt

### Schritt 1: Projekt starten
```bash
> orchestrate webshop-arc42-workflow.yml
```

**Was passiert im Memory:**
- **Short-term**: Kontext zwischen Agents (Architect → Developer)
- **Mid-term**: Workflow-State, Agent-Konfigurationen
- **Long-term**: Generierter Code, Architektur-Entscheidungen
- **Global**: arc42 Template-Wissen

### Schritt 2: Später wieder aufnehmen

**Neue Session:**
```bash
npm start repl
> history arc42
```

→ Findet alle arc42-bezogenen Prompts!

```bash
> ask Was war die Architektur vom Webshop-Projekt?
```

→ Agent kann auf Long-term Memory zugreifen!

---

## 🔧 Memory-Konfiguration

### In `.env`:
```env
# Memory aktiviert
USE_QDRANT=true
QDRANT_URL=http://localhost:6333

# Embedding für Semantic Search
EMBEDDING_SERVICE=ollama
EMBEDDING_MODEL=nomic-embed-text

# Ask-Store für Prompt-History
ASK_STORE_ENABLED=true
```

### Memory-Verhalten steuern:

**Prompt-History deaktivieren:**
```env
ASK_STORE_ENABLED=false
```

**Nur LMDB (ohne Qdrant):**
```env
USE_QDRANT=false
```
→ Short/Mid-term funktioniert, Long/Global nicht

---

## 🚀 Erweiterte Memory-Features

### 1. Namespace-Isolation

Jeder Agent kann eigenen Memory-Namespace haben:

```yaml
agents:
  agent1:
    role: "Agent 1"
    backend: ollama
    # Hat eigenen Memory-Space
```

Agents sehen nicht gegenseitig ihre Daten!

### 2. Semantic Search

**Suche ähnliche Inhalte:**
```javascript
// In Long-term Memory gespeichert:
// 1. "React ist ein UI Framework"
// 2. "Vue ist eine JavaScript Library"
// 3. "Python ist eine Programmiersprache"

// Suche: "Frontend Framework"
// Findet: 1 und 2 (ähnlich!)
// Findet nicht: 3 (unterschiedlich)
```

### 3. Global Knowledge Base

**Speichere wiederverwendbares Wissen:**
```
> ask Speichere Best Practice: Always use TypeScript strict mode
```

**In jedem Projekt verfügbar:**
```
> ask Was sind TypeScript Best Practices?
```
→ Findet das gespeicherte Wissen!

---

## 📈 Memory Performance

### Geschwindigkeits-Vergleich:

| Operation | Short-term | Mid-term | Long-term | Global |
|-----------|-----------|----------|-----------|--------|
| **Write** | < 1ms | < 5ms | ~50ms | ~50ms |
| **Read** | < 1ms | < 5ms | ~50ms | ~50ms |
| **Search** | N/A | N/A | ~100ms | ~100ms |

**Embeddings benötigen Zeit:**
- Erster Call: ~1-2s (Model laden)
- Weitere Calls: ~50-100ms

---

## 🐛 Troubleshooting

### "Qdrant connection error"
```bash
# Prüfe ob Qdrant läuft:
docker ps | findstr qdrant

# Starte neu:
docker-compose restart qdrant
```

### "Embedding service not available"
→ LM Studio muss laufen!
→ Model muss Embeddings unterstützen (nomic-embed-text)

### "Memory folder not found"
```bash
# Erstelle Ordner:
mkdir memory
```

### "History shows no results"
→ Stelle erst einige Fragen
→ Warte kurz (Embeddings brauchen Zeit)

---

## 🎯 Zusammenfassung

### Was du jetzt hast:
✅ **4 Memory-Ebenen**: Short, Mid, Long, Global
✅ **Semantic Search**: Intelligente Suche
✅ **Persistent Storage**: Über Sessions hinweg
✅ **Prompt-History**: Mit Ähnlichkeits-Suche
✅ **Namespace-Isolation**: Per Agent

### Teste es:
```bash
# 1. Starte REPL
npm start repl

# 2. Stelle Fragen
> ask Wie erstelle ich einen Webshop?
> ask Was ist OAuth2?
> ask Erkläre MVC Pattern

# 3. Suche in History
> history webshop
> history authentication
> history design pattern

# 4. Workflow mit Memory
> orchestrate webshop-arc42-workflow.yml

# 5. In neuer Session
# Starte REPL neu und suche alte Prompts:
> history
```

**Viel Spaß beim Testen! 🚀**

---

## 📚 Weitere Infos

- **Qdrant Docs**: https://qdrant.tech/documentation/
- **LMDB Docs**: http://www.lmdb.tech/doc/
- **Memory-Code**: `src/memory/`
