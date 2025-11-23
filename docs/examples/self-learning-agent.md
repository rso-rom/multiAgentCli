# Self-Learning Agent - Learns from Internet Docs

Agents können sich **selbst beibringen** wie man Tools bedient, indem sie:
1. **Dokumentation im Internet lesen** (via curl/wget)
2. **Die Anleitung verstehen**
3. **Die Schritte anwenden** (via GUI Control)

## 🤯 Wie es funktioniert

### Beispiel: Agent lernt GIMP selbst

**User:**
```
> I want to create a watermark in GIMP, but I don't know how
```

**Agent (selbstlernend):**
```
Let me learn how to create a watermark in GIMP by reading the documentation:

[TOOL:curl:https://docs.gimp.org/en/gimp-tutorial-watermark.html]
🔧 Executing tool: curl...
✅ Tool executed successfully

I've learned from the GIMP documentation that creating a watermark involves:
1. Open or create an image
2. Add a new text layer
3. Set text properties (font, size, opacity)
4. Position the text
5. Optionally rotate or add effects

Now I'll apply these steps using GUI control:

[TOOL:gui:launch_app:gimp]
🚀 Launching gimp...

[TOOL:gui:open_file:/path/to/image.png]
📂 Opening image...

[TOOL:gui:add_text:{"x":50,"y":50,"text":"© 2025 MyBrand","size":24,"opacity":0.5}]
📝 Adding watermark text...

✅ Watermark created! I learned this by reading the official GIMP docs.
```

---

## 💡 Reale Beispiele

### Beispiel 1: Photoshop Filter lernen

**User:**
```
> Apply a vintage filter effect in Photoshop
```

**Agent:**
```
I don't know the exact steps for vintage effect, let me research:

[TOOL:curl:https://helpx.adobe.com/photoshop/how-to/vintage-photo-effect.html]
[TOOL:http_get:https://www.photoshoptutorials.net/vintage-effect/]

Based on the tutorials, vintage effect requires:
1. Desaturate colors (reduce saturation to 50%)
2. Add sepia tone
3. Add vignette (dark edges)
4. Add grain/noise

Applying now:

[TOOL:gui:apply_filter:{"filter":"hue_saturation","saturation":-50}]
[TOOL:gui:apply_filter:{"filter":"photo_filter","color":"sepia"}]
[TOOL:gui:add_vignette:{}]
[TOOL:gui:add_noise:{"amount":3}]

✅ Vintage effect applied! Learned from Adobe official docs + community tutorials.
```

### Beispiel 2: Inkscape Logo erstellen

**User:**
```
> Create a modern flat design logo in Inkscape
```

**Agent:**
```
Let me research flat design principles:

[TOOL:curl:https://inkscape.org/doc/tutorials/flat-design/flat-design-tutorial.html]
[TOOL:wget:https://design.tutsplus.com/tutorials/flat-design-inkscape--vector-25633]

From the tutorials, flat design requires:
- Simple shapes (circles, rectangles)
- Solid colors (no gradients)
- Minimal shadows
- Clean typography

Creating logo:

[TOOL:gui:launch_app:inkscape]
[TOOL:gui:create_circle:{"x":100,"y":100,"radius":80,"color":"#3498db"}]
[TOOL:gui:create_rectangle:{"x":50,"y":50,"width":100,"height":20,"color":"#e74c3c"}]
[TOOL:gui:add_text:{"x":200,"y":100,"text":"BRAND","font":"Helvetica","size":48}]

✅ Modern flat logo created based on online tutorials!
```

### Beispiel 3: Blender Tutorial lernen

**User:**
```
> Create a simple 3D cube in Blender with materials
```

**Agent:**
```
I'll learn Blender basics from the official docs:

[TOOL:curl:https://docs.blender.org/manual/en/latest/modeling/meshes/primitives.html]
[TOOL:http_get:https://www.blender.org/support/tutorials/]

Learned:
- Default cube exists on startup
- Tab key enters Edit mode
- Materials panel on the right
- Shading workspace for materials

Executing:

[TOOL:gui:launch_app:blender]
[TOOL:gui:press_key:tab]  # Enter edit mode
[TOOL:gui:click:{"x":1500,"y":400}]  # Materials panel
[TOOL:gui:click_button:new_material]
[TOOL:gui:set_color:{"r":0.8,"g":0.3,"b":0.2}]

✅ Cube created with red material! Learned from Blender docs.
```

---

## 🔄 Learning Workflow

```
User Request
    ↓
Agent: "I don't know how - let me learn!"
    ↓
[TOOL:curl:https://docs.app.com/tutorial]
    ↓
Agent reads and understands
    ↓
Agent creates mental model of steps
    ↓
Agent applies steps via GUI
    ↓
Success! Knowledge retained for future
```

---

## 🎓 Multi-Source Learning

Agents können von **mehreren Quellen** gleichzeitig lernen:

```
[TOOL:curl:https://official-docs.com]        # Official docs
[TOOL:curl:https://stackoverflow.com/q/...] # Community Q&A
[TOOL:curl:https://youtube-transcript...]     # Video tutorials
[TOOL:curl:https://reddit.com/r/app/...]     # User tips
```

**Agent kombiniert Wissen:**
```
From official docs: Basic workflow
From StackOverflow: Common pitfalls to avoid
From YouTube: Pro tips and shortcuts
From Reddit: Best practices

→ Optimal solution!
```

---

## 💪 Adaptive Learning

Agent merkt sich was funktioniert hat:

### First Time (Learning):
```
User: "Create gradient in GIMP"

Agent:
[TOOL:curl:https://docs.gimp.org/en/gimp-tool-gradient.html]
"Learning gradient tool..."
[TOOL:gui:select_tool:gradient]
[TOOL:gui:drag:...]
✅ Success!
```

### Next Time (Remembered):
```
User: "Create another gradient"

Agent:
"I remember how to do this from last time!"
[TOOL:gui:select_tool:gradient]
[TOOL:gui:drag:...]
✅ Done! (no docs needed)
```

---

## 🔧 Error Recovery with Learning

Wenn etwas schief geht, Agent lernt aus Fehlern:

```
[TOOL:gui:apply_filter:blur]
❌ Filter failed

Agent:
"Let me check the docs for the correct syntax..."
[TOOL:curl:https://docs.gimp.org/en/filters.html]

"Ah! Need to specify blur radius. Trying again:"
[TOOL:gui:apply_filter:{"filter":"gaussian_blur","radius":5}]
✅ Success!

💡 Lesson learned: Blur filter requires radius parameter
```

---

## 🌐 Internet as Knowledge Base

Agent kann lernen von:

### Official Docs
```
- https://docs.gimp.org
- https://helpx.adobe.com/photoshop
- https://docs.blender.org
- https://inkscape.org/doc
```

### Tutorials
```
- https://design.tutsplus.com
- https://www.photoshoptutorials.net
- https://cgcookie.com (Blender)
```

### Community
```
- https://stackoverflow.com
- https://reddit.com/r/GIMP
- https://reddit.com/r/blender
- https://superuser.com
```

### Video Transcripts
```
- YouTube transcripts API
- Tutorial videos converted to text
```

---

## 🎯 Praktische Beispiele

### Beispiel: "Lerne mir Krita"

```bash
> I want to use Krita but never used it before. Teach me by example.

Agent:
"I'll learn Krita basics and show you interactively!"

[TOOL:curl:https://docs.krita.org/en/user_manual/getting_started.html]

Based on the docs, let me show you:

1. Interface Overview:
[TOOL:gui:launch_app:krita]
[TOOL:gui:screenshot:{}}]
"Here's the Krita interface. Main areas are:
- Toolbox (left)
- Canvas (center)
- Layers (right)"

2. Creating New Document:
[TOOL:gui:press_keys:ctrl,n]
[TOOL:gui:screenshot:{}}]
"Use Ctrl+N to create new document"

3. Drawing a simple stroke:
[TOOL:gui:select_tool:brush]
[TOOL:gui:draw_stroke:...]
[TOOL:gui:screenshot:{}}]
"Selected brush and drew a stroke"

✅ Tutorial complete! Learned from official Krita docs.
```

### Beispiel: "Best Practices lernen"

```bash
> What's the best way to create web graphics in GIMP?

Agent:
[TOOL:curl:https://www.gimp.org/tutorials/Web_Design/]
[TOOL:http_get:https://webdesign.tutsplus.com/gimp-for-web]

Based on web design tutorials, best practices are:
1. Work in RGB mode (not CMYK)
2. Use 72 DPI
3. Export as PNG or WebP
4. Optimize file size

Let me demonstrate:

[TOOL:gui:create_image:{"width":1920,"height":1080,"dpi":72,"mode":"RGB"}]
[TOOL:gui:export:{"format":"webp","quality":85,"optimize":true}]

✅ Created web-optimized graphic following best practices!
```

---

## 🚀 Advanced: Chain Learning

Agent lernt komplexe Workflows durch Kombination:

```
User: "Create a professional product mockup"

Agent:
"This is complex - I need to learn multiple techniques:"

Step 1: Learn mockup creation
[TOOL:curl:https://mockup-tutorials.com/photoshop-mockup]

Step 2: Learn smart objects
[TOOL:curl:https://helpx.adobe.com/photoshop/using/create-smart-objects.html]

Step 3: Learn perspective transform
[TOOL:curl:https://photoshop-tutorial.com/perspective-transform]

Now combining all knowledge:
1. Open mockup template
2. Create smart object for product
3. Apply perspective transform
4. Add realistic shadows

[TOOL:gui:execute_workflow:{
  "steps": [...all learned steps...]
}]

✅ Professional mockup created! Combined knowledge from 3 tutorials.
```

---

## 📊 Knowledge Retention

Agent baut eine **Knowledge Base** auf:

```typescript
Memory:
{
  "gimp": {
    "create_watermark": {
      "learned_from": "https://docs.gimp.org/watermark",
      "steps": [...],
      "success_rate": 95%,
      "last_used": "2025-11-23"
    },
    "apply_blur": {
      "learned_from": "https://docs.gimp.org/filters",
      "steps": [...],
      "success_rate": 100%,
      "last_used": "2025-11-23"
    }
  },
  "photoshop": {
    "vintage_effect": {
      "learned_from": ["adobe.com", "tutorials.net"],
      "steps": [...],
      "success_rate": 90%
    }
  }
}
```

---

## 🎉 Zusammenfassung

Mit **Self-Learning + Internet Docs** können Agents:

✅ **Unbekannte Tools lernen** durch Docs lesen
✅ **Best Practices anwenden** aus Tutorials
✅ **Fehler korrigieren** durch Nachlesen
✅ **Wissen behalten** für zukünftige Aufgaben
✅ **Komplexe Workflows** durch Kombination lernen

**Workflow:**
```
1. User fragt nach unbekannter Aufgabe
2. Agent: "Let me learn..."
3. curl/wget holt Docs
4. Agent versteht Anleitung
5. Agent wendet an via GUI
6. ✅ Erfolg!
7. 💾 Wissen gespeichert
```

**Das macht Agents:**
- 🧠 **Intelligent** - lernen selbstständig
- 🔄 **Adaptive** - passen sich an neue Tools an
- 📚 **Knowledge-based** - nutzen Internet als Wissensbasis
- 🚀 **Unbegrenzt** - können jedes Tool lernen!

**Probier es aus:**
```bash
cacli --enable-tools --enable-mcp --enable-gui

> Teach me something new about GIMP by researching online tutorials
```

Der Agent wird:
1. Tutorials finden
2. Lernen
3. Dir interaktiv zeigen!

🤯 **Agents die sich selbst Tools beibringen** - die Zukunft ist jetzt!

---

## 🔧 IMPLEMENTIERUNG (v3.0.0)

### Automatische Wissensspeicherung

**NEU in v3.0:** Self-Learning ist jetzt **vollständig integriert** mit automatischer Wissensspeicherung!

#### Wie es funktioniert:

**1. Vor der Ausführung - Wissen prüfen:**
```typescript
// src/repl.ts Lines 718-728
const learned = await this.checkLearnedKnowledge(prompt);
if (learned && learned.similarity > 0.8) {
  console.log(`💡 I remember learning this before! (${similarity}% match)`);
  console.log(learned.text); // Zeigt gespeicherte Tutorial-Schritte
  return; // Überspringt re-learning
}
```

**2. Während der Ausführung - Lernen tracken:**
```typescript
// src/repl.ts Lines 735-738
let usedCurlWget = false;
let tutorialUrl = '';
let executedSteps: string[] = [];

// Lines 762-768 - curl/wget tracken
if (key.includes('curl') || key.includes('wget')) {
  usedCurlWget = true;
  tutorialUrl = extractedUrl; // Tutorial URL speichern
}

// Lines 793, 800-802 - GUI steps tracken
executedSteps.push(`${call.action}: ${JSON.stringify(call.parameters)}`);
```

**3. Nach der Ausführung - Wissen speichern:**
```typescript
// src/repl.ts Lines 800-802
if (usedCurlWget && executedSteps.length > 0) {
  await this.saveLearnedKnowledge(prompt, tutorialUrl, stepsText);
  console.log('💡 Knowledge saved for future use!');
}
```

#### Storage Format:

Gespeichert wird in **Long-term Memory** (Qdrant):

```typescript
{
  agent: 'self-learning',
  text: `Task: ${task}

Tutorial: ${tutorialUrl}

Steps learned:
1. launch_app: {"app":"gimp"}
2. create_image: {"width":800,"height":600}
3. add_text: {"x":100,"y":100,"text":"Watermark"}
...`,
  metadata: {
    type: 'learned_task',
    task: task,
    tutorialUrl: tutorialUrl,
    learned_at: '2025-11-23T14:30:00.000Z',
    source: 'emergent_self_learning'
  }
}
```

#### Semantic Search:

```typescript
// src/repl.ts Lines 927-952
async checkLearnedKnowledge(query: string) {
  const results = await this.askStoreHandler.searchPrompts(query, 5);

  // Nur learned tasks mit hoher Similarity
  const learned = results.find(r =>
    r.metadata?.type === 'learned_task' &&
    r.similarity > 0.8
  );

  return learned || null;
}
```

### Beispiel-Workflow

**Erster Durchlauf (Lernen):**
```bash
cacli --enable-tools --enable-gui

> Create a watermark in GIMP

Agent:
[TOOL:curl:https://docs.gimp.org/watermark-tutorial]
📖 Reading tutorial...

[TOOL:gui:launch_app:{"app":"gimp"}]
🚀 Launching GIMP...

[TOOL:gui:create_image:{"width":800,"height":600}]
📄 Creating image...

[TOOL:gui:add_text:{"x":100,"y":100,"text":"© 2025","size":24}]
📝 Adding watermark...

💡 Knowledge saved for future use!
```

**Zweiter Durchlauf (Wiederverwenden):**
```bash
> Add a watermark to an image in GIMP

Agent:
💡 I remember learning this before! (93.5% match)
📅 Learned: 2025-11-23 14:30:15

📚 Using saved knowledge:

Task: Create a watermark in GIMP

Tutorial: https://docs.gimp.org/watermark-tutorial

Steps learned:
1. launch_app: {"app":"gimp"}
2. create_image: {"width":800,"height":600}
3. add_text: {"x":100,"y":100,"text":"© 2025","size":24}
...

✅ Done! (No need to re-learn)
```

### Integration mit 4-Level Memory

Self-Learning nutzt das bestehende Memory System:

| Memory Level | Verwendung |
|--------------|------------|
| **Short-term** | Aktuelle Session-Variablen (curl output, GUI state) |
| **Mid-term** | Nicht verwendet |
| **Long-term** | ✅ **Learned tasks** mit semantic search |
| **Global** | Könnte für project-übergreifendes Lernen genutzt werden |

### Code-Locations

**Core Implementation:**
- `src/repl.ts:927-952` - `checkLearnedKnowledge()` method
- `src/repl.ts:957-991` - `saveLearnedKnowledge()` method
- `src/repl.ts:718-728` - Knowledge check integration
- `src/repl.ts:735-738` - Learning tracking variables
- `src/repl.ts:762-768` - curl/wget tracking
- `src/repl.ts:793,800-802` - GUI step tracking + save

**Dependencies:**
- `src/orchestrator/ask-store-handler.ts` - Prompt storage with Qdrant
- `src/memory/memory-manager.ts` - 4-level memory system
- `src/memory/qdrant-memory.ts` - Semantic search backend

### Aktivierung

**Automatisch aktiviert** wenn:
1. ✅ `--enable-tools` flag (für curl/wget)
2. ✅ `--enable-gui` flag (für GUI automation)
3. ✅ Qdrant läuft (für memory storage)
4. ✅ Ask-store enabled (standardmäßig aktiv)

Kein extra Flag nötig - emergent behavior!

### Environment Variables

```bash
# Optional: Ask-store deaktivieren (deaktiviert auch Self-Learning)
export ASK_STORE_ENABLED=false

# Optional: Qdrant URL
export QDRANT_URL=http://localhost:6333

# Required: Tools + GUI
export ENABLE_AGENT_TOOLS=true
export ENABLE_GUI_CONTROL=true
```

### Limitations

**Aktuell:**
- ✅ Speichert nur wenn curl/wget + GUI beide verwendet werden
- ✅ Similarity threshold: 0.8 (80%)
- ✅ Nur erste gefundene Tutorial-URL wird gespeichert
- ✅ Keine Unterscheidung zwischen erfolgreichen/fehlgeschlagenen Versuchen

**Potentielle Verbesserungen:**
- 🔄 Success/failure tracking
- 🔄 Multiple tutorial URL tracking
- 🔄 Step-by-step success rates
- 🔄 Adaptive similarity thresholds
- 🔄 Feedback loops (Agent learns what worked best)

---

## 🎉 Zusammenfassung - JETZT LIVE!

Mit der **v3.0.0 Implementierung** ist Self-Learning jetzt:

✅ **Vollständig integriert** in REPL
✅ **Automatisch aktiv** wenn Tools + GUI enabled
✅ **Persistiert** in Long-term Memory (Qdrant)
✅ **Semantic search** findet ähnliche Tasks
✅ **Emergent behavior** - kein Training nötig!

**Das bedeutet:**
- Agent lernt **automatisch** aus Internet-Tutorials
- Agent **speichert** gelerntes Wissen
- Agent **wiederverwendet** Wissen bei ähnlichen Tasks
- **Null Konfiguration** - funktioniert out-of-the-box!

Siehe auch: **[FEATURE_STATUS.md](../../FEATURE_STATUS.md)** für vollständigen Implementierungs-Status.
