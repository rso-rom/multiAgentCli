# Agent Tool Use - Agents mit System-Tools

Agents in cacli können jetzt **System-Tools nutzen**, um Aufgaben besser zu lösen! 🚀

## 🎯 Überblick

Mit Agent Tool Use können deine AI-Agents:
- **Echtzeit-Daten abrufen** via curl/wget
- **Repositories klonen und analysieren** mit git
- **NPM-Packages prüfen** mit npm info
- **Code testen** mit node
- **JSON verarbeiten** mit jq
- **Und mehr!**

## 🚀 Schnellstart

### 1. Agent Tools aktivieren

```bash
# Option 1: Beim Start
cacli --enable-tools

# Option 2: Environment Variable
export ENABLE_AGENT_TOOLS=true
cacli

# Option 3: One-off Ask
cacli ask "What's the current Bitcoin price?" --enable-tools
```

### 2. Beim ersten Start

Das System fragt um Erlaubnis:

```
🔍 Detecting system capabilities for agents...

📋 Detected System Capabilities:

Package Managers:
  ✅ npm (10.9.4)
  ✅ pip3 (Python 3.10)

Version Control:
  ✅ git (git version 2.43.0)

? Allow AI agents to use these tools?
  ✅ Allow all detected tools
  ⚙️  Select specific tools
  ❌ No, use only safe defaults
```

Wähle aus:
- **Allow all** - Alle Tools erlauben (empfohlen)
- **Select specific** - Nur bestimmte Tools
- **No** - Keine Tools (sicherste Option)

### 3. Nutze Agents mit Tools

```bash
cacli --enable-tools

> What's the current Bitcoin price?

# Agent nutzt curl:
🔧 Executing tool: curl https://api.coingecko.com/api/v3/simple/price...
✅ Tool executed successfully

💭 Agent processing results...

The current Bitcoin price is $42,150 USD.
```

## 💡 Beispiele

### Beispiel 1: Echtzeit-Daten abrufen

**User:**
```
> What are the latest releases of React?
```

**Agent:**
```
Let me check the npm registry:
[TOOL:npm_info:react]

Tool execution results:
✅ npm_info:react:
{
  "name": "react",
  "version": "18.2.0",
  "description": "React is a JavaScript library...",
  ...
}

Based on the npm registry, the latest stable version of React is 18.2.0.
The package includes...
```

### Beispiel 2: Repository analysieren

**User:**
```
> Analyze the Express.js repository structure
```

**Agent:**
```
I'll clone the repository and examine its structure:
[TOOL:git_clone:https://github.com/expressjs/express.git]
[TOOL:cat:express/package.json]
[TOOL:shell:ls -la express/]

Tool execution results:
✅ git_clone: Cloning into 'express'...
✅ cat:express/package.json: {
  "name": "express",
  "description": "Fast, unopinionated, minimalist web framework",
  ...
}
✅ shell:ls -la express/:
total 128
drwxr-xr-x  examples/
drwxr-xr-x  lib/
drwxr-xr-x  test/
...

Express.js is organized with the following structure:
- lib/ - Core framework code
- examples/ - Example applications
- test/ - Test suite
...
```

### Beispiel 3: API-Daten verarbeiten

**User:**
```
> Get weather data for Berlin and extract the temperature
```

**Agent:**
```
I'll fetch the weather data and parse it:
[TOOL:curl:https://wttr.in/Berlin?format=j1]
[TOOL:jq:.current_condition[0].temp_C]

Tool execution results:
✅ curl: {"current_condition": [{"temp_C": "15", ...}], ...}
✅ jq: "15"

The current temperature in Berlin is 15°C.
```

### Beispiel 4: Code testen

**User:**
```
> Test if this JavaScript code works: console.log(1 + 1)
```

**Agent:**
```
Let me execute this code:
[TOOL:node:-e "console.log(1 + 1)"]

Tool execution results:
✅ node: 2

Yes, the code works correctly! It outputs: 2
```

## 🔧 Verfügbare Tools

### Web Tools
- **curl** - Fetch URL content
  ```
  [TOOL:curl:https://api.github.com/repos/nodejs/node]
  ```

- **wget** - Download files
  ```
  [TOOL:wget:https://example.com/data.json]
  ```

- **http_get** - Simple HTTP GET
  ```
  [TOOL:http_get:https://api.example.com/v1/data]
  ```

### Git Tools
- **git_clone** - Clone repository (HTTPS only)
  ```
  [TOOL:git_clone:https://github.com/facebook/react.git]
  ```

### Package Tools
- **npm_info** - Get NPM package information
  ```
  [TOOL:npm_info:express]
  ```

### File Tools
- **cat** - Read file content
  ```
  [TOOL:cat:package.json]
  ```

- **grep** - Search in files
  ```
  [TOOL:grep:TODO *.js]
  ```

### Code Execution
- **node** - Execute Node.js code
  ```
  [TOOL:node:-e "console.log(Math.PI)"]
  ```

### JSON Tools
- **jq** - Parse and format JSON
  ```
  [TOOL:jq:. data.json]
  ```

### Shell Tools
- **shell** - Execute safe shell commands
  ```
  [TOOL:shell:ls -la]
  [TOOL:shell:pwd]
  [TOOL:shell:date]
  ```

  Allowed commands: ls, pwd, whoami, date, uname, which, echo, head, tail

## 📋 REPL Commands

### /agenttools - Show Tool Status

```bash
> /agenttools

🤖 Agent Tools Status

Available Tools:
  ✅ curl - Fetch URL content using curl
  ✅ wget - Download URL content using wget
  ✅ git_clone - Clone a git repository
  ✅ npm_info - Get npm package info
  ✅ cat - Read file content
  ✅ grep - Search in files
  ✅ node - Execute Node.js code
  ✅ jq - Parse JSON
  ✅ shell - Execute safe shell command

Total: 10 tools available for agents

📋 Permission File: .cacli-permissions.json
```

### /help - Updated Help

```bash
> /help

🧠 CAILI - Natural Language + Slash Commands

💬 NATURAL LANGUAGE (default)
  Just type your question - no command needed!

  🔧 Agent Tools: ✅ ENABLED
     Agents can use system tools (curl, git, npm, etc.)
     to gather real-time information and execute tasks.

🤖 AI INTERACTION
  /ask <prompt>     Explicit ask (alias: /a)
  /web on|off       Toggle web search (alias: /w)
  /agenttools       Show available agent tools and permissions
  ...
```

## 🔒 Sicherheit

### Was Tools KÖNNEN (mit Erlaubnis)

✅ Web-Seiten abrufen (curl, wget)
✅ Öffentliche Repos klonen (git - nur HTTPS)
✅ NPM Registry abfragen
✅ Dateien im Working Directory lesen
✅ Sichere Shell-Befehle ausführen (ls, pwd, etc.)
✅ Node.js Code testen

### Was Tools NICHT können

❌ Dateien außerhalb des Working Directory schreiben
❌ System-Dateien modifizieren
❌ Auf /etc, /root, oder .. Pfade zugreifen
❌ Beliebigen Code mit eval/exec ausführen
❌ Packages global installieren
❌ Destruktive Befehle ausführen (rm, mv, etc.)
❌ SSH Git URLs nutzen (nur HTTPS)

### Eingebaute Schutzmechanismen

1. **User-Permission erforderlich** - Explizite Erlaubnis für jedes Tool
2. **Command Sanitization** - Entfernt gefährliche Shell-Zeichen (`;`, `|`, `` ` ``, etc.)
3. **Path Restrictions** - Blockiert Zugriff auf sensitive Directories
4. **Timeouts** - Verhindert unendliche Ausführung (10-30 Sekunden)
5. **Output Limiting** - Begrenzt Ausgabe auf 10KB
6. **HTTPS Only** - Git clone nur mit HTTPS URLs
7. **Whitelisting** - Nur spezifische Shell-Befehle erlaubt

## 🎛️ Konfiguration

### Environment Variable

```bash
# .env
ENABLE_AGENT_TOOLS=true  # Aktiviert Tools für alle Sessions
```

### Permission File

`.cacli-permissions.json`:
```json
{
  "timestamp": "2025-11-23T12:00:00.000Z",
  "permissions": [
    "curl",
    "wget",
    "git",
    "npm",
    "node",
    "cat",
    "grep",
    "jq",
    "shell"
  ]
}
```

### Permissions verwalten

```bash
# Scan system für verfügbare Tools
cacli capabilities scan

# Interaktiv Permissions setzen
cacli capabilities grant

# Aktuelle Permissions anzeigen
cacli capabilities list

# Alle Permissions widerrufen
cacli capabilities revoke
```

## 🔄 Wie es funktioniert

### 1. Tool-Use Prompt

Wenn Tools aktiviert sind, erhält der Agent einen erweiterten Prompt:

```
You have access to the following tools:

**Web Tools:**
1. **curl** - Fetch web pages and API responses
   Usage: [TOOL:curl:https://example.com/api/docs]

2. **wget** - Download content from URLs
   Usage: [TOOL:wget:https://example.com/docs.html]

...

To use a tool, include it in your response using this format:
[TOOL:tool_name:arguments]

User question: {actual user question}
```

### 2. Agentic Loop

```
User: "What's the Bitcoin price?"
  ↓
Agent: "I'll fetch the current price:
        [TOOL:curl:https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd]"
  ↓
System: Erkennt [TOOL:...] im Response
  ↓
System: Führt curl aus
  ↓
System: Gibt Ergebnis an Agent zurück
  ↓
Agent: "Based on the API response, Bitcoin is at $42,150 USD"
  ↓
User: Sieht finale Antwort
```

### 3. Multi-Iteration

Agents können **mehrere Tool-Calls** machen:

```
Iteration 1:
  Agent: [TOOL:npm_info:react]
  System: Führt aus, gibt Daten zurück

Iteration 2:
  Agent: [TOOL:curl:https://react.dev/blog]
  System: Führt aus, gibt Daten zurück

Iteration 3:
  Agent: "Based on npm and the official blog, here's what I found..."
  (Keine Tools → fertig!)
```

Maximum: **3 Iterationen** pro Ask

## 📊 Use Cases

### 1. Research Assistant

```bash
> Research the latest trends in AI
```

Agent kann:
- ✅ APIs abfragen für aktuelle Daten
- ✅ GitHub Repos analysieren
- ✅ NPM Packages prüfen
- ✅ Aktuelle News-Sites crawlen

### 2. Code Helper

```bash
> Test if this regex works: ^[a-z]+$
```

Agent kann:
- ✅ Code mit node ausführen
- ✅ Package-Kompatibilität prüfen
- ✅ Beispiele aus Repos holen
- ✅ Dokumentation fetchen

### 3. DevOps Assistant

```bash
> Check the status of my project
```

Agent kann:
- ✅ `git status` ausführen
- ✅ Package.json lesen
- ✅ Dependencies prüfen
- ✅ Build-Logs analysieren

### 4. Data Analyst

```bash
> Fetch weather data and show trends
```

Agent kann:
- ✅ APIs abfragen
- ✅ JSON mit jq parsen
- ✅ Daten aggregieren
- ✅ Trends berechnen

## 🆚 Vergleich: Mit vs. Ohne Tools

### Ohne Tools (Standard)

```bash
> What's the current Bitcoin price?

Based on my training data (up to January 2025), Bitcoin prices
typically range from $30,000 to $100,000. However, I cannot
provide the current real-time price without internet access.
```

❌ Keine aktuellen Daten
❌ Nur Trainings-Wissen
❌ Kann keine APIs abfragen

### Mit Tools (--enable-tools)

```bash
> What's the current Bitcoin price?

I'll fetch the current price:
[TOOL:curl:https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd]

🔧 Executing tool: curl https://api.coingecko.com/...
✅ Tool executed successfully

💭 Agent processing results...

The current Bitcoin price is $42,150 USD (as of just now).
```

✅ Echtzeit-Daten
✅ Genaue Antwort
✅ Transparenz (du siehst welche Tools genutzt werden)

## 🔧 Troubleshooting

### "Agent tools not enabled"

**Problem**: `/agenttools` zeigt "not enabled"

**Lösung**:
```bash
# Start mit --enable-tools
cacli --enable-tools

# Oder Environment Variable
export ENABLE_AGENT_TOOLS=true
cacli
```

### "Tool not available or permission not granted"

**Problem**: Agent kann Tool nicht nutzen

**Lösung**:
```bash
# Prüfe Permissions
cacli capabilities list

# Gebe Permissions
cacli capabilities grant
```

### "Maximum iterations reached"

**Problem**: Agent stoppt nach 3 Iterationen

**Erklärung**: Sicherheits-Limit um Endlos-Loops zu verhindern

**Lösung**: Stelle eine spezifischere Frage oder teile die Aufgabe auf

### Tool-Output ist abgeschnitten

**Problem**: Tool gibt "...[truncated]" zurück

**Erklärung**: Output ist auf 10KB begrenzt

**Lösung**: Verwende spezifischere Tools oder filtere die Daten

## 📚 Weiterführende Dokumentation

- [Capability Detection](./capability-detection.md) - Permission System
- [Agentic Auto-Configuration](./agentic-auto-configuration.md) - Tool-Use für Backend-Konfiguration
- [Auto-Configuration](./auto-configuration.md) - Self-configuring Backends

## 🎉 Zusammenfassung

Mit Agent Tool Use können deine Agents:

✅ **Echtzeit-Daten** abrufen statt veraltetes Wissen
✅ **Code testen** bevor sie ihn vorschlagen
✅ **Repositories analysieren** für bessere Empfehlungen
✅ **APIs prüfen** für aktuelle Informationen
✅ **Sicher arbeiten** mit Permission-System

**Probier es aus:**

```bash
cacli --enable-tools

> What are the trending GitHub repos today?
```

Agents werden dadurch **deutlich leistungsfähiger** - ähnlich wie ChatGPT mit Plugins oder Claude with Tools! 🚀
