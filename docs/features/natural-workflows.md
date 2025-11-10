# Natural Language Workflows

> **Neue Features in v2.2**: Natürliche Sprache + Markdown Workflows + Slash Commands

---

## 🎯 Übersicht

CodeChat unterstützt jetzt drei Ebenen der Interaktion:

1. **Natürliche Sprache** - Einfach lostippen, kein Befehl nötig
2. **Slash Commands** - Systemfunktionen mit `/command`
3. **Markdown Workflows** - Wiederverwendbare Workflows als Markdown-Dateien

---

## 💬 1. Natürliche Sprache (Auto-Ask)

### Standard-Modus

Einfach deine Frage eingeben - kein `/ask` nötig!

```bash
> Was ist TypeScript?
⤴️ Asking model...
[Antwort...]

> Erkläre mir async/await in JavaScript
⤴️ Asking model...
[Antwort...]

> Wie erstelle ich eine REST API mit Express?
⤴️ Asking model...
[Antwort...]
```

### Vorteile

- ✅ Keine Befehle lernen
- ✅ Wie ein normales Gespräch
- ✅ Automatisch in History gespeichert (Semantic Search!)
- ✅ Web-Recherche möglich mit `/web on`

---

## ⚡ 2. Slash Commands

### Syntax

Alle System-Befehle starten mit `/`:

```bash
/command [arguments]
```

### Kategorien

#### 📂 Datei-Operationen

```bash
/load app.py               # Datei laden (alias: /l)
/save                      # Ausgabe speichern (alias: /s)
/run                       # Code ausführen (alias: /r)
/improve Füge Logging hinzu  # Code verbessern (alias: /i)
```

#### 🤖 AI-Interaktion

```bash
/ask Was ist TypeScript?   # Explizite Frage (alias: /a)
/web on                    # Web-Recherche aktivieren (alias: /w)
/webs Latest React news    # Direkte Web-Suche (alias: /ws)
```

#### 🎯 Workflows

```bash
/workflow develop Blog erstellen       # Markdown Workflow (alias: /wf)
/orchestrate workflow.yml              # YAML Workflow (alias: /o)
/workflows                             # Liste alle Workflows
```

#### 🔧 Utilities

```bash
/tools                     # CLI-Tools anzeigen (alias: /t)
/history webshop           # History durchsuchen (alias: /hist)
/token list                # OAuth-Tokens verwalten
/clear                     # Screen löschen (alias: /c)
/help                      # Hilfe anzeigen (alias: /h)
/exit                      # Beenden (alias: /quit)
```

---

## 📝 3. Markdown Workflows

### Warum Markdown?

- ✅ Einfacher zu schreiben als YAML
- ✅ Bessere Lesbarkeit
- ✅ Unterstützt Variablen und Argumente
- ✅ Wiederverwendbar
- ✅ Versionskontrollfreundlich

### Ordnerstruktur

```
.claude/workflows/          # Projekt-spezifische Workflows
~/.claude/workflows/        # Persönliche Workflows (alle Projekte)
templates/workflows/        # System-Templates
```

### Beispiel: Quickstart Workflow

**.claude/workflows/quickstart.md:**

```markdown
---
name: quickstart
description: Quick development workflow
execution_mode: sequential
agents:
  - name: architect
    role: Software Architect
    backend: ollama
    model: llama3.2:3b
  - name: coder
    role: Full-Stack Developer
    backend: ollama
    model: llama3.2:3b
---

# Quick Start Development

## Architect: Design

Create a simple architecture for: **$TASK**

Focus on:
- Core components
- Technology stack
- Basic API design

---

## Coder: Implementation

Implement: **$TASK**

Based on the architecture:
```
{architect}
```

Deliverables:
- Working code
- Basic README
```

### Nutzung

```bash
# Mit /workflow
> /workflow quickstart Erstelle einen Blog mit Next.js

# Oder direkt als Shortcut
> /quickstart Erstelle einen Blog mit Next.js
```

### Variablen

Workflows unterstützen mehrere Variablen:

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `$TASK` | Gesamte Aufgabe | "Erstelle einen Blog" |
| `$ARGUMENTS` | Alle Argumente | "Erstelle einen Blog" |
| `$1`, `$2`, ... | Positionale Argumente | "Erstelle", "einen", "Blog" |
| `{agent-name}` | Output von anderem Agent | `{architect}` |

### Frontmatter (YAML)

```yaml
---
name: workflow-name           # Erforderlich
description: Beschreibung     # Optional
execution_mode: sequential    # sequential | parallel
max_concurrent: 3             # Nur bei parallel
agents:
  - name: architect           # Agent-Name (lowercase)
    role: Software Architect  # Rolle (für Prompt)
    backend: ollama           # ollama | openai | mock
    model: llama3.2:3b        # Optional
    tools: []                 # Optional
---
```

### Sections (Markdown)

Jede `## Überschrift` wird zu einem Workflow-Step:

```markdown
## Agent-Name: Task-Title

Task-Beschreibung mit:
- Variablen: $TASK, $1, $2
- Context: {other-agent}

Der Output von {other-agent} wird automatisch eingefügt.
```

---

## 🚀 Vordefinierte Workflows

### `/develop` - Full-Stack Development

Kompletter Development-Workflow mit 7 Agenten:

```bash
> /develop Erstelle einen Webshop mit React und Node.js
```

**Agents:**
1. **Architect** - System-Design & Tech-Stack
2. **Backend** - API Implementation (Node.js/TypeScript)
3. **Frontend** - UI Implementation (React/TypeScript)
4. **Database** - Schema & Migrations
5. **Tester** - Unit + Integration + E2E Tests
6. **DevOps** - Docker + CI/CD + Deployment
7. **Documenter** - README + API Docs + Architecture Docs

**Dauer:** ~15-20 Min (abhängig vom Model)

**Output:**
- Vollständige Architektur-Dokumentation
- Backend-Code (TypeScript)
- Frontend-Code (React/TypeScript)
- Datenbank-Schema
- Test-Suite
- Docker-Setup
- CI/CD Pipeline
- Komplette Dokumentation

### `/quickstart` - Quick Prototype

Schneller Prototyp mit nur 2 Agenten:

```bash
> /quickstart Todo-Liste mit React
```

**Agents:**
1. **Architect** - Einfache Architektur
2. **Coder** - Implementierung

**Dauer:** ~3-5 Min

### `/api` - REST API Development

API-Entwicklung mit 4 Agenten:

```bash
> /api User Management System
```

**Agents:**
1. **Architect** - API-Design (Endpoints, Auth, etc.)
2. **Backend** - Implementation (Express/Fastify)
3. **Tester** - API-Tests (Integration Tests)
4. **Documenter** - OpenAPI/Swagger Docs

**Dauer:** ~8-10 Min

---

## 🎨 Eigene Workflows erstellen

### Schritt 1: Erstelle Markdown-Datei

**.claude/workflows/my-workflow.md:**

```markdown
---
name: my-workflow
description: Mein custom Workflow
execution_mode: sequential
agents:
  - name: agent1
    role: First Agent
    backend: ollama
    model: llama3.2:3b
  - name: agent2
    role: Second Agent
    backend: ollama
    model: llama3.2:3b
---

# My Custom Workflow

## Agent1: First Task

Do something with: **$TASK**

---

## Agent2: Second Task

Use the result from agent1:

```
{agent1}
```

And do something else.
```

### Schritt 2: Nutzen

```bash
> /my-workflow Erstelle etwas Cooles

# Oder mit /workflow
> /workflow my-workflow Erstelle etwas Cooles
```

### Schritt 3: Mit anderen teilen

```bash
# Im Repository committen
git add .claude/workflows/my-workflow.md
git commit -m "Add custom workflow"

# Oder im Home-Dir speichern (persönlich)
cp .claude/workflows/my-workflow.md ~/.claude/workflows/
```

---

## 💡 Best Practices

### 1. Task-Formulierung

**Gut:**
```bash
> /develop Erstelle einen Blog mit Next.js, PostgreSQL und Authentifizierung
```

**Besser mit Details:**
```bash
> /develop Erstelle einen Blog-System mit:
- Frontend: Next.js 14 mit App Router
- Backend: tRPC API
- Database: PostgreSQL mit Prisma
- Auth: NextAuth.js
- Features: Posts, Comments, User Profiles
```

### 2. Workflows kombinieren

```bash
# Erst Architecture
> /quickstart Erstelle einen Chat-App

# Dann Tests hinzufügen
> /load backend/api.ts
> /improve Füge umfassende Tests hinzu

# Dann Deployment
> /improve Erstelle Docker-Setup und CI/CD Pipeline
```

### 3. History nutzen

```bash
# Nach Workflow
> /history blog

# Zeigt alle Blog-bezogenen Interaktionen
# Inklusive Workflow-Outputs!
```

### 4. Web-Recherche für aktuelle Technologien

```bash
> /web on
> /develop Erstelle eine App mit den neuesten React 19 Features
```

---

## 🔧 Fortgeschrittene Features

### Parallele Ausführung

```yaml
---
execution_mode: parallel
max_concurrent: 3
---
```

Agents ohne `context_keys` laufen parallel!

### Bedingte Contexts

```markdown
## Agent3: Task

Nutzt nur Output von agent1:

```
{agent1}
```

Nicht agent2!
```

### Eigene Models pro Agent

```yaml
agents:
  - name: architect
    backend: openai
    model: gpt-4
  - name: coder
    backend: ollama
    model: llama3.2:3b
```

Mix verschiedene Models für Kosten-Optimierung!

---

## 📊 Vergleich: YAML vs Markdown

| Feature | YAML | Markdown |
|---------|------|----------|
| **Einfachheit** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Lesbarkeit** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Variablen** | ❌ | ✅ $TASK, $1, $2 |
| **Context** | ✅ | ✅ {agent} |
| **Flexibilität** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Wiederverwendbar** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

**Empfehlung:**
- **Markdown**: Für 90% der Use Cases
- **YAML**: Nur für sehr komplexe Workflows

---

## 🆘 Troubleshooting

### Workflow nicht gefunden

```bash
> /my-workflow Test
❌ Workflow not found: my-workflow
```

**Lösung:**
```bash
# Check verfügbare Workflows
> /workflows

# Stelle sicher, Datei heißt my-workflow.md
# In einem dieser Ordner:
#   .claude/workflows/
#   ~/.claude/workflows/
#   templates/workflows/
```

### Variable wird nicht ersetzt

```markdown
## Agent: Task

Task: $TASK
```

**Problem:** `$TASK` bleibt als `$TASK`

**Lösung:** Variablen müssen beim Aufruf übergeben werden:
```bash
> /my-workflow Meine Aufgabe
#              ^^^^^^^^^^^^^ Wird zu $TASK
```

### Context nicht verfügbar

```markdown
## Agent2: Task

Use {agent1}
```

**Problem:** `{agent1}` ist leer

**Lösung:** Stelle sicher, agent1 ist vorher ausgeführt:
- Bei `sequential`: Automatisch
- Bei `parallel`: Füge `context_keys` im YAML hinzu (nicht in Markdown)

---

## ✅ Zusammenfassung

**Was ist neu:**

1. ✅ **Natürliche Sprache** - Einfach drauflos tippen
2. ✅ **Slash Commands** - Strukturierte System-Befehle
3. ✅ **Markdown Workflows** - Einfacher als YAML
4. ✅ **Template-System** - Wiederverwendbare Workflows
5. ✅ **Variable Support** - $TASK, $1, $2, {agent}
6. ✅ **3 Default Workflows** - develop, quickstart, api

**Migration von YAML:**

YAML-Workflows funktionieren weiterhin mit `/orchestrate`!

**Nächste Schritte:**

```bash
# 1. Teste natürliche Sprache
> Was ist TypeScript?

# 2. Teste einen Workflow
> /quickstart Todo-App

# 3. Zeige alle Workflows
> /workflows

# 4. Erstelle eigenen Workflow
> /help
```

**Viel Erfolg! 🚀**
