# 🚀 Quick Start - Mit Memory-Features

> **Schnelleinstieg in 5 Minuten | Wähle dein Backend**

## 📋 Voraussetzungen

**Wähle EINES der folgenden Backends:**

| Backend | Empfohlen für | Setup-Zeit | Anleitung |
|---------|---------------|-----------|-----------|
| **LM Studio** | Desktop, GUI, Windows | 3 Min | **[→ LM Studio Setup](docs/setup/lm-studio.md)** |
| **Ollama Docker** | Server, CLI, Automation | 5 Min | **[→ Ollama Docker Setup](docs/setup/ollama-docker.md)** |

**Nicht sicher?** → **[Backend-Vergleich & Empfehlung](docs/setup/backend-comparison.md)**

---

## 🎯 Option A: LM Studio (Empfohlen für Einsteiger)

### Schritt 1: LM Studio starten (30 Sekunden)

1. Öffne **LM Studio**
2. Wähle ein Modell (z.B. `mistral-7b-instruct-v0.3`)
3. Gehe zu **Local Server** Tab
4. Klicke **Start Server**
5. Warte bis "Server started on port 1234" erscheint

**Nicht installiert?** → **[LM Studio Download & Installation](docs/setup/lm-studio.md#installation)**

### Schritt 2: .env konfigurieren
```env
# Bereits konfiguriert für LM Studio:
OLLAMA_URL=http://localhost:1234/v1
MODEL_BACKEND=ollama
```

### Schritt 3: Build & Start (30 Sekunden)

```bash
npm run build
npm start repl
```

**Vollständige Anleitung**: **[→ LM Studio Setup Guide](docs/setup/lm-studio.md)**

---

## 🎯 Option B: Ollama Docker (Für CLI-Nutzer)

### Schritt 1: Docker Container starten (2 Minuten)

```bash
# Container starten
docker-compose up -d ollama

# Warte bis Download fertig
docker ps  # Prüfe Status
```

### Schritt 2: Modell laden (3 Minuten)

```bash
# Empfohlenes Modell
docker exec -it codechat-ollama ollama pull mistral:7b

# Oder kleineres Modell für Tests
docker exec -it codechat-ollama ollama pull llama3.2:3b
```

### Schritt 3: .env konfigurieren
```env
# Bereits konfiguriert für Ollama:
OLLAMA_URL=http://localhost:11434
MODEL_BACKEND=ollama
OLLAMA_MODEL=mistral:7b
```

### Schritt 4: Build & Start

```bash
npm run build
npm start repl
```

**Vollständige Anleitung**: **[→ Ollama Docker Setup Guide](docs/setup/ollama-docker.md)**

---

## 🧪 Teste Memory-Features (beide Optionen gleich)

**Test A: Prompt-History mit Semantic Search**
```
> ask Wie erstelle ich einen Webshop mit React?
⤴️ Asking model...
[Antwort kommt...]

> ask Was sind die Vorteile von TypeScript?
⤴️ Asking model...
[Antwort kommt...]

> ask Erkläre mir das MVC Pattern
⤴️ Asking model...
[Antwort kommt...]

> history webshop
📜 Prompt History

1. [2025-10-31 19:35] ask (85% match)
   "Wie erstelle ich einen Webshop mit React?"

> history pattern
📜 Prompt History

1. [2025-10-31 19:36] ask (92% match)
   "Erkläre mir das MVC Pattern"
```

**Test B: Memory-Workflow**
```
> orchestrate memory-test-workflow.yml

🚀 Starting workflow: memory-test
📝 Testet alle 4 Memory-Ebenen

🤖 [knowledge-keeper] (Wissensspeicher)
   Task: Speichere Design Patterns...
[Speichert Singleton, Factory, Observer, Strategy]

🤖 [knowledge-retriever] (Wissensabrufer)
   Task: Welches Pattern für Logging-Klasse?
[Nutzt gespeichertes Wissen: Empfiehlt Singleton!]

🤖 [analyst] (Analyst)
   Task: Analysiere und empfehle...
[Analysiert: Singleton ist beste Wahl für Logging]

✅ Workflow completed
```

---

## 🧪 Was du jetzt testen kannst

### 1. Semantic Search in Action
```
> ask Wie funktioniert OAuth2 Authentication?
> ask Was ist JWT?
> ask Erkläre REST API Security

> history authentication
# Findet alle 3 Prompts, obwohl nur einer "authentication" enthält!
```

### 2. Memory über Sessions
```
Session 1:
> ask Merke dir: Ich bevorzuge React mit TypeScript
> exit

Session 2 (neu starten):
> ask Welches Framework bevorzuge ich?
# Agent erinnert sich! (Mid-term Memory)
```

### 3. Webshop-Projekt mit Memory
```
> orchestrate webshop-arc42-workflow.yml

# Workflow läuft...
# Speichert Architektur, Code, Dokumentation in Memory

# Später:
> history arc42
# Findet das Projekt!

> ask Zeige mir die Webshop-Architektur vom letzten Projekt
# Agent kann darauf zugreifen!
```

---

## 📊 Memory Dashboard

**Qdrant Web UI:**
```
http://localhost:6333/dashboard
```

Hier siehst du:
- 📦 Collections (Deine Datenbanken)
- 🔢 Anzahl gespeicherter Vektoren
- 📈 Storage Statistiken

**API Check:**
```bash
curl http://localhost:6333/collections
```

Zeigt alle Memory-Collections.

---

## 🎮 Interaktive Tests

### Test 1: Code-Speicherung
```bash
> load beispiel.ts
✅ Loaded beispiel.ts

> ask Analysiere diesen Code und speichere Best Practices im Long-term Memory
⤴️ Asking model...
[Analysiert und speichert...]

# Später in anderem Projekt:
> ask Was waren die TypeScript Best Practices?
[Findet gespeicherte Best Practices!]
```

### Test 2: Wissens-Akkumulation
```bash
# Frage 1:
> ask Was ist das Singleton Pattern?

# Frage 2:
> ask Was ist das Factory Pattern?

# Frage 3:
> ask Was ist das Observer Pattern?

# Jetzt suche:
> history pattern
# Findet alle 3!

# Oder:
> ask Vergleiche alle Design Patterns, die wir besprochen haben
# Agent nutzt Long-term Memory!
```

### Test 3: Multi-Agent mit Shared Memory
```bash
> orchestrate memory-test-workflow.yml

# Agents teilen Wissen über Memory:
# Agent 1 → speichert
# Agent 2 → liest aus Memory
# Agent 3 → analysiert gesamtes Memory
```

---

## 🔍 Monitoring

### Schaue was gespeichert wird:

**LMDB (Local Files):**
```bash
dir memory
```

**Qdrant (Vector DB):**
```bash
# Collections anzeigen
curl http://localhost:6333/collections

# Collection Details
curl http://localhost:6333/collections/ask-store
```

---

## ⚡ Performance-Tipps

### Für schnellere Embeddings:
1. **Kleineres Embedding-Model** in LM Studio laden
2. **Batch Embeddings** nutzen (automatisch)
3. **Cache nutzen** (automatisch aktiviert)

### Für bessere Semantic Search:
1. **Detailliertere Prompts** nutzen
2. **Kontext hinzufügen**
3. **Tags verwenden** beim Speichern

---

## 🎯 Nächste Schritte

### Grundlagen testen:
```bash
npm start repl
> ask Wie funktioniert OAuth2?
> history oauth
```

### Workflows testen:
```bash
> orchestrate memory-test-workflow.yml
> orchestrate webshop-arc42-workflow.yml
```

### Eigene Workflows erstellen:
Kopiere `memory-test-workflow.yml` und passe an!

---

## 📚 Vollständige Dokumentation

### Backend-Setup
- **[LM Studio Setup Guide](docs/setup/lm-studio.md)** - Vollständige Anleitung mit Modellen, Settings, Troubleshooting
- **[Ollama Docker Setup Guide](docs/setup/ollama-docker.md)** - Container-Setup, CLI, Automatisierung
- **[Backend-Vergleich](docs/setup/backend-comparison.md)** - Welches Backend ist richtig für mich?

### Features
- **[Memory Testing Guide](docs/features/memory-system.md)** - 4-Ebenen Memory, Semantic Search, Qdrant
- **[OAuth2 Anleitung](docs/features/oauth.md)** - Login mit Google, GitHub, Token-Management

### Übersicht
- **[README](README.md)** - Projekt-Übersicht, Features, Architektur

---

## 🆘 Hilfe

### Qdrant startet nicht:
```bash
docker-compose restart qdrant
docker logs codechat-qdrant
```

### LM Studio verbindet nicht:
- Server läuft auf Port 1234?
- Model geladen?
- In .env: `OLLAMA_URL=http://localhost:1234/v1`

### Memory speichert nicht:
- Qdrant läuft? `docker ps | findstr qdrant`
- In .env: `USE_QDRANT=true`
- In .env: `ASK_STORE_ENABLED=true`

---

## ✅ Zusammenfassung

**Du hast jetzt:**
- ✅ Qdrant läuft (Docker)
- ✅ 4 Memory-Ebenen aktiviert
- ✅ Semantic Search funktioniert
- ✅ Prompt-History mit Suche
- ✅ Test-Workflows bereit

**Starte jetzt:**
```bash
# 1. LM Studio Server starten (Port 1234)
# 2. Dann:
npm start repl
> orchestrate memory-test-workflow.yml
```

**Viel Erfolg! 🚀**
