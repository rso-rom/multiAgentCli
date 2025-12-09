# Advanced Agent Capabilities - MCP & GUI Control

Agents können jetzt **noch viel mehr**! 🚀

## 🔌 MCP (Model Context Protocol) Integration

### Was ist MCP?

**Model Context Protocol** (MCP) ist Anthropic's offenes Protocol für AI-Tool-Integration. Apps wie VS Code, Obsidian, und andere können MCP Server bereitstellen, die Agents dann nutzen können!

### Verfügbare MCP Server

#### VS Code MCP
```typescript
Tools:
- open_file: Öffne Dateien in VS Code
- edit_file: Bearbeite Dateien
- run_terminal: Führe Befehle im Terminal aus
- search_files: Suche Dateien im Workspace
```

#### Obsidian MCP
```typescript
Tools:
- create_note: Erstelle neue Notes
- search_notes: Durchsuche Vault
- link_notes: Verlinke Notes
- get_note: Lese Note-Inhalt
```

#### Custom MCP Servers
Du kannst eigene MCP Server definieren in `~/.config/mcp/servers.json`:

```json
{
  "servers": {
    "my-custom-server": {
      "url": "http://localhost:3002",
      "port": 3002,
      "tools": [
        {
          "name": "custom_tool",
          "description": "Does something cool",
          "parameters": {
            "param1": "string"
          }
        }
      ]
    }
  }
}
```

### Agent Usage - MCP

**User:**
```
> Open the README.md file in VS Code
```

**Agent:**
```
I'll open that file for you using VS Code MCP:
[TOOL:mcp:vscode:open_file:{"file_path":"README.md"}]

🔧 [MCP] Executing vscode:open_file...
✅ [MCP] open_file executed successfully

The README.md file is now open in VS Code!
```

**User:**
```
> Create an Obsidian note about today's meeting
```

**Agent:**
```
I'll create a note in Obsidian:
[TOOL:mcp:obsidian:create_note:{"title":"Meeting Notes 2025-11-23","content":"# Meeting Notes\n\n## Agenda\n- ..."}]

✅ Note created in Obsidian!
```

---

## 🖱️ GUI Control - Maus & Tastatur Steuerung

### Was ist möglich?

Agents können die **Maus und Tastatur steuern**, um:
- ✅ Photoshop, GIMP, Paint, Krita bedienen
- ✅ Bilder erstellen und bearbeiten
- ✅ Menüs navigieren
- ✅ Screenshots machen
- ✅ Jede GUI-Anwendung automatisieren

### Voraussetzungen

**Linux:**
```bash
# Python3 und PyAutoGUI
sudo apt-get install python3 python3-pip
pip3 install pyautogui

# Zusätzliche Tools
sudo apt-get install xdotool wmctrl scrot
```

**macOS:**
```bash
# Python3 und PyAutoGUI
brew install python3
pip3 install pyautogui

# cliclick für macOS
brew install cliclick
```

**Windows:**
```bash
# Python3 und PyAutoGUI
# Download Python von python.org
pip install pyautogui
```

### Verfügbare GUI Tools

```typescript
GUI Tools:
- move_mouse: Bewege Maus zu Position
- click: Klicke Maus-Button
- type: Tippe Text
- press_key: Drücke Taste
- drag: Ziehe Maus (für Zeichnen)
- screenshot: Mache Screenshot
- launch_app: Starte Anwendung
- find_window: Finde Fenster
```

### Agent Usage - GUI Control

**User:**
```
> Create a new image in GIMP: 800x600, draw a red rectangle
```

**Agent:**
```
I'll create that image for you:

[TOOL:gui:launch_app:gimp]
🚀 Launching gimp...
✅ gimp ready

[TOOL:gui:create_image:{"width":800,"height":600}]
📄 Creating new image: 800x600
✅ Canvas created

[TOOL:gui:select_tool:rectangle]
🔧 Selecting tool: rectangle

[TOOL:gui:set_color:#FF0000]
🎨 Setting color: #FF0000

[TOOL:gui:draw_rectangle:{"x":100,"y":100,"width":300,"height":200}]
📐 Drawing rectangle: 100,100 300x200
✅ Rectangle drawn

Your image is ready in GIMP!
```

**User:**
```
> Apply a blur filter to the current image
```

**Agent:**
```
[TOOL:gui:apply_filter:{"filter":"gaussian_blur","radius":5}]
💫 Applying blur filter (radius: 5)
✅ Blur applied

The blur filter has been applied!
```

**User:**
```
> Save the image as logo.png
```

**Agent:**
```
[TOOL:gui:save_image:/home/user/logo.png]
💾 Saving image: /home/user/logo.png
✅ Image saved

Image saved to /home/user/logo.png
```

### Photoshop Beispiel

**User:**
```
> Create a logo in Photoshop: 1000x500, white background, add "MyBrand" text in blue
```

**Agent:**
```
[TOOL:gui:launch_app:photoshop]
[TOOL:gui:create_image:{"width":1000,"height":500}]
[TOOL:gui:fill:{"x":500,"y":250,"color":"#FFFFFF"}]
[TOOL:gui:add_text:{"x":300,"y":250,"text":"MyBrand","size":72,"color":"#0000FF"}]
[TOOL:gui:save_image:/home/user/mybrand-logo.png]

✅ Logo created and saved!
```

---

## 🎨 High-Level Image Creation

### ImageCreator API

Für komplexere Aufgaben gibt es High-Level Functions:

```typescript
// Create Logo
const imagePath = await imageCreator.createLogo(
  800,              // width
  600,              // height
  "MyBrand",        // text
  "#FFFFFF",        // background color
  "#000000"         // text color
);

// Create Diagram
const diagramPath = await imageCreator.createDiagram(
  1000,             // width
  800,              // height
  [
    { type: 'rectangle', x: 100, y: 100, width: 200, height: 150, color: '#FF0000' },
    { type: 'ellipse', x: 400, y: 100, width: 200, height: 150, color: '#00FF00' },
    { type: 'line', x: 300, y: 175, to: { x: 400, y: 175 }, color: '#000000' }
  ]
);
```

### Agent Usage - High-Level

**User:**
```
> Create a flowchart with 3 boxes connected by arrows
```

**Agent:**
```
I'll create a flowchart for you:

[TOOL:gui:create_diagram:{
  "width": 1000,
  "height": 600,
  "shapes": [
    {"type":"rectangle","x":100,"y":100,"width":200,"height":100,"color":"#4CAF50"},
    {"type":"line","x":300,"y":150,"to":{"x":400,"y":150},"color":"#000000"},
    {"type":"rectangle","x":400,"y":100,"width":200,"height":100,"color":"#2196F3"},
    {"type":"line","x":600,"y":150,"to":{"x":700,"y":150},"color":"#000000"},
    {"type":"rectangle","x":700,"y":100,"width":200,"height":100,"color":"#FF9800"}
  ]
}]

✅ Flowchart created and saved!
```

---

## 🔒 Sicherheit

### MCP Security

- ✅ **User Permission** erforderlich für jeden MCP Server
- ✅ **Server Whitelisting** - nur erlaubte Server
- ✅ **Tool-Level Permissions** - feingranulare Kontrolle
- ✅ **Audit Log** - alle MCP Calls werden geloggt

### GUI Control Security

- ⚠️ **WARNUNG**: GUI Control ist **sehr mächtig**!
- ⚠️ Agent kann **Maus und Tastatur** übernehmen
- ⚠️ Agent kann **jede Anwendung** steuern

**Safety Measures:**
- ✅ **Opt-In** - muss explizit aktiviert werden
- ✅ **Confirmation Prompts** - bei kritischen Actions
- ✅ **Activity Monitoring** - du siehst was der Agent tut
- ✅ **Emergency Stop** - jederzeit abbrechen mit Ctrl+C
- ✅ **Screenshot Feedback** - Agent sieht was er tut (mit Vision)

### Permission Levels

```typescript
GUI Permissions:
- 'gui:read'     ✅ Screenshots, Window Detection (safe)
- 'gui:control'  ⚠️  Mouse/Keyboard Control (powerful!)

Empfehlung:
- Starte mit 'gui:read' only
- Aktiviere 'gui:control' nur wenn nötig
- Überwache Agent während GUI Control
```

---

## 🎯 Aktivierung

### MCP aktivieren

```bash
# Option 1: Beim Start
cacli --enable-tools --enable-mcp

# Option 2: Environment Variable
export ENABLE_MCP=true
cacli

# Beim ersten Start:
🔍 Scanning for MCP servers...

📋 Detected MCP Servers:

VS Code MCP (http://localhost:3000):
  ✅ open_file - Open a file in VS Code
  ✅ edit_file - Edit a file in VS Code
  ✅ run_terminal - Run command in VS Code terminal

? Allow AI agents to use MCP servers?
  ✅ Allow all detected MCP servers
  ⚙️  Select specific servers
  ❌ No, use only local tools
```

### GUI Control aktivieren

```bash
# Option 1: Beim Start
cacli --enable-tools --enable-gui

# Option 2: Environment Variable
export ENABLE_GUI_CONTROL=true
cacli

# WARNUNG angezeigt:
⚠️  GUI CONTROL ENABLED
   Agents can control your mouse and keyboard!

   This allows agents to:
   - Move your mouse
   - Click buttons
   - Type text
   - Control applications

   Make sure you supervise the agent!
   Press Ctrl+C anytime to stop.

? Continue? (y/N)
```

---

## 💡 Beispiel-Sessions

### Session 1: VS Code Development

```bash
cacli --enable-tools --enable-mcp

> Open the src/index.ts file in VS Code and show me the first 20 lines

Agent:
[TOOL:mcp:vscode:open_file:{"file_path":"src/index.ts"}]
✅ File opened in VS Code

[TOOL:cat:src/index.ts]
Here are the first 20 lines:
...
```

### Session 2: Obsidian Note Taking

```bash
> Create an Obsidian note summarizing our conversation about MCP

Agent:
[TOOL:mcp:obsidian:create_note:{
  "title":"MCP Integration Notes",
  "content":"# MCP Integration\n\n## Overview\nWe discussed integrating Model Context Protocol..."
}]

✅ Note created in your Obsidian vault!
```

### Session 3: Image Creation in GIMP

```bash
cacli --enable-tools --enable-gui

> Create a simple business card design in GIMP:
  - Size: 1000x600
  - White background
  - Add "John Doe" in large text
  - Add "CEO, TechCorp" below in smaller text
  - Add a blue rectangle as decoration

Agent:
🚀 Launching GIMP...
📄 Creating new image: 1000x600
🎨 Fill with white
📝 Adding text "John Doe" (size 48)
📝 Adding text "CEO, TechCorp" (size 24)
📐 Drawing blue rectangle
💾 Saving to /tmp/business-card.png

✅ Your business card is ready!

Would you like me to:
- Adjust the design?
- Change colors?
- Add more elements?
```

### Session 4: Photoshop Logo Creation

```bash
> Design a logo in Photoshop for my coffee shop "Bean & Brew"

Agent:
🎨 I'll create a coffee shop logo for you!

[TOOL:gui:launch_app:photoshop]
[TOOL:gui:create_image:{"width":800,"height":800}]
[TOOL:gui:draw_ellipse:{"x":200,"y":200,"width":400,"height":400,"color":"#6F4E37"}]
[TOOL:gui:add_text:{"x":250,"y":350,"text":"Bean & Brew","size":64,"color":"#FFFFFF"}]
[TOOL:gui:add_text:{"x":300,"y":450,"text":"Coffee Shop","size":32,"color":"#FFE4B5"}]

✅ Logo created!

I've designed a logo with:
- Brown circular background (coffee color)
- "Bean & Brew" in white
- "Coffee Shop" subtitle in cream

Would you like me to adjust anything?
```

---

## 🔧 Troubleshooting

### MCP Server nicht gefunden

**Problem:** "No MCP servers detected"

**Lösung:**
1. Prüfe ob MCP-Server läuft:
   ```bash
   curl http://localhost:3000/mcp/info
   ```

2. Installiere VS Code MCP Extension:
   ```bash
   code --install-extension anthropic.mcp
   ```

3. Erstelle Custom Server Config:
   ```bash
   mkdir -p ~/.config/mcp
   vim ~/.config/mcp/servers.json
   ```

### GUI Control funktioniert nicht

**Problem:** "PyAutoGUI not available"

**Lösung:**
```bash
# Linux
sudo apt-get install python3-tk python3-dev
pip3 install pyautogui pillow

# macOS
pip3 install pyautogui pillow

# Test
python3 -c "import pyautogui; print('OK')"
```

### Maus bewegt sich nicht

**Problem:** GUI commands fail silently

**Lösung:**
1. Prüfe Permissions (Linux):
   ```bash
   # X11 Zugriff
   xhost +local:
   ```

2. Prüfe ob xdotool installiert ist:
   ```bash
   sudo apt-get install xdotool wmctrl
   ```

3. Test manual:
   ```bash
   python3 -c "import pyautogui; pyautogui.moveTo(500, 500)"
   ```

### App öffnet nicht

**Problem:** Application not launching

**Lösung:**
1. Prüfe App-Name:
   ```bash
   # Linux: which gimp
   # macOS: ls /Applications/
   ```

2. Setze vollständigen Pfad:
   ```typescript
   await gui.launchApp('/usr/bin/gimp');
   ```

---

## 📚 API Reference

### MCP Tools

```typescript
// Execute MCP tool
[TOOL:mcp:server_name:tool_name:parameters_json]

// Example
[TOOL:mcp:vscode:open_file:{"file_path":"README.md"}]
[TOOL:mcp:obsidian:create_note:{"title":"Test","content":"Hello"}]
```

### GUI Tools

```typescript
// Mouse control
[TOOL:gui:move_mouse:{"x":100,"y":200}]
[TOOL:gui:click:{"button":"left","clicks":1}]
[TOOL:gui:drag:{"from":{"x":100,"y":100},"to":{"x":200,"y":200}}]

// Keyboard control
[TOOL:gui:type:{"text":"Hello World"}]
[TOOL:gui:press_key:{"key":"Return"}]
[TOOL:gui:press_keys:{"keys":["ctrl","s"]}]

// Application control
[TOOL:gui:launch_app:{"app":"gimp"}]
[TOOL:gui:find_window:{"title":"GIMP"}]
[TOOL:gui:screenshot:{}]

// Image editing (high-level)
[TOOL:gui:create_image:{"width":800,"height":600}]
[TOOL:gui:draw_rectangle:{"x":100,"y":100,"width":200,"height":150,"color":"#FF0000"}]
[TOOL:gui:draw_ellipse:{"x":100,"y":100,"width":200,"height":150,"color":"#00FF00"}]
[TOOL:gui:add_text:{"x":100,"y":100,"text":"Hello","size":48,"color":"#000000"}]
[TOOL:gui:fill:{"x":100,"y":100,"color":"#FFFFFF"}]
[TOOL:gui:apply_blur:{"radius":5}]
[TOOL:gui:save_image:{"path":"/tmp/output.png"}]
```

---

## 🎉 Zusammenfassung

Mit **MCP** und **GUI Control** können Agents jetzt:

**MCP:**
- ✅ VS Code fernsteuern
- ✅ Obsidian Notes erstellen
- ✅ Custom Tools nutzen
- ✅ Sicher und kontrolliert

**GUI Control:**
- ✅ Photoshop automatisieren
- ✅ GIMP bedienen
- ✅ Bilder erstellen
- ✅ Jede GUI-App steuern

**Aktivierung:**
```bash
cacli --enable-tools --enable-mcp --enable-gui
```

**Safety First!**
- ⚠️ GUI Control ist mächtig - nutze mit Bedacht
- ✅ Starte mit MCP (sicherer)
- ✅ Überwache Agent bei GUI Control
- ✅ Jederzeit Ctrl+C zum Stoppen

Agents sind jetzt **extrem leistungsfähig**! 🚀
