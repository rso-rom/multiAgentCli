# cacli - Coding Assistent CLI

> Selbstkonfigurierendes Multi-Agent AI System mit TypeScript — Master Agent SPOC, Intelligentes Auto-Routing (DE/EN), Collaborative Learning & Knowledge Reflection, echte LLM-Integration und Natural Language Interface

## 🚀 Quick Start

**5-Minuten Setup:**
```bash
git clone https://github.com/rso-rom/multiAgentCli.git
cd multiAgentCli
npm install
npm start
```

**Oder global installieren:**
```bash
npm install -g cacli
cacli   # Startet direkt die REPL
```

Das war's! cacli erkennt automatisch verfügbare LLM-Backends (Ollama, OpenWebUI, OpenAI, Claude) und startet das Multi-Agent-System mit 5 Worker Agents. Einfach Aufgabe eintippen:

```
> Erstelle eine React Login-Komponente

🎯 Task detected (75% confidence, complexity: simple)
   Routing to Multi-Agent System...
🤖 Delegating to: Frontend Agent
✅ Task completed successfully!
```

Details → **[QUICK-START.md](QUICK-START.md)**

---

## 📊 Projekt-Status

📦 **Version**: 4.5.2
📝 **Code**: ~8,000+ Zeilen TypeScript
✅ **Tests**: 111 Tests (Orchestrator-Kern, Backends, Auth, Utils)
🚀 **Repository**: [github.com/rso-rom/multiAgentCli](https://github.com/rso-rom/multiAgentCli)

---

## 🎯 Haupt-Features

### 🤖 **v4.0:** Multi-Agent Orchestration mit Master Agent (SPOC)
- **Master Agent** als Single Point of Contact — orchestriert alle Worker Agents
- **5 spezialisierte Worker Agents**: Frontend, Backend, DevOps, Design, General
- **Message Bus**: Echtzeit-Kommunikation zwischen Agents (Pub/Sub, Request/Response mit Correlation-IDs)
- **Agent Registry**: Lifecycle-Management (spawn, kill, status)
- **Task Delegator**: Capability-basiertes Routing zum besten verfügbaren Agent

### 🎯 **v4.1:** Intelligentes Auto-Routing (Deutsch + Englisch)
- Einfach Aufgabe oder Frage eintippen — **keine Befehle nötig**
- TaskDetector klassifiziert Eingaben mit Confidence-Score:
  - **Frage** ("Was ist eine App?") → normales LLM
  - **Task** ("Erstelle eine React Komponente") → Multi-Agent-System
  - **Komplexer Task** ("Baue mir einen Webshop mit React, Postgres und Docker") → Dynamic Workflow mit Requirements Engineering
- Erkennt deutsche und englische Action-Verben, Fragewörter und Tech-Keywords

### 🧠 **v4.3:** Collaborative Learning & Knowledge Reflection
- Agents lernen automatisch aus jedem Task (Erfolg/Fehler, Dauer, Technologien)
- **Knowledge Reflector** erkennt Patterns: "Docker-Tasks scheitern zu 65%", "React + TypeScript werden oft kombiniert"
- Reflection-Sessions mit Insights & Recommendations (`/reflect`, auch automatisch per `/auto-reflect`)
- Kollektive Wissensabfrage über alle Agents (`/knowledge <query>`)
- Persistente Speicherung in Qdrant, Team-Sharing **opt-in** (`SHARE_LEARNING_GLOBAL=true`)

### ⚡ **v4.4:** Echte LLM-Integration in allen Agents
- Jeder Worker Agent nutzt das konfigurierte LLM mit **spezialisiertem System-Prompt**
  (Frontend Agent: React/Vue/TypeScript-Experte, DevOps Agent: Docker/K8s/CI-CD-Experte, ...)
- Streaming-Support, strukturierte JSON-Antworten
- Graceful Fallback in Simulation-Mode ohne Backend

### 🔍 **v4.5:** Selbstkonfigurierende Backend-Erkennung
- Erkennt beim Start automatisch, was verfügbar ist (Reihenfolge):
  1. Explizite Config (`MODEL_BACKEND` / `-b` Flag)
  2. **Ollama** (localhost:11434, inkl. Model-Auswahl)
  3. **OpenWebUI** (localhost:3000)
  4. **OpenAI** (API Key vorhanden?)
  5. **Claude/Anthropic** (API Key vorhanden?)
  6. Mock (Simulation) — mit Setup-Anleitung
- **Null Konfiguration nötig** — `npm start` genügt

### 🔧 Advanced Agent Capabilities (standardmäßig aktiv)
- **Tool Use**: Agents nutzen curl, git, npm, docker etc. (deaktivierbar: `--disable-tools`)
- **GUI Control**: Photoshop, GIMP, Krita automatisieren (deaktivierbar: `--disable-gui`)
- **MCP Integration**: VS Code, Obsidian fernsteuern (optional: `--enable-mcp`)
- **Self-Learning**: Lernt aus Online-Tutorials und speichert Wissen

Siehe → **[docs/features/advanced-agent-capabilities.md](docs/features/advanced-agent-capabilities.md)** & **[FEATURE_STATUS.md](FEATURE_STATUS.md)**

### 🚀 Dynamic Workflow Generation (v3.0)
- Workflows werden automatisch basierend auf Anforderungsanalyse generiert
- **Requirements Engineer** als erster Agent in allen Workflows
- Markdown-basierte Workflow-Templates (.md statt .yml)

Siehe → **[docs/features/natural-workflows.md](docs/features/natural-workflows.md)**

### 🧠 4-Level Memory System
- **Short-term**: Session-basiert (LMDB)
- **Mid-term**: Persistiert über Sessions (LMDB)
- **Long-term**: Semantische Suche (Qdrant)
- **Global**: Projekt-übergreifend (Qdrant)

Siehe → **[docs/features/memory-system.md](docs/features/memory-system.md)**

### 🔐 OAuth2 & Token Management
- Browser-basierter Login Flow, persistente Token-Speicherung (verschlüsselt)
- Automatische Token-Erneuerung

Siehe → **[docs/features/oauth.md](docs/features/oauth.md)**

### 🌐 Weitere Features
- **Web Agent**: Autonome Internet-Recherche (DuckDuckGo)
- **Vision**: Screenshot-/Bild-Analyse (GPT-4o)
- **Tool Awareness**: Automatische CLI-Tool-Erkennung
- **Monitoring**: Token Usage Tracking, Cost Calculator, Web Dashboard

---

## 📚 Dokumentation

### Setup & Konfiguration
| Guide | Inhalt | Link |
|-------|--------|------|
| **Quick Start** | 5-Min Setup, Backend-Wahl | [QUICK-START.md](QUICK-START.md) |
| **Backend-Vergleich** | LM Studio vs Ollama Docker | [docs/setup/backend-comparison.md](docs/setup/backend-comparison.md) |
| **LM Studio Setup** | GUI-basiert, Desktop | [docs/setup/lm-studio.md](docs/setup/lm-studio.md) |
| **Ollama Docker Setup** | CLI-basiert, Server | [docs/setup/ollama-docker.md](docs/setup/ollama-docker.md) |

### Features & Nutzung
| Guide | Inhalt | Link |
|-------|--------|------|
| **Advanced Agents** | Tool Use, MCP, GUI, Self-Learning | [docs/features/advanced-agent-capabilities.md](docs/features/advanced-agent-capabilities.md) |
| **Feature Status** | Vollständiger Implementierungs-Status | [FEATURE_STATUS.md](FEATURE_STATUS.md) |
| **Memory System** | 4-Ebenen Memory, Qdrant | [docs/features/memory-system.md](docs/features/memory-system.md) |
| **OAuth2** | Login-Flows, Token-Management | [docs/features/oauth.md](docs/features/oauth.md) |
| **Vision/Screenshots** | GPT-4o Vision, Copy & Paste | [docs/features/vision.md](docs/features/vision.md) |

---

## 💡 Nutzung

### Interactive REPL
```bash
# Einfach starten — Backend-Erkennung, Multi-Agent, Tools & GUI laufen automatisch
cacli

# Backend explizit wählen
cacli -b ollama
cacli -b openai
cacli -b claude

# Capabilities gezielt deaktivieren
cacli --disable-tools     # ohne System-Tools
cacli --disable-gui       # ohne GUI-Automatisierung
cacli --enable-mcp        # MCP zusätzlich aktivieren (optional)

# Für Development:
npm start
```

### One-off Fragen & Tasks (ohne REPL)
```bash
cacli ask "Erkläre mir TypeScript Generics"          # Frage → LLM
cacli ask "Erstelle eine React Login-Komponente"     # Task → Multi-Agent-System
```

### REPL Befehle
```bash
# Natural Language (Standard — kein Befehl nötig!)
Was ist async/await?              # Frage → LLM
Erstelle eine React Komponente    # Task → Agent-Delegation
Baue einen Webshop mit React,     # Komplexer Task → Dynamic Workflow
Postgres und Docker

# Multi-Agent System
/agents               # Aktive Worker Agents anzeigen
/task <beschreibung>  # Task explizit delegieren
/broadcast <message>  # Nachricht an alle Agents
/agent-status         # System-Status

# Collaborative Learning & Reflection
/reflect              # Reflection-Session (Patterns, Insights, Recommendations)
/insights             # Letzte Reflection-Sessions
/knowledge <query>    # Kollektives Wissen durchsuchen
/agent-stats [id]     # Lern-Statistiken (gesamt oder pro Agent)
/auto-reflect on|off|<min>  # Automatische Reflexion

# Self-Learning Wissensverwaltung
/learned [query]      # Gelerntes Wissen anzeigen
/stats                # Lern-Statistiken
/share <query>        # Wissen in Global Memory teilen
/import <query>       # Wissen aus Global Memory importieren
/export [file]        # Wissen als JSON exportieren
/load-knowledge <f>   # Wissen aus JSON laden
/forget <query>       # Gelerntes Wissen löschen

# Datei-Operationen
/load <file>          # Datei laden
/save                 # Ausgabe speichern
/run                  # Code ausführen
/improve <instr>      # Code verbessern

# Multi-Agent Workflows
/workflow <name>      # Workflow starten
/develop <task>       # Full-stack entwickeln
/api <task>           # REST API erstellen

# Vision & Screenshots
/screenshot <file>    # Bild analysieren (GPT-4o)
/paste [question]     # Clipboard-Screenshot analysieren

# Utility
/help                 # Hilfe anzeigen
/exit                 # Beenden
```

### Beispiel-Session (v4.5 — Auto-Routing)
```bash
$ cacli

🔍 Auto-detected backend: OLLAMA
   Local Ollama with 3 model(s)
   Model: llama3

🤖 Multi-Agent System enabled
✅ Multi-Agent system ready with 5 worker agents
🧠 LLM Backend: ollama
💡 Just type your task - agents will use LLM for intelligent execution!

> Wie funktioniert Docker?
⤴️ Asking model...              # Frage → normales LLM
[Antwort mit Beispielen]

> Erstelle eine React Login-Komponente
🎯 Task detected (75% confidence, complexity: simple)
   Reason: Contains action verb; Contains tech keywords: react
   Routing to Multi-Agent System...
🤖 Delegating to: Frontend Agent
✅ Task completed successfully!

> Baue mir einen Webshop mit React, Postgres und Docker
🎯 Task detected (100% confidence, complexity: complex)
   Routing to Dynamic Workflow (requirements → multi-step plan)...
📋 Requirements Engineer analyzing...
🤖 Generating workflow...
   Agents: requirements → architect → developer → documenter

> /reflect
🧠 Knowledge Reflection started...
   Analyzing 12 experiences

📊 Identified Patterns:
✅ frontend tasks have high success rate (91%)
💡 react + typescript are often used together
🎯 Recommendations:
   Consider creating specialized workflow for react + typescript
```

---

## 🛠️ Backends

cacli erkennt Backends **automatisch** — manuelle Konfiguration ist optional.

| Backend | Erkennung | Setup |
|---------|-----------|-------|
| **Ollama** | localhost:11434 + installierte Models | [Setup Guide](docs/setup/ollama-docker.md) |
| **OpenWebUI** | localhost:3000 | [docs.openwebui.com](https://docs.openwebui.com) |
| **OpenAI** | `OPENAI_API_KEY` gesetzt | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Claude/Anthropic** | `ANTHROPIC_API_KEY` gesetzt oder OAuth (`cacli login claude`) | [console.anthropic.com](https://console.anthropic.com) |
| **Mock** | Fallback (Simulation) | Kein Setup nötig |

**Konfiguration** (`.env`, alles optional):
```env
# Backend (überschreibt Auto-Erkennung)
MODEL_BACKEND=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Memory
USE_QDRANT=true
QDRANT_URL=http://localhost:6333

# Capabilities (standardmäßig aktiv)
ENABLE_AGENT_TOOLS=true          # false zum Deaktivieren
ENABLE_GUI_CONTROL=true          # false zum Deaktivieren
ENABLE_MCP=false                 # true zum Aktivieren

# Learning
SHARE_LEARNING_GLOBAL=false      # true: Agent-Erfahrungen automatisch team-weit teilen
SELF_LEARNING_SIMILARITY_THRESHOLD=0.8
SELF_LEARNING_AUTO_SAVE=false
```

---

## 🧪 Tests

```bash
npm test              # 111 Tests (Orchestrator, Backends, Auth, Utils)
npm run test:coverage # Mit Coverage-Report
```

Abgedeckt: TaskDetector (DE/EN), Message Bus, Worker Agents, Task Delegator, Agent Learning, Knowledge Reflector, Learning Coordinator, System-Prompt-Weitergabe aller Backends.

---

## 📦 Projekt-Struktur

```
multiAgentCli/
├── src/
│   ├── auth/              # OAuth2 & Token Management
│   ├── backends/          # LLM Integrations (Ollama, OpenAI, Claude, ...)
│   ├── memory/            # 4-Level Memory System
│   ├── orchestrator/      # Multi-Agent System
│   │   ├── master-agent.ts        # SPOC — orchestriert alle Agents
│   │   ├── worker-agent.ts        # Basisklasse mit Learning
│   │   ├── example-agents.ts      # Frontend/Backend/DevOps/Design/General
│   │   ├── message-bus.ts         # Inter-Agent-Kommunikation
│   │   ├── task-detector.ts       # Auto-Routing (DE/EN)
│   │   ├── task-delegator.ts      # Capability-basiertes Routing
│   │   ├── agent-learning.ts      # Erfahrungs-Aufzeichnung
│   │   ├── knowledge-reflector.ts # Pattern-Erkennung & Insights
│   │   └── learning-coordinator.ts # Kollektives Lernen
│   ├── setup/             # Setup Wizard & Backend-Auto-Detection
│   ├── gui/               # GUI Control (Photoshop, GIMP, ...)
│   ├── mcp/               # MCP Integration
│   ├── tools/             # Web Agent Tools
│   └── web/               # Dashboard
├── .claude/workflows/     # Markdown Workflow Templates
├── docs/                  # Setup- & Feature-Dokumentation
└── QUICK-START.md         # Schnelleinstieg
```

---

## 🎯 Version History

### v4.5.x (Aktuell)
- ✅ **Selbstkonfigurierende Backend-Erkennung** — Ollama/OpenWebUI/OpenAI/Claude automatisch
- ✅ **Kritische Fixes**: System-Prompts erreichen das LLM, persistentes Lernen verdrahtet, einheitliche Task-Erkennung (DE/EN), Global-Sharing opt-in
- ✅ **Testsuite**: 111 Tests für Orchestrator-Kern und Backends

### v4.4
- ✅ **Echte LLM-Integration** — alle Worker Agents nutzen das konfigurierte LLM mit spezialisierten System-Prompts
- ✅ Ollama als Standard-Backend

### v4.3
- ✅ **Collaborative Learning & Knowledge Reflection** — Agents lernen aus jedem Task, Reflection-Sessions erkennen Patterns
- ✅ Neue Commands: `/reflect`, `/insights`, `/knowledge`, `/agent-stats`, `/auto-reflect`

### v4.1 / v4.2
- ✅ **Intelligentes Auto-Routing** — TaskDetector mit Confidence-Scoring
- ✅ Multi-Agent, Tools & GUI standardmäßig aktiv (Flags: `--disable-tools`, `--disable-gui`)

### v4.0
- ✅ **Multi-Agent Orchestration** — Master Agent (SPOC), Message Bus, Agent Registry, Task Delegator, 5 Worker Agents

### v3.0 - "CAILI"
- ✅ Dynamic Workflow Generation mit Requirements Engineer
- ✅ Natural Language Interface, Slash Commands, Markdown Workflows
- ✅ Advanced Agent Capabilities (Tool Use, MCP, GUI Control, Self-Learning)

### v2.x
- ✅ OAuth2 Browser Flow (PKCE), Token Management
- ✅ Parallele Agenten-Ausführung, Web UI Dashboard

### v1.0
- ✅ 4-Level Memory System, Real Embeddings, Semantic Search

---

## 🔒 Sicherheit

- **Host Execution**: Code läuft direkt auf deinem System (nur vertrauenswürdigen Code!)
- **Docker Execution**: Isolierte Ausführung (Docker erforderlich)
- **OAuth2 Tokens**: AES-256-GCM verschlüsselt in `~/.cacli/tokens.json`
- **API Keys**: In `.env` speichern, nie committen!
- **Agent Learning**: Erfahrungen bleiben projekt-lokal; Team-Sharing nur mit explizitem Opt-in (`SHARE_LEARNING_GLOBAL=true`)
- **Qdrant**: Für Produktion mit Auth sichern

---

## 🤝 Contributing

Contributions willkommen! Bitte öffne Issues oder Pull Requests.

---

## 📄 License

MIT

---

## 🆘 Hilfe & Support

- **Quick Start**: [QUICK-START.md](QUICK-START.md)
- **Backend Setup**: [docs/setup/](docs/setup/)
- **Features**: [docs/features/](docs/features/)
- **Issues**: GitHub Issues

---

**Los geht's!** → `npm start` 🚀
