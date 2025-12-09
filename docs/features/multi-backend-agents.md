# Multi-Backend Agents - Verschiedene Modelle pro Agent

## 🎯 Übersicht

Jeder Agent kann ein **unterschiedliches Backend und Modell** nutzen! Das ermöglicht:

✅ **Kostenoptimierung** - Einfache Tasks → günstige Modelle, komplexe Tasks → teure Modelle
✅ **Performance-Optimierung** - Schnelle Modelle für einfache Tasks
✅ **Spezialisierung** - Bestes Modell pro Aufgabe
✅ **Flexibilität** - Mix aus lokalen und Cloud-Modellen

---

## 🚀 Verwendung

### 1. Manuelle Workflows (Volle Kontrolle)

In Markdown/YAML-Workflows kannst du Backend/Model **explizit** festlegen:

```yaml
---
name: mixed-backend-workflow
description: Workflow mit verschiedenen Backends
agents:
  - name: requirements
    role: Requirements Engineer
    backend: ollama          # ← Lokal & kostenlos
    model: llama3

  - name: architect
    role: Software Architect
    backend: claude          # ← Beste Qualität
    model: claude-3-5-sonnet-20241022

  - name: developer
    role: Developer
    backend: openai          # ← Gute Balance
    model: gpt-4o-mini

  - name: reviewer
    role: Code Reviewer
    backend: ollama          # ← Wieder lokal
    model: codellama
---

## Requirements: Analyze Task
Analyze requirements for: $TASK

## Architect: Design Architecture
Based on requirements:
{requirements}

Design the system architecture.

## Developer: Implement
Implement based on:
{architect}

## Reviewer: Review Code
Review the implementation:
{developer}
```

### 2. Dynamische Workflows (Automatisch)

Bei dynamisch generierten Workflows werden Backend/Model **automatisch** zugewiesen:

**Standard:** Alle Agents nutzen `MODEL_BACKEND` aus `.env`

```bash
# .env
MODEL_BACKEND=ollama
OLLAMA_MODEL=llama3

# → Alle Agents nutzen Ollama + llama3
```

**Intelligent:** Bei komplexen Tasks wird automatisch das **beste** verfügbare Backend verwendet:

```typescript
// Automatische Backend-Auswahl:
// 1. Claude (wenn ANTHROPIC_API_KEY oder ANTHROPIC_USE_OAUTH gesetzt)
// 2. OpenAI (wenn OPENAI_API_KEY gesetzt)
// 3. Ollama (wenn OLLAMA_URL gesetzt)
// 4. MODEL_BACKEND (Fallback)
```

**Beispiel:**

```env
# .env
MODEL_BACKEND=ollama
OLLAMA_MODEL=llama3
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

**Komplexer Workflow:**
- **Requirements Engineer:** `ollama + llama3` (einfach)
- **Architect:** `claude + claude-3-5-sonnet` (komplex → bestes Modell!)
- **Developer:** `ollama + llama3` (standard)
- **Tester:** `ollama + llama3` (standard)

---

## ⚙️ Konfiguration

### Globale Defaults (.env)

```env
# Standard-Backend für alle Agents
MODEL_BACKEND=ollama

# Backend-spezifische Modelle
OLLAMA_MODEL=llama3
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
OPENWEBUI_MODEL=llama3
```

### Pro-Agent Override (Workflow)

```yaml
agents:
  - name: expensive-agent
    backend: openai
    model: gpt-4o              # ← Überschreibt OPENAI_MODEL

  - name: cheap-agent
    backend: ollama
    model: llama3.2:1b         # ← Kleines, schnelles Modell
```

---

## 💡 Use Cases

### Use Case 1: Kostenoptimierung

**Problem:** GPT-4o ist teuer für einfache Tasks

**Lösung:** Mix aus günstigen und teuren Modellen

```yaml
agents:
  - name: simple-task
    backend: ollama
    model: llama3              # Kostenlos!

  - name: complex-task
    backend: openai
    model: gpt-4o              # Nur wenn nötig
```

**Ersparnis:**
- Ohne Optimierung: 10 Tasks × $0.03 = **$0.30**
- Mit Optimierung: 8 × $0.001 (Ollama) + 2 × $0.03 = **$0.07** ✅

### Use Case 2: Performance

**Problem:** GPT-4o ist langsam (~10s), Ollama schnell (~1s)

**Lösung:** Schnelle Modelle für interaktive Tasks

```yaml
agents:
  - name: interactive-chat
    backend: ollama
    model: llama3.2:3b         # Klein & schnell

  - name: code-generation
    backend: openai
    model: gpt-4o              # Langsam, aber gut
```

### Use Case 3: Spezialisierung

**Problem:** Verschiedene Modelle sind für verschiedene Tasks besser

**Lösung:** Spezialisierte Modelle pro Agent

```yaml
agents:
  - name: code-reviewer
    backend: ollama
    model: codellama           # Spezialisiert auf Code

  - name: text-writer
    backend: claude
    model: claude-3-5-sonnet   # Exzellent für Text

  - name: vision-analyzer
    backend: openai
    model: gpt-4o              # Beste Vision
```

### Use Case 4: Offline-First

**Problem:** Keine Internet-Verbindung verfügbar

**Lösung:** Alle Agents lokal

```yaml
agents:
  - name: agent1
    backend: ollama
    model: llama3

  - name: agent2
    backend: ollama
    model: mistral
```

---

## 🎨 Strategien

### Strategie 1: All-Ollama (Kostenlos, Offline)

```env
MODEL_BACKEND=ollama
OLLAMA_MODEL=llama3
```

**Vorteile:**
- ✅ Komplett kostenlos
- ✅ Offline-fähig
- ✅ Keine API-Limits

**Nachteile:**
- ⚠️ Geringere Qualität als GPT-4/Claude
- ⚠️ Benötigt lokale Ressourcen

### Strategie 2: Hybrid (Best of Both)

```env
MODEL_BACKEND=ollama          # Standard
OLLAMA_MODEL=llama3
OPENAI_API_KEY=sk-...         # Für komplexe Tasks
```

**Automatisch:**
- Einfache Tasks → Ollama (kostenlos)
- Komplexe Tasks → GPT-4 (beste Qualität)

### Strategie 3: All-Cloud (Beste Qualität)

```env
MODEL_BACKEND=claude
ANTHROPIC_USE_OAUTH=true
```

```bash
cacli login claude
```

**Vorteile:**
- ✅ Beste Qualität
- ✅ Keine lokale Installation

**Nachteile:**
- ⚠️ Kostet Geld
- ⚠️ Benötigt Internet

### Strategie 4: Budget-Optimiert

```yaml
# Günstige Modelle für 90% der Tasks
agents:
  - name: cheap-agents
    backend: openai
    model: gpt-4o-mini         # $0.15 / 1M tokens

# Teures Modell nur für kritische Tasks
  - name: critical-agent
    backend: openai
    model: gpt-4o              # $2.50 / 1M tokens
```

---

## 🔧 Konfigurationsbeispiele

### Beispiel 1: Development Workflow

```yaml
---
name: development
agents:
  # Planung: Claude (beste Qualität)
  - name: architect
    backend: claude
    model: claude-3-5-sonnet-20241022

  # Coding: Ollama (schnell & kostenlos)
  - name: developer
    backend: ollama
    model: codellama

  # Testing: GPT-4o-mini (günstig & gut)
  - name: tester
    backend: openai
    model: gpt-4o-mini

  # Docs: Ollama (einfach)
  - name: documenter
    backend: ollama
    model: llama3
---
```

### Beispiel 2: Research Workflow

```yaml
---
name: research
agents:
  # Recherche: GPT-4o (beste Web-Suche)
  - name: researcher
    backend: openai
    model: gpt-4o

  # Analyse: Claude (beste Text-Analyse)
  - name: analyzer
    backend: claude
    model: claude-3-5-sonnet-20241022

  # Zusammenfassung: Ollama (ausreichend)
  - name: summarizer
    backend: ollama
    model: llama3
---
```

### Beispiel 3: Code Review Workflow

```yaml
---
name: code-review
agents:
  # Statische Analyse: Ollama (schnell)
  - name: linter
    backend: ollama
    model: codellama

  # Security Check: GPT-4o (wichtig!)
  - name: security
    backend: openai
    model: gpt-4o

  # Style Check: Ollama (einfach)
  - name: style
    backend: ollama
    model: llama3
---
```

---

## 📊 Kosten-Vergleich

| Modell | Kosten / 1M Tokens | Qualität | Speed | Use Case |
|--------|-------------------|----------|-------|----------|
| **Ollama (llama3)** | $0 | ⭐⭐⭐ | ⚡⚡⚡ | Einfache Tasks |
| **GPT-4o-mini** | $0.15 | ⭐⭐⭐⭐ | ⚡⚡ | Standard |
| **Claude 3.5 Sonnet** | $3.00 | ⭐⭐⭐⭐⭐ | ⚡⚡ | Komplexe Tasks |
| **GPT-4o** | $2.50 | ⭐⭐⭐⭐⭐ | ⚡ | Kritische Tasks |

**Optimale Strategie:**
- 70% Ollama (einfach)
- 25% GPT-4o-mini (standard)
- 5% Claude/GPT-4o (komplex)

**Beispiel-Rechnung (1000 Tasks):**
- Ohne Optimierung: 1000 × $0.03 = **$30**
- Mit Optimierung: 700×$0 + 250×$0.0015 + 50×$0.03 = **$1.88** 💰

---

## 🎯 Best Practices

### 1. Start Simple
Beginne mit einem Backend, erweitere später:

```env
# Phase 1: Alles Ollama
MODEL_BACKEND=ollama

# Phase 2: Hybrid für komplexe Tasks
OPENAI_API_KEY=sk-...

# Phase 3: Multi-Backend
ANTHROPIC_API_KEY=sk-...
```

### 2. Monitor Costs
Tracke Kosten pro Backend:

```bash
# Nach Workflow:
cacli
> /costs show
```

### 3. Test Performance
Vergleiche Backends für deine Tasks:

```bash
# Same workflow, different backends:
cacli -b ollama
cacli -b openai
cacli -b claude

# Vergleiche Qualität & Geschwindigkeit
```

### 4. Use Environment Variables
Nicht hart-coden, .env nutzen:

```yaml
# ❌ Schlecht:
backend: ollama
model: llama3

# ✅ Gut:
backend: $MODEL_BACKEND
model: $OLLAMA_MODEL
```

---

## 🧪 Testen

### Test 1: Multi-Backend Workflow

```bash
cacli
> /workflow examples/mixed-backend.yml
```

Zeigt verschiedene Backends in Action!

### Test 2: Dynamisch generiert

```bash
cacli
> Entwickle eine Vue.js App

# → Automatisch verschiedene Backends je nach Complexity
```

### Test 3: Kosten-Vergleich

```bash
# Run same task with different backends:
MODEL_BACKEND=ollama cacli ask "Explain async/await"
MODEL_BACKEND=openai cacli ask "Explain async/await"

# Compare quality & cost
```

---

## 🎉 Zusammenfassung

✅ **Jeder Agent kann unterschiedliches Backend/Model nutzen**
✅ **Manuell in Workflows festlegen**
✅ **Automatisch bei dynamischen Workflows**
✅ **Intelligente Auswahl basierend auf Complexity**
✅ **Kostenoptimierung durch Mix**
✅ **Performance-Optimierung**
✅ **Spezialisierung möglich**

**Nächste Schritte:**
1. `.env` konfigurieren mit mehreren Backends
2. Workflow mit verschiedenen Backends erstellen
3. Kosten und Qualität vergleichen
4. Optimale Strategie finden

🚀 **Viel Erfolg mit Multi-Backend Agents!**
