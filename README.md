# cacli - Coding Assistent CLI

> Multi-Agent AI Orchestration mit TypeScript - Dynamic Workflow Generation, Requirements Engineer & Natural Language Interface

## 🚀 Quick Start

**5-Minuten Setup:**
```bash
git clone https://github.com/rso-rom/multiAgentCli.git
cd multiAgentCli
npm install
npm run build
```

**Oder global installieren:**
```bash
npm install -g cacli
cacli   # Startet direkt die REPL
```

Dann siehe → **[QUICK-START.md](QUICK-START.md)** für Backend-Wahl & erste Schritte

---

## 📊 Projekt-Status

📦 **Version**: 3.0.0
📝 **Code**: ~5,000+ Zeilen TypeScript
✅ **Features**: Dynamic Workflows, Requirements Engineering, Natural Language Interface
🚀 **Repository**: [github.com/rso-rom/multiAgentCli](https://github.com/rso-rom/multiAgentCli)

---

## 🎯 Haupt-Features

### 🚀 **NEU in v3.0:** Dynamic Workflow Generation
- Workflows werden automatisch basierend auf Anforderungsanalyse generiert
- **Requirements Engineer** als erster Agent in allen Workflows
- Intelligente Agenten-Auswahl basierend auf Task-Komplexität
- Markdown-basierte Workflow-Templates (.md statt .yml)

Siehe → **[docs/features/natural-workflows.md](docs/features/natural-workflows.md)**

### 💬 **NEU in v3.0:** Natural Language Interface
- Direkte Prompts ohne `/ask` Befehl
- Slash Commands für System-Operationen (wie Claude Code)
- Auto-Detection von Development-Tasks
- Workflow-Bestätigung mit Auto-Generierung

### 🤖 Multi-Agent Orchestration
- YAML & Markdown-basierte Workflows
- Mehrere LLM-Backends (Ollama, OpenAI, Custom APIs)
- Sequentielle & parallele Agenten-Ausführung
- Kontext-Sharing zwischen Agents

### 🧠 4-Level Memory System
- **Short-term**: Session-basiert (LMDB)
- **Mid-term**: Persistiert über Sessions (LMDB)
- **Long-term**: Semantische Suche (Qdrant)
- **Global**: Projekt-übergreifend (Qdrant)

Siehe → **[docs/features/memory-system.md](docs/features/memory-system.md)**

### 🔐 OAuth2 & Token Management
- Browser-basierter Login Flow
- Persistente Token-Speicherung (verschlüsselt)
- Automatische Token-Erneuerung
- Unterstützung: Google, GitHub, Custom

Siehe → **[docs/features/oauth.md](docs/features/oauth.md)**

### 🌐 Web Agent System
- Autonome Internet-Recherche
- DuckDuckGo Integration
- Tool-Calling Loop

### 🔧 Tool Awareness
- Automatische CLI-Tool-Erkennung
- Runtime Availability Checking
- Auto-Installation System

### 📈 Performance & Monitoring
- Token Usage Tracking
- Cost Calculator
- Real-time Web Dashboard
- Workflow Visualization

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
| **Memory System** | 4-Ebenen Memory, Qdrant | [docs/features/memory-system.md](docs/features/memory-system.md) |
| **OAuth2** | Login-Flows, Token-Management | [docs/features/oauth.md](docs/features/oauth.md) |
| **Vision/Screenshots** | GPT-4o Vision, Copy & Paste | [docs/features/vision.md](docs/features/vision.md) |

---

## 💡 Nutzung

### Interactive REPL
```bash
# Einfach starten - REPL läuft dauerhaft
cacli

# Mit anderem Backend
cacli -b ollama
cacli -b openai

# Für Development:
npm start repl
```

### One-off Fragen (ohne REPL)
```bash
cacli ask "Erkläre mir TypeScript Generics"
cacli ask "Was ist der Unterschied zwischen let und const?"
```

### REPL Befehle
```bash
# Datei-Operationen
/load <file>          # Datei laden
/save                 # Ausgabe speichern
/run                  # Code ausführen

# AI Interaction (direkt ohne / möglich!)
Was ist async/await?  # Direkt fragen
/ask <prompt>         # Explizit fragen
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

### Beispiel-Session (v3.0 - Natural Language)
```bash
🧠 cacli REPL (backend=ollama)
> Wie kann ich async/await in Python nutzen?
⤴️ Asking model...
[Antwort mit Beispielen]

> Entwickle eine Vue.js + Spring Boot Calculator App
🎯 Detected development task!
🔍 Running Requirements Engineer...
📋 Requirements:
   - Frontend: Vue.js
   - Backend: Spring Boot
   - Feature: Calculator (2 Zahlen addieren)
   - Database: Not needed

🤖 Generating workflow...
   Agents: requirements → architect → developer → documenter

Proceed? (y/n): y
🚀 Executing workflow...
✅ Workflow completed! Code in: ./appcoding-example/
```

---

## 🛠️ Backends

| Backend | Setup | Verwendung |
|---------|-------|------------|
| **LM Studio** | [Setup Guide](docs/setup/lm-studio.md) | Desktop, GUI, Windows |
| **Ollama Docker** | [Setup Guide](docs/setup/ollama-docker.md) | Server, CLI, Automation |
| **Mock** | Kein Setup nötig | Testing |

**Konfiguration** (`.env`):
```env
MODEL_BACKEND=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b

# Memory
USE_QDRANT=true
QDRANT_URL=http://localhost:6333
```

---

## 📦 Projekt-Struktur

```
caili/
├── src/
│   ├── auth/              # OAuth2 & Token Management
│   ├── backends/          # LLM Integrations
│   ├── memory/            # 4-Level Memory System
│   ├── orchestrator/      # Multi-Agent System (+ Dynamic Generator!)
│   ├── plugins/           # Plugin System
│   ├── tools/             # Web Agent Tools
│   └── web/               # Dashboard
├── .claude/
│   └── workflows/         # Markdown Workflow Templates (.md)
├── docs/
│   ├── setup/             # Setup-Guides
│   └── features/          # Feature-Dokumentation
├── templates/             # Agent-Templates
├── examples/              # Beispiel-Workflows & Specs
└── QUICK-START.md         # Schnelleinstieg
```

---

## 🎯 Version History

### v3.0.0 (Aktuell) - "CAILI"
- ✅ **Dynamic Workflow Generation** - Automatische Workflow-Erstellung basierend auf Requirements
- ✅ **Requirements Engineer** - Standardmäßig erster Agent in allen Workflows
- ✅ **Natural Language Interface** - Direkte Prompts ohne `/ask`
- ✅ **Slash Commands** - System-Befehle wie in Claude Code
- ✅ **Markdown Workflows** - `.md` Templates statt `.yml`
- ✅ **Auto-Detection** - Erkennt Development-Tasks automatisch
- ✅ **npm Package Ready** - Globale Installation mit `npm install -g cacli`
- ✅ **Dokumentation** - Reorganisiert in docs/setup/ und docs/features/

### v2.1
- ✅ OAuth2 Browser Flow mit PKCE
- ✅ Persistente Token-Speicherung (verschlüsselt)
- ✅ Automatische Token-Erneuerung
- ✅ Token Management CLI

### v2.0
- ✅ Parallele Agenten-Ausführung
- ✅ Agent Memory Isolation
- ✅ Workflow Visualization
- ✅ Web UI Dashboard

### v1.0
- ✅ 4-Level Memory System
- ✅ Real Embeddings (Ollama, OpenAI)
- ✅ Prompt History mit Semantic Search

---

## 🔒 Sicherheit

- **Host Execution**: Code läuft direkt auf deinem System (nur vertrauenswürdigen Code!)
- **Docker Execution**: Isolierte Ausführung (Docker erforderlich)
- **OAuth2 Tokens**: AES-256-GCM verschlüsselt in `~/.cacli/tokens.json`
- **API Keys**: In `.env` speichern, nie committen!
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

**Los geht's!** → [QUICK-START.md](QUICK-START.md)
