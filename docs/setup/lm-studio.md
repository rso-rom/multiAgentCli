# LM Studio Setup für codechat

> **Vollständige Anleitung für LM Studio als KI-Backend**

## 📋 Inhaltsverzeichnis

1. [Warum LM Studio?](#warum-lm-studio)
2. [Installation](#installation)
3. [Schnellstart (3 Schritte)](#schnellstart-3-schritte)
4. [Konfiguration](#konfiguration)
5. [Modell-Empfehlungen](#modell-empfehlungen)
6. [Test-Szenarien](#test-szenarien)
7. [Erweiterte Einstellungen](#erweiterte-einstellungen)
8. [Troubleshooting](#troubleshooting)
9. [Vergleich mit Ollama Docker](#vergleich-mit-ollama-docker)

---

## ✅ Warum LM Studio?

- **Benutzerfreundlich** - Grafische Oberfläche statt Kommandozeile
- **Windows-optimiert** - Native Performance auf Windows
- **OpenAI-kompatibel** - Standard REST API
- **Modell-Verwaltung** - Einfaches Download und Wechseln von Modellen
- **Keine Container** - Läuft direkt auf deinem System
- **GPU-Optimiert** - Automatische CUDA/Metal Unterstützung

---

## 📦 Installation

### LM Studio herunterladen

1. Besuche: **https://lmstudio.ai/**
2. Klicke **Download for Windows**
3. Installiere die heruntergeladene `.exe` Datei
4. Starte LM Studio

**Systemanforderungen:**
- Windows 10/11 (64-bit)
- 8 GB RAM (16 GB empfohlen)
- 20 GB freier Speicher für Modelle
- Optional: NVIDIA GPU mit CUDA (für bessere Performance)

---

## 🚀 Schnellstart (3 Schritte)

### 1. Modell herunterladen

Öffne LM Studio und gehe zu **Search**:

**Empfohlene Modelle:**

| Modell | Größe | Geschwindigkeit | Qualität | Empfehlung |
|--------|-------|----------------|----------|------------|
| `llama-3.2-3b-instruct` | 3 GB | ⚡⚡⚡ Sehr schnell | ⭐⭐⭐ Gut | Für Tests |
| `mistral-7b-instruct-v0.3` | 7 GB | ⚡⚡ Schnell | ⭐⭐⭐⭐ Sehr gut | **Empfohlen** |
| `qwen2.5-7b-instruct` | 7 GB | ⚡⚡ Schnell | ⭐⭐⭐⭐⭐ Exzellent | Beste Qualität |

**Download:**
1. Suche nach dem Modell-Namen
2. Wähle die **Q4_K_M** Quantisierung (guter Balance)
3. Klicke **Download**

### 2. Server starten

1. Gehe zu **Local Server** Tab in LM Studio
2. Wähle dein heruntergeladenes Modell aus
3. Klicke **Start Server**
4. Server läuft auf: `http://localhost:1234`

✅ **Fertig!** Der Server ist jetzt bereit.

### 3. Teste die Verbindung

```bash
# Build und starte
npm run build
npm start ask "Hallo, kannst du mir helfen?"
```

Wenn du eine echte Antwort (nicht Mock) siehst - **es funktioniert!** 🎉

---

## 🧪 Test-Szenarien

### Test 1: Einfache Frage
```bash
npm start ask "Erkläre mir in einem Satz, was TypeScript ist"
```

### Test 2: REPL Session
```bash
npm start repl
```

Im REPL:
```
> ask Was ist der Unterschied zwischen const und let in JavaScript?
> load beispiel.py
> improve Füge Fehlerbehandlung hinzu
> run
> save
> exit
```

### Test 3: Webshop-Workflow
```bash
npm start repl
> orchestrate webshop-arc42-workflow.yml
```

Jetzt bekommst du **echte Ergebnisse** statt Mock-Antworten! 🚀

---

## ⚙️ Konfiguration

### Schritt 1: .env Datei anpassen

Aktualisiere deine `.env` Datei für LM Studio:

```env
# Backend auswählen
MODEL_BACKEND=ollama

# LM Studio nutzt OpenAI-kompatible API
OLLAMA_URL=http://localhost:1234/v1
OLLAMA_MODEL=mistral-7b-instruct-v0.3

# Memory System (optional, benötigt Qdrant)
USE_QDRANT=true
QDRANT_URL=http://localhost:6333

# Prompt-History
ASK_STORE_ENABLED=true
```

**Wichtig:**
- LM Studio nutzt Port `1234`
- Die URL muss `/v1` am Ende haben
- Modell-Name muss exakt mit LM Studio übereinstimmen

### Schritt 2: Modell-Namen herausfinden

In LM Studio:
1. Gehe zu **Local Server** Tab
2. Schaue unter dem ausgewählten Modell
3. Dort steht der exakte Name (z.B. `mistral-7b-instruct-v0.3.Q4_K_M.gguf`)

Nutze den Namen **ohne** `.Q4_K_M.gguf`:
```env
OLLAMA_MODEL=mistral-7b-instruct-v0.3
```

### Modell wechseln

**Option 1: In LM Studio (empfohlen)**
1. Stoppe Server (wenn läuft)
2. Wähle anderes Modell aus Dropdown
3. Starte Server neu
4. Kein .env Änderung nötig (wenn Modell-Name gleich)

**Option 2: Mehrere Modelle nutzen**
```env
# Standard-Modell in .env
OLLAMA_MODEL=mistral-7b-instruct-v0.3
```

In Workflows verschiedene Modelle pro Agent:
```yaml
agents:
  coder:
    backend: ollama
    model: codellama-7b-instruct  # Code-spezialisiert

  writer:
    backend: ollama
    model: mistral-7b-instruct-v0.3  # Allgemein
```

---

## 📊 Modell-Empfehlungen

### Für Einsteiger

**Llama 3.2 3B Instruct**
- **Suche in LM Studio**: `llama-3.2-3b-instruct`
- **Quantisierung**: Q4_K_M
- **Größe**: ~2 GB
- **RAM**: 4-6 GB
- **Speed**: ⚡⚡⚡ Sehr schnell
- **Qualität**: ⭐⭐⭐ Gut
- **Verwendung**: Tests, schnelle Antworten, Prototyping

### Empfohlen für Produktion

**Mistral 7B Instruct v0.3**
- **Suche in LM Studio**: `mistral-7b-instruct`
- **Quantisierung**: Q4_K_M oder Q5_K_M
- **Größe**: ~4-5 GB
- **RAM**: 8-10 GB
- **Speed**: ⚡⚡ Schnell
- **Qualität**: ⭐⭐⭐⭐ Sehr gut
- **Verwendung**: **Beste Allzweck-Wahl**

### Für Code-Generierung

**Code Llama 7B Instruct**
- **Suche in LM Studio**: `codellama-7b-instruct`
- **Quantisierung**: Q4_K_M
- **Größe**: ~4 GB
- **RAM**: 8-10 GB
- **Speed**: ⚡⚡ Schnell
- **Qualität**: ⭐⭐⭐⭐ Sehr gut
- **Verwendung**: Code-Generierung, Refactoring, Code-Reviews

**DeepSeek Coder 6.7B**
- **Suche in LM Studio**: `deepseek-coder-6.7b-instruct`
- **Quantisierung**: Q4_K_M
- **Größe**: ~4 GB
- **RAM**: 8-10 GB
- **Speed**: ⚡⚡ Schnell
- **Qualität**: ⭐⭐⭐⭐⭐ Exzellent
- **Verwendung**: **Beste Wahl für Code**

### Für beste Qualität

**Qwen 2.5 7B Instruct**
- **Suche in LM Studio**: `qwen2.5-7b-instruct`
- **Quantisierung**: Q5_K_M
- **Größe**: ~5 GB
- **RAM**: 10-12 GB
- **Speed**: ⚡ Mittel
- **Qualität**: ⭐⭐⭐⭐⭐ Exzellent
- **Verwendung**: Komplexe Aufgaben, Multilingual, Reasoning

**Llama 3.1 8B Instruct**
- **Suche in LM Studio**: `llama-3.1-8b-instruct`
- **Quantisierung**: Q5_K_M
- **Größe**: ~5.5 GB
- **RAM**: 10-12 GB
- **Speed**: ⚡ Mittel
- **Qualität**: ⭐⭐⭐⭐⭐ Exzellent
- **Verwendung**: Beste Meta-Modell

### Quantisierungs-Guide

| Quantisierung | Größe | Qualität | Speed | Empfehlung |
|---------------|-------|----------|-------|------------|
| **Q4_K_M** | Kleiner | Gut | Schnell | ✅ **Standard** |
| **Q5_K_M** | Mittel | Sehr gut | Mittel | ✅ Bessere Qualität |
| **Q6_K** | Größer | Exzellent | Langsamer | Wenn genug RAM |
| **Q8_0** | Am größten | Beste | Langsamst | Nur mit viel RAM |

**Empfehlung**: Starte mit **Q4_K_M**, upgrade zu Q5_K_M wenn du mehr RAM hast.

---

## 🎯 Erweiterte Einstellungen

### LM Studio Server-Einstellungen

Öffne **Local Server** Tab → **Server Options**:

#### GPU Settings (CUDA/Metal)
```
GPU Offload: 100%  (für maximale GPU-Nutzung)
# Oder niedriger wenn GPU-VRAM begrenzt:
GPU Offload: 50%   (teilt Last zwischen GPU/CPU)
```

#### Performance Settings
```
Context Length: 4096    (Standard)
Context Length: 8192    (für lange Dokumente)
Context Length: 16384   (wenn Modell unterstützt)

Batch Size: 512         (Standard)
Batch Size: 1024        (schneller, mehr VRAM)

Threads: Auto           (nutzt alle CPU-Kerne)
```

#### Inference Settings

**Für Code-Generierung:**
```json
{
  "temperature": 0.3,
  "max_tokens": 2048,
  "top_p": 0.9,
  "top_k": 40,
  "repeat_penalty": 1.1,
  "stop": ["```", "\n\n\n"]
}
```

**Für kreative Texte:**
```json
{
  "temperature": 0.7,
  "max_tokens": 2048,
  "top_p": 0.95,
  "top_k": 50,
  "repeat_penalty": 1.0
}
```

**Für arc42 Dokumentation:**
```json
{
  "temperature": 0.5,
  "max_tokens": 4096,
  "top_p": 0.92,
  "top_k": 45,
  "repeat_penalty": 1.05
}
```

**Für Reasoning/Analyse:**
```json
{
  "temperature": 0.4,
  "max_tokens": 3072,
  "top_p": 0.9,
  "top_k": 40,
  "repeat_penalty": 1.1
}
```

### Parameter-Erklärung

| Parameter | Wert | Effekt |
|-----------|------|--------|
| **temperature** | 0.1-0.3 | Deterministisch, präzise (Code, Fakten) |
| | 0.5-0.7 | Ausgewogen (Dokumentation, Erklärungen) |
| | 0.8-1.0 | Kreativ, variabel (Storytelling, Brainstorming) |
| **max_tokens** | 512-1024 | Kurze Antworten |
| | 2048-4096 | Standard-Antworten |
| | 8192+ | Lange Dokumente |
| **top_p** | 0.9-0.95 | Kontrolliert Diversität |
| **top_k** | 40-50 | Begrenzt Auswahl |
| **repeat_penalty** | 1.0-1.2 | Verhindert Wiederholungen |

---

## 📊 Performance-Optimierung

### Hardware-Checks

**GPU-Nutzung prüfen (NVIDIA):**
```bash
# PowerShell
nvidia-smi
```

**RAM-Nutzung prüfen:**
- **Task Manager** öffnen
- **Leistung** Tab
- Schaue **Arbeitsspeicher**

**Empfohlene Hardware:**

| Modellgröße | Minimaler RAM | Empfohlener RAM | GPU VRAM |
|-------------|---------------|-----------------|----------|
| **3B** | 4 GB | 8 GB | 2 GB (optional) |
| **7B** | 8 GB | 16 GB | 4 GB (empfohlen) |
| **13B** | 16 GB | 32 GB | 8 GB (empfohlen) |
| **30B+** | 32 GB+ | 64 GB+ | 12 GB+ (nötig) |

### Schnellere Antworten

1. **Kleineres Modell wählen**
   - 3B statt 7B
   - Q4 statt Q5 Quantisierung

2. **GPU Offloading maximieren**
   - LM Studio Settings → GPU Offload: 100%
   - Prüfe CUDA/Metal ist aktiviert

3. **Batch Size erhöhen**
   - Server Options → Batch Size: 1024
   - Nur wenn genug VRAM

4. **Context Length reduzieren**
   - Von 8192 auf 4096
   - Wenn du keine langen Dokumente brauchst

5. **CPU-Threads optimieren**
   - Settings → Threads: Auto
   - Oder manuell: [Anzahl CPU-Kerne - 2]

### Bessere Qualität

1. **Größeres Modell**
   - 7B statt 3B
   - 13B für beste Qualität (wenn RAM ausreicht)

2. **Höhere Quantisierung**
   - Q5_K_M statt Q4_K_M
   - Q6_K wenn genug RAM

3. **Context Length erhöhen**
   - 8192 statt 4096
   - Für besseren Kontext-Verständnis

4. **Temperature senken**
   - 0.3-0.5 für präzisere Antworten
   - 0.1-0.2 für maximale Konsistenz

---

## 🧪 Erweiterte Test-Szenarien

### Test 1: Multi-Model Workflow

Lade mehrere Modelle in LM Studio:
- `codellama-7b-instruct` für Code
- `mistral-7b-instruct` für Dokumentation

Erstelle `multi-model-workflow.yml`:
```yaml
name: multi-model-code-review
description: Nutzt verschiedene Modelle für verschiedene Aufgaben

agents:
  coder:
    role: "Code Generator"
    backend: ollama
    model: codellama-7b-instruct  # Spezialisiert

  documenter:
    role: "Documentation Writer"
    backend: ollama
    model: mistral-7b-instruct-v0.3  # Allgemein

  reviewer:
    role: "Code Reviewer"
    backend: ollama
    model: deepseek-coder-6.7b-instruct  # Beste Code-Qualität

steps:
  - agent: coder
    input: "Erstelle eine TypeScript Klasse für User-Management"

  - agent: documenter
    input: "Dokumentiere die Klasse mit JSDoc"
    context_keys: ["coder"]

  - agent: reviewer
    input: "Review Code und Dokumentation"
    context_keys: ["coder", "documenter"]
```

Führe aus:
```bash
npm start repl
> orchestrate multi-model-workflow.yml
```

### Test 2: Streaming vs Non-Streaming

**Streaming (default):**
```bash
npm start ask "Erkläre OAuth2 ausführlich"
# Antwort erscheint Wort für Wort
```

**Non-Streaming:**
```bash
# TODO: Add non-streaming mode
```

### Test 3: Code-Generierung mit Context

```bash
npm start repl
> load src/example.ts
✅ Loaded src/example.ts

> improve Füge TypeScript Strict Mode kompatible Types hinzu, nutze Generics wo möglich
[Model analysiert Code mit vollem Context]

> save
💾 Saved changes to src/example.ts
```

### Test 4: Memory über Sessions (benötigt Qdrant)

**Session 1:**
```bash
npm start repl
> ask Speichere: Unser Projekt nutzt React 18, TypeScript 5, Vite als Bundler
> exit
```

**Session 2 (neu starten):**
```bash
npm start repl
> ask Welche Technologien nutzen wir?
# Model erinnert sich dank Long-term Memory!

> history react
📜 Prompt History
1. [Previous session] ask (98% match)
   "Speichere: Unser Projekt nutzt React 18..."
```

---

## 🔧 Troubleshooting

### ❌ "Connection refused" Fehler

**Symptom:**
```
Error: connect ECONNREFUSED 127.0.0.1:1234
```

**Lösungen:**
1. **Prüfe ob Server läuft:**
   - Öffne LM Studio
   - Gehe zu **Local Server** Tab
   - Schaue Status oben: "Server started on port 1234"

2. **Server neu starten:**
   - Klicke **Stop Server**
   - Warte 5 Sekunden
   - Klicke **Start Server**

3. **Port prüfen:**
   ```bash
   # PowerShell
   netstat -ano | findstr 1234
   ```
   - Sollte LM Studio Prozess zeigen
   - Wenn anderer Prozess: Ändere Port in LM Studio

4. **.env prüfen:**
   ```env
   OLLAMA_URL=http://localhost:1234/v1  # /v1 nicht vergessen!
   ```

### ❌ "Model not found" Fehler

**Symptom:**
```
Error: Model 'mistral-7b-instruct-v0.3' not found
```

**Lösungen:**
1. **Modell-Name prüfen:**
   - In LM Studio → Local Server Tab
   - Schaue exakter Modell-Name im Dropdown
   - Kopiere Namen **ohne** `.gguf` Endung

2. **Modell neu laden:**
   - Stop Server
   - Wähle Modell im Dropdown
   - Start Server
   - Teste: `curl http://localhost:1234/v1/models`

3. **Fallback in .env:**
   ```env
   # Wenn unsicher, nutze generischen Namen:
   OLLAMA_MODEL=mistral
   ```

### ❌ Sehr langsame Antworten

**Symptom:**
- Antworten dauern > 30 Sekunden
- Tokens/Sekunde < 5

**Diagnose:**
1. **GPU-Nutzung prüfen:**
   ```bash
   nvidia-smi  # für NVIDIA
   ```
   - GPU sollte bei ~80-100% sein
   - Wenn GPU Offload: 0% → Problem!

2. **RAM-Nutzung prüfen:**
   - Task Manager → Leistung
   - Wenn RAM > 90% → Zu wenig RAM!

**Lösungen:**
1. **GPU Offloading aktivieren:**
   - LM Studio Settings
   - GPU Offload: 100%
   - Server neu starten

2. **Kleineres Modell:**
   - Wechsle von 7B zu 3B
   - Oder niedrigere Quantisierung (Q4 statt Q5)

3. **Batch Size reduzieren:**
   - Server Options → Batch Size: 256
   - Weniger VRAM nötig

4. **Context Length reduzieren:**
   - Server Options → Context: 2048
   - Statt 4096 oder 8192

### ❌ Mock-Antworten statt echte KI

**Symptom:**
```
```python
# Mock improved file
print("Hello from Mock")
```
```

**Problem:**
App nutzt Mock-Backend statt LM Studio

**Lösung:**
1. **Prüfe .env:**
   ```env
   MODEL_BACKEND=ollama  # NICHT "mock"!
   ```

2. **Neu builden:**
   ```bash
   npm run build
   ```

3. **Teste Verbindung:**
   ```bash
   curl http://localhost:1234/v1/models
   # Sollte Modell-Liste zurückgeben
   ```

### ❌ Out of Memory (OOM) Fehler

**Symptom:**
- LM Studio stürzt ab
- "Out of memory" Meldung
- Windows meldet "Nicht genügend Arbeitsspeicher"

**Lösungen:**
1. **Kleineres Modell:**
   - 3B statt 7B
   - Q4 statt Q5/Q6

2. **GPU Offload reduzieren:**
   - Von 100% auf 50%
   - Teilt Last zwischen GPU/CPU

3. **Andere Programme schließen:**
   - Chrome, Discord, etc.
   - Gib LM Studio mehr RAM

4. **Context Length reduzieren:**
   - Von 8192 auf 2048
   - Weniger Memory pro Request

### ❌ Falsches Modell lädt

**Symptom:**
- Du wählst Mistral, aber Llama lädt
- .env zeigt richtiges Modell

**Problem:**
LM Studio nutzt zuletzt geladenes Modell, ignoriert .env

**Lösung:**
- .env `OLLAMA_MODEL` ist nur für App-Seite
- Wähle Modell **manuell in LM Studio**
- Server neu starten mit richtigem Modell

### ❌ "Invalid request" Fehler

**Symptom:**
```
Error: Invalid request to /v1/chat/completions
```

**Lösungen:**
1. **API-Kompatibilität:**
   - LM Studio nutzt OpenAI-Format
   - Sollte automatisch funktionieren

2. **Server neu starten:**
   - Stop → Wait → Start

3. **App neu builden:**
   ```bash
   npm run build
   ```

### 🆘 Weitere Hilfe

**LM Studio Logs:**
- LM Studio → View → Developer Tools
- Schaue Console für Fehler

**App Logs:**
```bash
npm start repl
# Fehler werden in Terminal angezeigt
```

**Community:**
- LM Studio Discord: https://discord.gg/lmstudio
- GitHub Issues: Siehe README.md

---

## 🆚 Vergleich mit Ollama Docker

| Feature | LM Studio | Ollama (Docker) |
|---------|-----------|-----------------|
| **GUI** | ✅ Ja | ❌ Nein |
| **Einfachheit** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Windows** | ⭐⭐⭐⭐⭐ Nativ | ⭐⭐⭐ Docker |
| **Modell-Management** | ⭐⭐⭐⭐⭐ GUI | ⭐⭐⭐⭐ CLI |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Resource Usage** | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**→ LM Studio gewinnt für Desktop-Nutzung!** 🏆

---

## 📦 Ollama (Docker) - Als Alternative

Falls du es trotzdem versuchen willst:

```bash
# Starte Ollama Container
docker-compose up -d ollama

# Lade ein Modell
docker exec -it codechat-ollama ollama pull llama3.2:3b

# Ändere .env zurück
# OLLAMA_URL=http://localhost:11434
```

Aber **LM Studio ist einfacher und besser für Windows!**

---

## ✅ Zusammenfassung

1. ✅ LM Studio ist bereits installiert
2. ✅ `.env` ist konfiguriert für LM Studio
3. ✅ Lade ein Modell herunter
4. ✅ Starte Server in LM Studio
5. ✅ Teste: `npm start ask "Hallo!"`

**Status**: Bereit für echte KI-Antworten! 🎉

---

## 🎯 Nächste Schritte

### Jetzt testen:
```bash
npm start repl
> orchestrate webshop-arc42-workflow.yml
```

Du bekommst jetzt **echte** Architektur, Code und arc42-Dokumentation statt Mock-Daten! 🚀

### Weitere Workflows:
- `simple-test-workflow.yml` - Einfacher Test
- `oauth-test-workflow.yml` - OAuth2 Test (braucht Google Credentials)
- Erstelle eigene Workflows!

**Viel Erfolg!** 🎉
