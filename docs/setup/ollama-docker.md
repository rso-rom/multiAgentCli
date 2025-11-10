# 🐳 Ollama Docker Setup Guide

> **Vollständige Anleitung für Ollama mit Docker | Server, CLI, Automatisierung**

## 📑 Inhaltsverzeichnis

1. [Überblick](#-überblick)
2. [Voraussetzungen](#-voraussetzungen)
3. [Installation](#-installation)
4. [Modell-Empfehlungen](#-modell-empfehlungen)
5. [Konfiguration](#-konfiguration)
6. [Erweiterte Einstellungen](#-erweiterte-einstellungen)
7. [Parameter-Erklärungen](#-parameter-erklärungen)
8. [Performance-Optimierung](#-performance-optimierung)
9. [Erweiterte Tests](#-erweiterte-tests)
10. [CLI-Befehle Referenz](#-cli-befehle-referenz)
11. [Troubleshooting](#-troubleshooting)
12. [Vergleich mit LM Studio](#-lm-studio-vs-ollama-docker)

---

## 🎯 Überblick

**Ollama Docker** bietet:
- ✅ Container-basierte Isolation
- ✅ Einfache Automatisierung und CI/CD Integration
- ✅ Server/Headless-freundlich
- ✅ Konsistente Umgebung über alle Plattformen
- ✅ Keine GUI nötig
- ✅ Einfaches Modell-Management via CLI

**Perfekt für:**
- DevOps und CI/CD Workflows
- Server-Deployments
- Automatisierte Workflows
- CLI-bevorzugte Entwickler
- Multi-Modell-Setups

---

## 🔧 Voraussetzungen

### System-Anforderungen:

**Minimum:**
- Docker Desktop oder Docker Engine
- 8 GB RAM
- 10 GB freier Speicherplatz

**Empfohlen:**
- Docker Desktop (neueste Version)
- 16 GB RAM
- 50 GB freier Speicherplatz (für mehrere Modelle)
- SSD für bessere Performance

### ✅ Was ist bereits aktiv:
- Docker Compose konfiguriert
- Ollama Container wird heruntergeladen (~1.9 GB)

---

## 🚀 Installation

### Schritt 1: Warte bis Ollama fertig ist

Der Download läuft bereits im Hintergrund. Prüfe den Status:

```bash
docker ps
```

Wenn du `codechat-ollama` siehst → ✅ Fertig!

Falls nicht, warte noch ein paar Minuten. Der Download ist groß (1.9 GB).

---

### Schritt 2: Lade ein Modell herunter

**Option A: Kleines, schnelles Modell (empfohlen für Tests)**
```bash
docker exec -it codechat-ollama ollama pull llama3.2:3b
```
- **Größe**: ~2 GB
- **Geschwindigkeit**: ⚡⚡⚡ Sehr schnell
- **Qualität**: ⭐⭐⭐ Gut

**Option B: Besseres Modell**
```bash
docker exec -it codechat-ollama ollama pull mistral:7b
```
- **Größe**: ~4.1 GB
- **Geschwindigkeit**: ⚡⚡ Schnell
- **Qualität**: ⭐⭐⭐⭐ Sehr gut

**Option C: Code-spezialisiert**
```bash
docker exec -it codechat-ollama ollama pull codellama:7b
```
- **Größe**: ~3.8 GB
- **Geschwindigkeit**: ⚡⚡ Schnell
- **Qualität**: ⭐⭐⭐⭐ Sehr gut für Code

**Option D: Bestes Modell (langsamer)**
```bash
docker exec -it codechat-ollama ollama pull llama3:8b
```
- **Größe**: ~4.7 GB
- **Geschwindigkeit**: ⚡ Mittel
- **Qualität**: ⭐⭐⭐⭐⭐ Exzellent

---

### Schritt 3: Konfiguriere .env

Siehe [Konfiguration](#-konfiguration) Sektion unten für Details.

---

### Schritt 4: Teste Ollama

```bash
# Prüfe ob Ollama läuft
curl http://localhost:11434/api/tags

# Liste geladene Modelle
docker exec -it codechat-ollama ollama list
```

Erwartete Ausgabe:
```
NAME                    ID              SIZE    MODIFIED
llama3.2:3b            abc123def       2.0 GB  2 minutes ago
```

---

### Schritt 5: Teste die App

```bash
npm run build
npm start ask "Hallo, kannst du mir helfen?"
```

**Wenn es funktioniert:**
```
⤴️ Asking model...
Natürlich! Gerne helfe ich dir. Was möchtest du wissen?
```

✅ **Fertig!**

---

## 📊 Modell-Empfehlungen

### 🌟 Top-Empfehlungen

#### 1. **Mistral 7B** (⭐ Empfohlen für Produktion)
```bash
docker exec -it codechat-ollama ollama pull mistral:7b
```
- **Größe**: 4.1 GB
- **RAM**: 8 GB minimum, 16 GB empfohlen
- **Geschwindigkeit**: ⚡⚡ Schnell
- **Qualität**: ⭐⭐⭐⭐ Sehr gut
- **Verwendung**: Allgemein, ausgewogenes Preis-Leistungs-Verhältnis
- **Perfekt für**: Produktive Workflows, Dokumentation, Code-Reviews

#### 2. **Llama 3.2 3B** (⭐ Empfohlen für Tests/Entwicklung)
```bash
docker exec -it codechat-ollama ollama pull llama3.2:3b
```
- **Größe**: 2.0 GB
- **RAM**: 4 GB minimum, 8 GB empfohlen
- **Geschwindigkeit**: ⚡⚡⚡ Sehr schnell
- **Qualität**: ⭐⭐⭐ Gut
- **Verwendung**: Schnelle Tests, Entwicklung, prototyping
- **Perfekt für**: Quick Start, Feature-Testing, CI/CD

#### 3. **CodeLlama 7B** (⭐ Spezialisiert für Code)
```bash
docker exec -it codechat-ollama ollama pull codellama:7b
```
- **Größe**: 3.8 GB
- **RAM**: 8 GB minimum, 16 GB empfohlen
- **Geschwindigkeit**: ⚡⚡ Schnell
- **Qualität**: ⭐⭐⭐⭐ Sehr gut für Code
- **Verwendung**: Code-Generierung, Refactoring, Bug-Fixes
- **Perfekt für**: Entwickler-Workflows, Code-Assistenz

### 🔥 Weitere Modelle

#### 4. **Llama 3 8B** (Beste Qualität)
```bash
docker exec -it codechat-ollama ollama pull llama3:8b
```
- **Größe**: 4.7 GB
- **RAM**: 12 GB minimum, 16 GB empfohlen
- **Geschwindigkeit**: ⚡ Mittel
- **Qualität**: ⭐⭐⭐⭐⭐ Exzellent
- **Verwendung**: Komplexe Aufgaben, kreatives Schreiben
- **Perfekt für**: Qualität über Geschwindigkeit

#### 5. **Gemma2 2B** (Ultra-schnell)
```bash
docker exec -it codechat-ollama ollama pull gemma2:2b
```
- **Größe**: 1.6 GB
- **RAM**: 4 GB minimum
- **Geschwindigkeit**: ⚡⚡⚡ Ultra-schnell
- **Qualität**: ⭐⭐⭐ Gut
- **Verwendung**: Einfache Aufgaben, maximale Geschwindigkeit
- **Perfekt für**: Low-Resource Setups

#### 6. **Qwen2.5 7B** (Multilingual)
```bash
docker exec -it codechat-ollama ollama pull qwen2.5:7b
```
- **Größe**: 4.7 GB
- **RAM**: 10 GB minimum, 16 GB empfohlen
- **Geschwindigkeit**: ⚡⚡ Schnell
- **Qualität**: ⭐⭐⭐⭐⭐ Exzellent
- **Verwendung**: Mehrsprachige Aufgaben, Übersetzungen
- **Perfekt für**: Internationale Projekte

#### 7. **DeepSeek Coder 6.7B** (Code-Spezialist)
```bash
docker exec -it codechat-ollama ollama pull deepseek-coder:6.7b
```
- **Größe**: 3.8 GB
- **RAM**: 8 GB minimum
- **Geschwindigkeit**: ⚡⚡ Schnell
- **Qualität**: ⭐⭐⭐⭐⭐ Exzellent für Code
- **Verwendung**: Code-Generierung, Code-Vervollständigung
- **Perfekt für**: Pure Coding-Tasks

#### 8. **Phi-3 3.8B** (Microsoft, effizient)
```bash
docker exec -it codechat-ollama ollama pull phi3:3.8b
```
- **Größe**: 2.3 GB
- **RAM**: 6 GB minimum
- **Geschwindigkeit**: ⚡⚡⚡ Schnell
- **Qualität**: ⭐⭐⭐⭐ Sehr gut
- **Verwendung**: Ausgewogen, effizient
- **Perfekt für**: Resource-bewusste Setups

### 📊 Vergleichstabelle

| Modell | Größe | RAM | Speed | Qualität | Use Case |
|--------|-------|-----|-------|----------|----------|
| **Gemma2 2B** | 1.6 GB | 4 GB | ⚡⚡⚡ | ⭐⭐⭐ | Ultra-schnell |
| **Llama3.2 3B** | 2.0 GB | 8 GB | ⚡⚡⚡ | ⭐⭐⭐ | Tests/Dev |
| **Phi-3 3.8B** | 2.3 GB | 6 GB | ⚡⚡⚡ | ⭐⭐⭐⭐ | Effizient |
| **DeepSeek 6.7B** | 3.8 GB | 8 GB | ⚡⚡ | ⭐⭐⭐⭐⭐ | Code |
| **CodeLlama 7B** | 3.8 GB | 8 GB | ⚡⚡ | ⭐⭐⭐⭐ | Code |
| **Mistral 7B** | 4.1 GB | 8 GB | ⚡⭐ | ⭐⭐⭐⭐ | **Empfohlen** |
| **Llama3 8B** | 4.7 GB | 12 GB | ⚡ | ⭐⭐⭐⭐⭐ | Qualität |
| **Qwen2.5 7B** | 4.7 GB | 10 GB | ⚡⚡ | ⭐⭐⭐⭐⭐ | Multilingual |

### 🔍 Quantisierung verstehen

Ollama bietet verschiedene Quantisierungsstufen:

**Standard** (empfohlen):
```bash
ollama pull mistral:7b  # Nutzt standardmäßig Q4_0
```

**Höhere Qualität** (größer, langsamer):
```bash
ollama pull mistral:7b-q6  # Q6 Quantisierung
ollama pull mistral:7b-q8  # Q8 Quantisierung (beste Qualität)
```

**Schneller** (kleiner, etwas weniger Qualität):
```bash
ollama pull mistral:7b-q3  # Q3 Quantisierung
ollama pull mistral:7b-q2  # Q2 Quantisierung (minimale Größe)
```

**Quantisierungs-Übersicht:**
| Stufe | Größe | Qualität | Speed | Verwendung |
|-------|-------|----------|-------|------------|
| **Q2** | 40% | ⭐⭐ | ⚡⚡⚡ | Max. Speed, Low RAM |
| **Q3** | 50% | ⭐⭐⭐ | ⚡⚡⚡ | Schnell |
| **Q4** | 60% | ⭐⭐⭐⭐ | ⚡⚡ | **Standard** |
| **Q6** | 80% | ⭐⭐⭐⭐⭐ | ⚡ | Hohe Qualität |
| **Q8** | 100% | ⭐⭐⭐⭐⭐ | ⚡ | Max. Qualität |

---

## 🎮 Modelle verwalten

### Mehrere Modelle laden:
```bash
docker exec -it codechat-ollama ollama pull llama3.2:3b
docker exec -it codechat-ollama ollama pull mistral:7b
docker exec -it codechat-ollama ollama pull codellama:7b
```

### Modell wechseln:

**Option 1: In .env**
```env
OLLAMA_MODEL=mistral:7b
```

**Option 2: Per Workflow**
```yaml
agents:
  coder:
    role: "Developer"
    backend: ollama
    model: codellama:7b  # Modell pro Agent!

  reviewer:
    role: "Reviewer"
    backend: ollama
    model: mistral:7b  # Anderes Modell!
```

### Modelle auflisten:
```bash
docker exec -it codechat-ollama ollama list
```

### Modell löschen:
```bash
docker exec -it codechat-ollama ollama rm llama3.2:3b
```

---

## ⚙️ Konfiguration

### Basis-Konfiguration in .env

Deine `.env` ist bereits konfiguriert:

```env
# Backend-Auswahl
MODEL_BACKEND=ollama

# Ollama Docker URL
OLLAMA_URL=http://localhost:11434

# Standard-Modell
OLLAMA_MODEL=llama3.2:3b

# Memory-System (Qdrant)
USE_QDRANT=true
QDRANT_URL=http://localhost:6333

# Prompt-History
ASK_STORE_ENABLED=true
```

### Modell wechseln in .env

**Für verschiedene Aufgaben:**
```env
# Allgemein:
OLLAMA_MODEL=mistral:7b

# Code:
OLLAMA_MODEL=codellama:7b

# Beste Qualität:
OLLAMA_MODEL=llama3:8b

# Schnell/Tests:
OLLAMA_MODEL=llama3.2:3b

# Multilingual:
OLLAMA_MODEL=qwen2.5:7b
```

### Modell pro Workflow/Agent

Statt global in `.env` kannst du pro Workflow verschiedene Modelle nutzen:

**workflow.yml:**
```yaml
name: multi-model-workflow
description: Nutzt verschiedene Modelle für verschiedene Aufgaben

agents:
  fast-analyzer:
    role: "Schnelle Code-Analyse"
    backend: ollama
    model: llama3.2:3b  # Schnell für simple Aufgaben

  code-generator:
    role: "Code-Generierung"
    backend: ollama
    model: codellama:7b  # Spezialisiert für Code

  reviewer:
    role: "Code Review"
    backend: ollama
    model: mistral:7b  # Ausgewogen für Reviews

  documenter:
    role: "Dokumentation"
    backend: ollama
    model: llama3:8b  # Beste Qualität für Docs

steps:
  - agent: fast-analyzer
    input: "Analysiere Code-Struktur"

  - agent: code-generator
    input: "Generiere Funktionen"
    context_keys: [fast-analyzer]

  - agent: reviewer
    input: "Review generierten Code"
    context_keys: [code-generator]

  - agent: documenter
    input: "Erstelle Dokumentation"
    context_keys: [code-generator, reviewer]
```

---

## 🔧 Erweiterte Einstellungen

### Modelfile Customization

Erstelle ein angepasstes Modell mit eigenen Parametern:

**Erstelle `Modelfile`:**
```dockerfile
FROM mistral:7b

# System-Prompt anpassen
SYSTEM """
Du bist ein erfahrener Software-Architekt mit 15 Jahren Erfahrung.
Antworte präzise, technisch fundiert und mit Code-Beispielen.
"""

# Parameter optimieren
PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_ctx 4096
PARAMETER repeat_penalty 1.1
```

**Modell erstellen:**
```bash
docker exec -it codechat-ollama ollama create my-custom-mistral -f Modelfile
```

**In .env verwenden:**
```env
OLLAMA_MODEL=my-custom-mistral
```

### Umgebungsvariablen für Ollama Container

Passe `docker-compose.yml` an:

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: codechat-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    restart: unless-stopped
    environment:
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_ORIGINS=*  # CORS erlauben
      - OLLAMA_NUM_PARALLEL=4  # Parallele Requests
      - OLLAMA_MAX_LOADED_MODELS=2  # Max. geladene Modelle im RAM
      - OLLAMA_KEEP_ALIVE=5m  # Modell im RAM halten
```

**Nach Änderung:**
```bash
docker-compose down ollama
docker-compose up -d ollama
```

### GPU-Support (Optional)

Für NVIDIA GPUs:

**docker-compose.yml erweitern:**
```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: codechat-ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    # ... rest
```

**Oder mit nvidia-docker:**
```bash
docker run -d \
  --gpus all \
  -p 11434:11434 \
  -v ollama-data:/root/.ollama \
  --name codechat-ollama \
  ollama/ollama:latest
```

---

## 📝 Parameter-Erklärungen

### Wichtige Inference-Parameter

Diese Parameter kannst du in Modelfiles oder API-Calls setzen:

| Parameter | Bereich | Standard | Beschreibung | Verwendung |
|-----------|---------|----------|--------------|------------|
| **temperature** | 0.0-2.0 | 0.8 | Kreativität/Zufälligkeit | 0.1-0.3: Code, 0.7-0.9: Kreativ, 1.0+: Sehr kreativ |
| **top_p** | 0.0-1.0 | 0.9 | Nucleus Sampling | 0.9: Ausgewogen, 0.95: Mehr Variation |
| **top_k** | 1-100 | 40 | Anzahl Top-Tokens | 20-30: Fokussiert, 40-60: Ausgewogen |
| **num_ctx** | 512-32768 | 2048 | Context-Fenster | 2048: Normal, 4096+: Lange Docs |
| **repeat_penalty** | 0.0-2.0 | 1.1 | Wiederholungs-Strafe | 1.0: Keine, 1.1: Leicht, 1.5+: Stark |
| **num_predict** | -1, 1-∞ | 128 | Max. generierte Tokens | -1: Unbegrenzt, 512: Kurz, 2048: Lang |

### Parameter-Presets für verschiedene Aufgaben

**1. Code-Generierung** (Präzise, deterministisch):
```dockerfile
PARAMETER temperature 0.2
PARAMETER top_p 0.9
PARAMETER top_k 30
PARAMETER num_ctx 4096
PARAMETER repeat_penalty 1.05
```

**2. Dokumentation** (Ausgewogen):
```dockerfile
PARAMETER temperature 0.5
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_ctx 4096
PARAMETER repeat_penalty 1.1
```

**3. Kreatives Schreiben** (Variabel):
```dockerfile
PARAMETER temperature 0.9
PARAMETER top_p 0.95
PARAMETER top_k 60
PARAMETER num_ctx 2048
PARAMETER repeat_penalty 1.0
```

**4. Code-Review** (Analytisch):
```dockerfile
PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER top_k 35
PARAMETER num_ctx 8192
PARAMETER repeat_penalty 1.15
```

---

## 🧪 Testen

### Test 1: Einfache Frage
```bash
npm start ask "Was ist TypeScript?"
```

### Test 2: REPL
```bash
npm start repl
> ask Wie funktioniert OAuth2?
> history oauth
```

### Test 3: Workflow
```bash
npm start repl
> orchestrate webshop-arc42-workflow.yml
```

---

## 📈 Performance-Optimierung

### Hardware-Anforderungen prüfen

**Vor dem Start:**
```bash
# Verfügbaren RAM prüfen (Windows)
systeminfo | findstr "Memory"

# Verfügbaren Speicherplatz prüfen
docker system df
```

**Empfohlene Hardware für verschiedene Modelle:**

| Modell-Größe | Min. RAM | Empf. RAM | Min. Disk | Performance |
|--------------|----------|-----------|-----------|-------------|
| **2B-3B** | 4 GB | 8 GB | 5 GB | ⚡⚡⚡ Sehr schnell |
| **7B** | 8 GB | 16 GB | 10 GB | ⚡⚡ Schnell |
| **13B** | 16 GB | 32 GB | 20 GB | ⚡ Mittel |
| **70B** | 48 GB | 64 GB | 80 GB | 🐌 Langsam |

### Speed-Optimierungen

**1. Kleineres/Schnelleres Modell wählen:**
```bash
# Ultra-schnell (1.6 GB):
docker exec -it codechat-ollama ollama pull gemma2:2b

# Schnell (2 GB):
docker exec -it codechat-ollama ollama pull llama3.2:3b

# Ausgewogen (4.1 GB):
docker exec -it codechat-ollama ollama pull mistral:7b
```

**2. Niedrigere Quantisierung:**
```bash
# Q2 - Sehr schnell, kleinste Größe
docker exec -it codechat-ollama ollama pull mistral:7b-q2

# Q3 - Schnell
docker exec -it codechat-ollama ollama pull mistral:7b-q3

# Q4 - Standard (empfohlen)
docker exec -it codechat-ollama ollama pull mistral:7b
```

**3. Modell im RAM behalten:**

In `docker-compose.yml`:
```yaml
environment:
  - OLLAMA_KEEP_ALIVE=30m  # Modell 30 Min im RAM halten
```

**4. Parallele Requests limitieren:**
```yaml
environment:
  - OLLAMA_NUM_PARALLEL=2  # Weniger parallel = schneller pro Request
```

**5. Context-Fenster reduzieren:**

In Modelfile:
```dockerfile
PARAMETER num_ctx 2048  # Statt 4096 für schnellere Antworten
```

### Qualitäts-Optimierungen

**1. Größeres Modell:**
```bash
# Beste Qualität:
docker exec -it codechat-ollama ollama pull llama3:8b

# Oder:
docker exec -it codechat-ollama ollama pull qwen2.5:7b
```

**2. Höhere Quantisierung:**
```bash
# Q6 - Hohe Qualität:
docker exec -it codechat-ollama ollama pull mistral:7b-q6

# Q8 - Maximale Qualität:
docker exec -it codechat-ollama ollama pull mistral:7b-q8
```

**3. Größeres Context-Fenster:**

In Modelfile:
```dockerfile
PARAMETER num_ctx 8192  # Für lange Dokumente/Code
```

**4. Optimierte Parameter:**
```dockerfile
PARAMETER temperature 0.3  # Weniger zufällig
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1
```

### Memory-Management

**Container-Ressourcen limitieren:**

`docker-compose.yml`:
```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: codechat-ollama
    deploy:
      resources:
        limits:
          memory: 8G  # Max. 8 GB RAM
        reservations:
          memory: 4G  # Min. 4 GB RAM
```

**Modelle automatisch entladen:**
```yaml
environment:
  - OLLAMA_MAX_LOADED_MODELS=1  # Max. 1 Modell im RAM
  - OLLAMA_KEEP_ALIVE=5m  # Nach 5 Min entladen
```

### Disk-Space Management

**Speicherplatz prüfen:**
```bash
# Docker Storage:
docker system df -v

# Ollama Models:
docker exec -it codechat-ollama du -sh /root/.ollama/models
```

**Alte Modelle löschen:**
```bash
# Alle Modelle anzeigen:
docker exec -it codechat-ollama ollama list

# Modell löschen:
docker exec -it codechat-ollama ollama rm <model-name>

# Beispiel:
docker exec -it codechat-ollama ollama rm llama3.2:3b
```

**Docker Cache aufräumen:**
```bash
# Ungenutzte Images/Container löschen:
docker system prune -a

# Nur Ollama-Volumes behalten:
docker system prune --volumes
```

### Network-Optimierungen

**Localhost vs. Container-Netzwerk:**

Wenn App auch in Docker läuft:
```yaml
# docker-compose.yml
services:
  app:
    networks:
      - codechat-network

  ollama:
    networks:
      - codechat-network

networks:
  codechat-network:
```

In `.env`:
```env
OLLAMA_URL=http://ollama:11434  # Container-Name statt localhost
```

---

## 🧪 Erweiterte Tests

### Test 1: Multi-Modell Workflow

Teste verschiedene Modelle für verschiedene Aufgaben:

**1. Erstelle `multi-model-test.yml`:**
```yaml
name: multi-model-performance-test
description: Testet Performance verschiedener Modelle

agents:
  fast-agent:
    role: "Schnelle Analyse"
    backend: ollama
    model: llama3.2:3b

  quality-agent:
    role: "Qualitäts-Generierung"
    backend: ollama
    model: mistral:7b

  code-agent:
    role: "Code-Spezialist"
    backend: ollama
    model: codellama:7b

steps:
  - agent: fast-agent
    input: |
      Analysiere kurz: Was sind die Hauptkomponenten eines Webshops?
      Antworte in 3 Stichpunkten.

  - agent: quality-agent
    input: |
      Basierend auf der Analyse, erstelle eine detaillierte Architektur-Übersicht.
    context_keys: [fast-agent]

  - agent: code-agent
    input: |
      Generiere TypeScript-Interface für Product-Entity.
    context_keys: [fast-agent, quality-agent]
```

**2. Teste:**
```bash
npm start repl
> orchestrate multi-model-test.yml
```

**3. Vergleiche:**
- Geschwindigkeit pro Agent
- Qualität der Antworten
- RAM-Nutzung

### Test 2: Streaming vs. Non-Streaming

**Teste Streaming-Performance:**

```bash
npm start repl

# Streaming (Standard):
> ask Erkläre mir den Singleton Pattern ausführlich

# Beobachte:
# - Token-by-Token Ausgabe
# - Time to First Token (TTFT)
# - Total Time
```

### Test 3: Context-Length Performance

Teste mit verschiedenen Context-Längen:

**1. Erstelle lange Input-Datei:**
```bash
# Erstelle test-long.md mit 2000+ Zeilen Code
```

**2. Teste:**
```bash
npm start repl
> load test-long.md
> ask Fasse den gesamten Code zusammen

# Teste mit verschiedenen Modellen:
# - llama3.2:3b (num_ctx=2048)
# - mistral:7b (num_ctx=4096)
# - llama3:8b (num_ctx=8192)
```

**3. Messe:**
- Response Time
- RAM-Nutzung
- Qualität der Zusammenfassung

### Test 4: Concurrent Requests

Teste parallele Anfragen:

**1. Erstelle `concurrent-test.sh`:**
```bash
#!/bin/bash

# 5 parallele Requests:
for i in {1..5}; do
  (npm start ask "Was ist TypeScript? (Request $i)") &
done

wait
echo "Alle Requests fertig!"
```

**2. Führe aus:**
```bash
bash concurrent-test.sh
```

**3. Beobachte:**
- Gesamt-Response-Time
- RAM-Spikes
- Modell bleibt im RAM?

### Test 5: Model Warmup

Messe Coldstart vs. Warmstart:

**1. Coldstart (Modell nicht im RAM):**
```bash
# Container neu starten:
docker-compose restart ollama

# Sofort testen:
npm start ask "Hallo"
# → Messe Zeit
```

**2. Warmstart (Modell im RAM):**
```bash
# Zweite Anfrage direkt danach:
npm start ask "Was ist OAuth2?"
# → Messe Zeit (sollte viel schneller sein)
```

**3. Optimiere mit KEEP_ALIVE:**
```yaml
environment:
  - OLLAMA_KEEP_ALIVE=30m  # Modell bleibt 30 Min im RAM
```

---

## 🔧 CLI-Befehle Referenz

### Ollama-Befehle im Container

**Modell-Management:**
```bash
# Modell herunterladen:
docker exec -it codechat-ollama ollama pull <model>

# Modelle auflisten:
docker exec -it codechat-ollama ollama list

# Modell löschen:
docker exec -it codechat-ollama ollama rm <model>

# Modell-Details:
docker exec -it codechat-ollama ollama show <model>

# Modell kopieren:
docker exec -it codechat-ollama ollama cp <source> <destination>
```

**Modell direkt testen:**
```bash
# Interaktive Session:
docker exec -it codechat-ollama ollama run mistral:7b

# Einmalige Frage:
docker exec -it codechat-ollama ollama run mistral:7b "Was ist TypeScript?"
```

**Custom Modell erstellen:**
```bash
# Aus Modelfile:
docker exec -it codechat-ollama ollama create my-model -f /path/to/Modelfile

# Modell basierend auf anderem:
docker exec -it codechat-ollama ollama create my-mistral -f - <<EOF
FROM mistral:7b
SYSTEM "Du bist ein Code-Experte"
PARAMETER temperature 0.3
EOF
```

### Docker-Container-Management

**Container starten/stoppen:**
```bash
# Starten:
docker-compose up -d ollama

# Stoppen:
docker-compose stop ollama

# Neu starten:
docker-compose restart ollama

# Logs anzeigen:
docker logs codechat-ollama -f

# Container-Status:
docker ps | grep ollama
```

**Container-Zugriff:**
```bash
# Shell im Container:
docker exec -it codechat-ollama /bin/bash

# Dateien kopieren:
docker cp Modelfile codechat-ollama:/tmp/Modelfile
docker cp codechat-ollama:/root/.ollama/models ./backup/
```

**Resources überwachen:**
```bash
# RAM/CPU Nutzung:
docker stats codechat-ollama

# Container-Details:
docker inspect codechat-ollama
```

### API-Testing

**HTTP API direkt testen:**
```bash
# Verfügbare Modelle:
curl http://localhost:11434/api/tags

# Modell-Info:
curl http://localhost:11434/api/show -d '{
  "name": "mistral:7b"
}'

# Generate (non-streaming):
curl http://localhost:11434/api/generate -d '{
  "model": "mistral:7b",
  "prompt": "Was ist TypeScript?",
  "stream": false
}'

# Chat-Format:
curl http://localhost:11434/api/chat -d '{
  "model": "mistral:7b",
  "messages": [
    {"role": "user", "content": "Was ist OAuth2?"}
  ],
  "stream": false
}'
```

### Debugging

**Verbindung testen:**
```bash
# Ollama erreichbar?
curl -I http://localhost:11434

# Modelle abrufbar?
curl http://localhost:11434/api/tags | jq

# Container läuft?
docker ps | grep ollama

# Logs prüfen:
docker logs codechat-ollama --tail 50
```

**Performance-Metriken:**
```bash
# Response-Zeit messen:
time curl http://localhost:11434/api/generate -d '{
  "model": "mistral:7b",
  "prompt": "Hallo",
  "stream": false
}'

# Container-Stats live:
docker stats codechat-ollama --no-stream
```

---

## 🐛 Troubleshooting

### Problem 1: Container startet nicht

**Symptome:**
- `docker-compose up -d ollama` hängt
- Container erscheint nicht in `docker ps`
- Error: "Cannot start service ollama"

**Lösungen:**

**A) Logs prüfen:**
```bash
# Container-Logs anzeigen:
docker logs codechat-ollama

# Docker Daemon Logs (Windows):
# → Docker Desktop → Settings → Troubleshoot → View Logs
```

**B) Port-Konflikt prüfen:**
```bash
# Windows:
netstat -ano | findstr 11434

# Wenn belegt, Port ändern in docker-compose.yml:
ports:
  - "11435:11434"  # Anderer externer Port

# Dann in .env:
OLLAMA_URL=http://localhost:11435
```

**C) Docker neu starten:**
```bash
# Container entfernen und neu erstellen:
docker-compose down ollama
docker-compose up -d ollama

# Oder Docker Desktop komplett neu starten
```

**D) Volumes prüfen:**
```bash
# Volume löschen und neu erstellen:
docker volume rm codechat_ollama-data
docker-compose up -d ollama
```

---

### Problem 2: Modell lädt nicht herunter

**Symptome:**
- `ollama pull` hängt bei 0%
- Error: "failed to pull model"
- Download bricht ab

**Lösungen:**

**A) Internet-Verbindung prüfen:**
```bash
# Teste Verbindung zu Ollama Registry:
curl -I https://registry.ollama.ai

# Teste DNS:
nslookup registry.ollama.ai
```

**B) Speicherplatz prüfen:**
```bash
# Docker Disk Usage:
docker system df

# Wenn voll, aufräumen:
docker system prune -a
```

**C) Download neu starten:**
```bash
# Container neu starten:
docker-compose restart ollama

# Modell erneut ziehen:
docker exec -it codechat-ollama ollama pull mistral:7b
```

**D) Kleineres Modell testen:**
```bash
# Teste mit kleinerem Modell:
docker exec -it codechat-ollama ollama pull gemma2:2b
```

**E) Proxy/Firewall:**
```bash
# Falls hinter Proxy, in docker-compose.yml:
environment:
  - HTTP_PROXY=http://proxy:port
  - HTTPS_PROXY=http://proxy:port
```

---

### Problem 3: "Connection refused" Fehler in App

**Symptome:**
- `npm start ask "..."` → Error: Connection refused
- App kann nicht mit Ollama verbinden
- ECONNREFUSED localhost:11434

**Lösungen:**

**A) Container läuft?**
```bash
# Status prüfen:
docker ps | grep ollama

# Wenn nicht da, starten:
docker-compose up -d ollama
```

**B) URL in .env korrekt?**
```env
# Muss sein:
OLLAMA_URL=http://localhost:11434

# NICHT:
OLLAMA_URL=http://localhost:11434/v1  # Kein /v1!
OLLAMA_URL=http://localhost:1234  # Falscher Port!
```

**C) Port gemappt?**
```bash
# Prüfe Port-Mapping:
docker port codechat-ollama

# Sollte zeigen:
# 11434/tcp -> 0.0.0.0:11434
```

**D) Firewall blockiert?**
```bash
# Windows Firewall temporär deaktivieren und testen
# Oder Port 11434 explizit erlauben
```

**E) Teste Verbindung direkt:**
```bash
# Sollte Modell-Liste zurückgeben:
curl http://localhost:11434/api/tags

# Wenn das funktioniert, liegt es an der App-Konfiguration
```

---

### Problem 4: Langsame Antworten / Timeout

**Symptome:**
- Modell antwortet extrem langsam
- Timeout-Fehler nach 2 Minuten
- RAM-Auslastung 100%

**Lösungen:**

**A) Kleineres Modell nutzen:**
```bash
# Wechsel zu schnellerem Modell:
docker exec -it codechat-ollama ollama pull llama3.2:3b

# In .env:
OLLAMA_MODEL=llama3.2:3b
```

**B) RAM prüfen:**
```bash
# Container-RAM-Nutzung:
docker stats codechat-ollama

# Wenn zu hoch (>90%), größeres RAM-Limit:
# docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 16G  # Mehr RAM
```

**C) Modell im RAM behalten:**
```yaml
# docker-compose.yml:
environment:
  - OLLAMA_KEEP_ALIVE=30m
```

**D) Quantisierung reduzieren:**
```bash
# Q2/Q3 statt Q4:
docker exec -it codechat-ollama ollama pull mistral:7b-q2
```

**E) Context reduzieren:**

Erstelle Modelfile:
```dockerfile
FROM mistral:7b
PARAMETER num_ctx 2048  # Statt 4096
```

```bash
docker exec -it codechat-ollama ollama create fast-mistral -f Modelfile
```

---

### Problem 5: "Model not found" Error

**Symptome:**
- Error: "model 'xyz' not found"
- App kann Modell nicht laden
- 404 Not Found

**Lösungen:**

**A) Modell wirklich geladen?**
```bash
# Liste alle Modelle:
docker exec -it codechat-ollama ollama list

# Modell nachladen:
docker exec -it codechat-ollama ollama pull <model-name>
```

**B) Modell-Name korrekt?**
```env
# In .env, muss exakt sein:
OLLAMA_MODEL=mistral:7b  # ✅ Korrekt

# NICHT:
OLLAMA_MODEL=mistral  # ❌ Ohne Tag
OLLAMA_MODEL=mistral-7b  # ❌ Falsches Format
OLLAMA_MODEL=Mistral:7b  # ❌ Groß-/Kleinschreibung
```

**C) Modell-Tag prüfen:**
```bash
# Zeige verfügbare Tags:
docker exec -it codechat-ollama ollama list

# Beispiel-Output:
# NAME              TAG     SIZE
# mistral:7b        latest  4.1GB
# llama3.2:3b       latest  2.0GB

# Nutze exakt diesen Namen in .env
```

---

### Problem 6: Container läuft, aber API antwortet nicht

**Symptome:**
- `docker ps` zeigt Container als "Up"
- Aber `curl http://localhost:11434` → keine Antwort
- Health Check failed

**Lösungen:**

**A) Container-Logs prüfen:**
```bash
# Live-Logs:
docker logs codechat-ollama -f

# Suche nach Errors:
docker logs codechat-ollama 2>&1 | grep -i error
```

**B) Container neu starten:**
```bash
# Graceful Restart:
docker-compose restart ollama

# Hard Restart:
docker-compose down ollama
docker-compose up -d ollama
```

**C) Health Check hinzufügen:**

In `docker-compose.yml`:
```yaml
services:
  ollama:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**D) OLLAMA_HOST prüfen:**
```yaml
# In docker-compose.yml muss sein:
environment:
  - OLLAMA_HOST=0.0.0.0  # NICHT 127.0.0.1!
```

---

### Problem 7: GPU nicht erkannt (Optional)

**Symptome:**
- Modell läuft nur auf CPU
- Langsame Performance trotz GPU
- nvidia-smi zeigt keine Ollama-Nutzung

**Lösungen:**

**A) NVIDIA Container Toolkit installiert?**
```bash
# Prüfen:
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# Wenn Fehler, installiere:
# https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html
```

**B) GPU in docker-compose.yml aktiviert?**
```yaml
services:
  ollama:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

**C) Container neu starten:**
```bash
docker-compose down ollama
docker-compose up -d ollama

# GPU-Nutzung prüfen:
nvidia-smi
```

---

### Problem 8: Memory Leak / RAM wächst ständig

**Symptome:**
- Container-RAM steigt kontinuierlich
- System wird langsam
- Docker Desktop braucht >10 GB RAM

**Lösungen:**

**A) KEEP_ALIVE kürzer setzen:**
```yaml
environment:
  - OLLAMA_KEEP_ALIVE=5m  # Modelle schneller entladen
```

**B) MAX_LOADED_MODELS begrenzen:**
```yaml
environment:
  - OLLAMA_MAX_LOADED_MODELS=1  # Nur 1 Modell im RAM
```

**C) Memory-Limit setzen:**
```yaml
deploy:
  resources:
    limits:
      memory: 8G  # Hard Limit
```

**D) Container regelmäßig neu starten:**
```bash
# Cronjob (Windows Task Scheduler):
# Täglich um 3 Uhr:
docker-compose restart ollama
```

---

### Problem 9: "Error: context window exceeded"

**Symptome:**
- Error: "context length exceeded"
- Zu langer Input/Output
- Modell bricht ab

**Lösungen:**

**A) Größeres Context-Fenster:**

Erstelle Modelfile:
```dockerfile
FROM mistral:7b
PARAMETER num_ctx 8192  # Statt 2048
```

```bash
docker exec -it codechat-ollama ollama create large-ctx-mistral -f Modelfile
```

**B) Input kürzen:**
- Weniger Context in Prompts
- Große Dateien in Chunks aufteilen
- Zusammenfassungen statt voller Code

**C) Modell mit größerem Context:**
```bash
# Llama3 hat größeren Context:
docker exec -it codechat-ollama ollama pull llama3:8b
```

---

### Problem 10: Docker Volume Probleme

**Symptome:**
- Modelle verschwinden nach Container-Neustart
- "No space left on device"
- Volume-Mount Errors

**Lösungen:**

**A) Volume prüfen:**
```bash
# Volumes anzeigen:
docker volume ls

# Volume-Details:
docker volume inspect codechat_ollama-data
```

**B) Volume neu erstellen:**
```bash
# ACHTUNG: Löscht alle Modelle!
docker-compose down
docker volume rm codechat_ollama-data
docker-compose up -d ollama

# Modelle neu laden:
docker exec -it codechat-ollama ollama pull mistral:7b
```

**C) Speicherplatz freigeben:**
```bash
# Docker aufräumen:
docker system prune -a --volumes

# Alte Modelle löschen:
docker exec -it codechat-ollama ollama list
docker exec -it codechat-ollama ollama rm <unused-model>
```

**D) Volume-Path ändern:**

In `docker-compose.yml`:
```yaml
volumes:
  - /path/to/custom/location:/root/.ollama  # Custom Path
```

---

## 📊 LM Studio vs Ollama Docker

### Detaillierter Vergleich

| Feature | LM Studio | Ollama Docker | Gewinner |
|---------|-----------|---------------|----------|
| **Einfachheit** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 🏆 LM Studio |
| **GUI** | ✅ Ja | ❌ Nein | 🏆 LM Studio |
| **Installation** | Desktop App | Docker Image | 🏆 LM Studio |
| **Modell-Download** | GUI (einfach) | CLI (flexibel) | 🏆 LM Studio |
| **Automatisierung** | ⭐⭐ | ⭐⭐⭐⭐⭐ | 🏆 Ollama |
| **Server-Nutzung** | ⭐⭐ | ⭐⭐⭐⭐⭐ | 🏆 Ollama |
| **CI/CD Integration** | ❌ | ✅ | 🏆 Ollama |
| **Windows Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 🏆 LM Studio |
| **Headless Setup** | ❌ | ✅ | 🏆 Ollama |
| **Resource Overhead** | Niedrig | Mittel (Docker) | 🏆 LM Studio |

### Wann Ollama Docker nutzen?

✅ **Perfekt für:**
- Server/Headless Deployments
- CI/CD Pipelines
- Automatisierte Workflows
- Container-basierte Infrastruktur
- Multi-Environment Setups
- DevOps-orientierte Teams

❌ **Weniger geeignet für:**
- Desktop-Einzelnutzer
- GUI-Präferenz
- Einfachste Installation
- Windows-primär

### Wann LM Studio nutzen?

✅ **Perfekt für:**
- Desktop-Entwicklung
- Windows-Nutzer
- GUI-bevorzugte Nutzer
- Einfachste Installation
- Visuelles Modell-Management
- Lokale Entwicklung

❌ **Weniger geeignet für:**
- Server-Deployments
- Automatisierung
- CI/CD
- Headless-Setups

### Beide gleichzeitig?

**Ja, du kannst beide parallel nutzen!**

**LM Studio**: Port 1234 (für lokale Entwicklung)
**Ollama Docker**: Port 11434 (für Server/Automation)

Wechsle einfach in `.env`:
```env
# Für LM Studio:
OLLAMA_URL=http://localhost:1234/v1

# Für Ollama Docker:
OLLAMA_URL=http://localhost:11434
```

Oder nutze verschiedene Modelle per Workflow (siehe Konfiguration oben).

---

## 🚀 Schnellstart-Zusammenfassung

```bash
# 1. Warte bis Ollama Container fertig ist
docker ps  # Sollte codechat-ollama zeigen

# 2. Lade ein Modell (empfohlen: mistral)
docker exec -it codechat-ollama ollama pull mistral:7b

# 3. Prüfe .env (bereits korrekt konfiguriert)
# OLLAMA_URL=http://localhost:11434
# OLLAMA_MODEL=mistral:7b

# 4. Build & Teste
npm run build
npm start ask "Hallo!"

# 5. Workflow mit Memory testen
npm start repl
> orchestrate webshop-arc42-workflow.yml
```

---

## 📦 Komplettes Setup (Ollama + Qdrant)

**Beide Container starten:**
```bash
docker-compose up -d
```

**Status prüfen:**
```bash
docker-compose ps
```

**Erwartete Ausgabe:**
```
NAME                STATUS    PORTS
codechat-ollama     Up        0.0.0.0:11434->11434/tcp
codechat-qdrant     Up        0.0.0.0:6333-6334->6333-6334/tcp
```

**Test:**
```bash
# Ollama testen:
curl http://localhost:11434/api/tags

# Qdrant testen:
curl http://localhost:6333/collections

# App testen:
npm start ask "Teste Memory-Features"
```

---

## 📚 Weiterführende Dokumentation

| Dokument | Inhalt | Link |
|----------|--------|------|
| **LM Studio Setup** | Alternative GUI-basiert | [lm-studio.md](lm-studio.md) |
| **Backend-Vergleich** | Entscheidungshilfe | [backend-comparison.md](backend-comparison.md) |
| **Memory Testing** | 4-Ebenen Memory, Qdrant | [../features/memory-system.md](../features/memory-system.md) |
| **Quick Start** | 5-Minuten Einstieg | [../../QUICK-START.md](../../QUICK-START.md) |
| **README** | Projekt-Übersicht | [../../README.md](../../README.md) |

---

## 🎯 Nächste Schritte

### 1. Erste Schritte
```bash
# Warte auf Ollama Container
docker ps

# Lade dein erstes Modell
docker exec -it codechat-ollama ollama pull llama3.2:3b

# Teste
npm start ask "Hallo!"
```

### 2. Memory-Features erkunden
```bash
npm start repl
> ask Was ist OAuth2?
> ask Erkläre TypeScript
> history oauth  # Findet ähnliche Prompts!
```

### 3. Workflows testen
```bash
> orchestrate memory-test-workflow.yml
> orchestrate webshop-arc42-workflow.yml
```

### 4. Eigene Projekte
- Erstelle eigene Workflows
- Konfiguriere Custom Models
- Nutze Multi-Model Setups

---

## ✅ Zusammenfassung

**Du hast jetzt:**
- ✅ Ollama Docker Setup komplett verstanden
- ✅ 8+ Modelle zur Auswahl kennengelernt
- ✅ Performance-Optimierung gelernt
- ✅ Troubleshooting-Wissen aufgebaut
- ✅ CLI-Befehle Referenz
- ✅ Vergleich mit LM Studio

**Bereit zum Starten:**
```bash
docker ps && \
docker exec -it codechat-ollama ollama pull mistral:7b && \
npm run build && \
npm start repl
```

**Viel Erfolg mit Ollama Docker! 🚀**

**Fragen?** Siehe [QUICK-START.md](../../QUICK-START.md) oder [Troubleshooting](#-troubleshooting)
