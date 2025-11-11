# 📸 Vision / Screenshot Analysis

cacli unterstützt die Analyse von Screenshots und Bildern mit Vision-Models. Die Bildanalyse funktioniert mit jedem Backend, das Vision unterstützt - der aktuell konfigurierte Agent analysiert die Bilder.

## Features

- ✅ Screenshot-Upload direkt in der CLI
- ✅ **Clipboard Support** - Copy & Paste von Screenshots
- ✅ **Drag & Drop** - Dateien ins Terminal ziehen
- ✅ **Backend-Unabhängig** - Funktioniert mit jedem Vision-fähigen Backend
- ✅ Automatische Bildvalidierung
- ✅ Unterstützung für alle gängigen Formate
- ✅ Vision-Model Integration (GPT-4o, LLaVA, etc.)
- ✅ Speicherung in Ask-History

## Unterstützte Formate

- `.png` - PNG Images
- `.jpg`, `.jpeg` - JPEG Images
- `.gif` - GIF Images
- `.webp` - WebP Images
- `.bmp` - Bitmap Images

**Max. Dateigröße:** 20MB

## Verwendung

### Basic Usage

```bash
# Einfache Screenshot-Analyse
> /screenshot error-screenshot.png

# Mit spezifischer Frage
> /screenshot design.png "What UI improvements would you suggest?"

# Kurz-Aliase
> /ss bug.jpg
> /img ~/Desktop/screenshot.png
```

### 📋 Clipboard Support (Copy & Paste)

**NEU**: Screenshots direkt aus der Zwischenablage analysieren!

```bash
# Screenshot mit Cmd+C / Ctrl+C kopieren, dann:
> /paste

# Mit spezifischer Frage
> /paste "What's wrong in this UI?"

# Kurz-Aliase
> /clip "Explain this error"
> /clipboard
```

**So funktioniert's:**
1. Screenshot machen (Cmd+Shift+4 auf macOS, Win+Shift+S auf Windows)
2. Bild kopieren (Cmd+C / Ctrl+C)
3. In cacli `/paste` eingeben
4. Fertig! 🎉

**Plattform-Voraussetzungen:**
- **macOS**: `pngpaste` installieren → `brew install pngpaste`
- **Linux**: `xclip` installieren → `sudo apt-get install xclip`
- **Windows**: PowerShell (bereits vorinstalliert)

### 🎯 Drag & Drop Support

**Noch einfacher**: Bild-Datei einfach ins Terminal ziehen!

```bash
# Datei ins Terminal ziehen (Pfad wird automatisch eingefügt)
> /screenshot /Users/name/Desktop/screenshot.png

# Oder mit Frage
> /ss [Datei ziehen] "What's this?"
```

### Beispiele

#### 1. **Bug-Analyse**
```bash
> /screenshot error.png "What's causing this error?"
```

#### 2. **UI/UX Review**
```bash
> /ss dashboard.png "Analyze this dashboard design. What could be improved?"
```

#### 3. **Code-Screenshot analysieren**
```bash
> /img code-snippet.png "Explain this code and find potential bugs"
```

#### 4. **Dokument-Extraktion (OCR)**
```bash
> /screenshot document.jpg "Extract all text from this image"
```

## Setup

### Backend-Wahl

Die Bildanalyse nutzt immer das **aktuell konfigurierte Backend**. Wähle ein Backend das Vision unterstützt:

#### **Option 1: OpenAI (gpt-4o)**

```bash
# API Key setzen
export OPENAI_API_KEY=your-key-here

# cacli mit OpenAI Backend starten
cacli -b openai
```

**Voraussetzungen:**
- OpenAI API Key ([Platform](https://platform.openai.com/))
- GPT-4o Model Zugriff

**Vorteile:**
- ✅ Beste Vision-Qualität
- ✅ Schnell
- ✅ Streaming-Support
- ❌ Kostenpflichtig (~$0.01-0.02 pro Bild)

#### **Option 2: Ollama (LLaVA / Bakllava)**

```bash
# Vision-Model pullen
ollama pull llava

# cacli mit Ollama + Vision Model starten
OLLAMA_MODEL=llava cacli -b ollama
```

**Voraussetzungen:**
- Ollama installiert ([ollama.ai](https://ollama.ai))
- Vision-Model (llava, bakllava, llava:13b, etc.)

**Vorteile:**
- ✅ Komplett lokal (keine API Keys)
- ✅ Kostenlos
- ✅ Privacy
- ❌ Langsamer
- ❌ Etwas schlechtere Qualität

#### **Backend-Status prüfen**

```bash
# Vision-Support des aktuellen Backends prüfen
> /screenshot
Usage: /screenshot <image-path> [question]
...
Current backend: openai
Vision support: ✅ Yes
```

## Features im Detail

### Automatische Validierung

Das System validiert automatisch:
- ✅ Datei existiert
- ✅ Format wird unterstützt
- ✅ Dateigröße unter 20MB
- ✅ Lesbare Datei

```
📸 Loading image: error.png
✅ Validation passed (245KB)
🔍 Analyzing with GPT-4 Vision...
```

### Ask-History Integration

Screenshots werden automatisch in der Ask-History gespeichert:

```bash
> /history
1. [2025-01-11 15:30] screenshot (95% match)
   "What's wrong in this UI? [Image: error.png]"
```

### Unterstützte Vision-Backends

| Backend | Model | Qualität | Geschwindigkeit | Kosten | Status |
|---------|-------|----------|-----------------|--------|--------|
| **OpenAI** | gpt-4o | ⭐⭐⭐⭐⭐ | Schnell | ~$0.01-0.02/Bild | ✅ Verfügbar |
| **Ollama** | llava | ⭐⭐⭐ | Langsam | Kostenlos | ✅ Verfügbar |
| **Ollama** | llava:13b | ⭐⭐⭐⭐ | Sehr langsam | Kostenlos | ✅ Verfügbar |
| **Ollama** | bakllava | ⭐⭐⭐ | Langsam | Kostenlos | ✅ Verfügbar |
| **Claude 3** | opus/sonnet | ⭐⭐⭐⭐⭐ | Schnell | ~$0.02-0.03/Bild | 🔜 Coming soon |
| **Gemini** | pro-vision | ⭐⭐⭐⭐ | Schnell | ~$0.01/Bild | 🔜 Coming soon |

## Workflow Integration

Screenshots können auch in Workflows verwendet werden:

```yaml
# workflow-example.yml
agents:
  - name: ui-reviewer
    model: gpt-4o
    prompt: |
      Analyze the attached screenshot and provide:
      1. UI/UX improvements
      2. Accessibility issues
      3. Design inconsistencies

      Image: {{IMAGE_PATH}}
```

## Fehlerbehandlung

### Häufige Fehler

**1. API Key fehlt**
```
❌ OpenAI API key required for vision models.

Please set OPENAI_API_KEY environment variable:
  export OPENAI_API_KEY=your-key-here
```

**2. Ungültiges Format**
```
❌ Unsupported format: .pdf. Supported: .png, .jpg, .jpeg, .gif, .webp, .bmp
```

**3. Datei zu groß**
```
❌ Image too large: 25.3MB (max: 20MB)
```

**4. Datei nicht gefunden**
```
❌ File not found or not accessible
```

**5. Clipboard: Keine Bilddaten**
```
❌ No image in clipboard. Copy an image first (Cmd+C / Ctrl+C on an image).
```

**6. Clipboard: Tool fehlt**
```
❌ Install pngpaste: brew install pngpaste  # macOS
❌ Install xclip: sudo apt-get install xclip  # Linux
```

## Performance

- **Upload**: Lokal, kein Upload-Server benötigt
- **Verarbeitung**: ~2-5 Sekunden (je nach Bildgröße)
- **Caching**: Base64-Encoding im Memory

## Best Practices

### 1. **Optimale Bildgröße**
```bash
# Gut: 100KB - 2MB
convert large-screenshot.png -resize 50% optimized.png
```

### 2. **Klare Fragen stellen**
```bash
# ❌ Zu vage
> /ss image.png

# ✅ Spezifisch
> /ss image.png "What error is shown and how to fix it?"
```

### 3. **Mehrere Screenshots vergleichen**
```bash
# Coming soon: Multi-image support
> /ss before.png after.png "What changed between these versions?"
```

## API Referenz

### ImageHandler

```typescript
import { imageHandler } from './utils/image-handler';

// Bild laden
const image = await imageHandler.loadImage('./screenshot.png');

// **NEU**: Bild aus Clipboard laden
const { image } = await imageHandler.loadImageFromClipboard('What do you see?');

// Validieren
const validation = await imageHandler.validateImage('./screenshot.png');

// Für verschiedene APIs formatieren
const openaiFormat = imageHandler.formatForOpenAI(image);
const claudeFormat = imageHandler.formatForClaude(image);
```

### Backend Vision API

**Verwende das aktuelle Backend direkt (empfohlen):**

```typescript
// In der REPL ist this.backend bereits verfügbar
// Prüfe Vision-Support
if (this.backend.supportsVision()) {
  const { imageHandler } = await import('./utils/image-handler');
  const image = await imageHandler.loadImage('./error.png');

  await this.backend.analyzeImage(
    'What is the error?',
    [image],
    (chunk) => process.stdout.write(chunk)
  );
}
```

**Oder spezifisches Backend verwenden:**

```typescript
import { OpenAIBackend } from './backends/vision-openai';
import { OllamaBackend } from './backends/ollama';
import { imageHandler } from './utils/image-handler';

// OpenAI GPT-4o
const openai = new OpenAIBackend(process.env.OPENAI_API_KEY, 'gpt-4o');
const image = await imageHandler.loadImage('./error.png');
const analysis = await openai.analyzeImage('What is the error?', [image]);

// Ollama LLaVA
const ollama = new OllamaBackend('http://localhost:11434', 'llava');
const analysis2 = await ollama.analyzeImage('Describe this image', [image]);
```

## Kosten

GPT-4o Vision Pricing (Stand: Januar 2025):
- **Input**: $5.00 / 1M tokens
- **Output**: $15.00 / 1M tokens
- **Bilder**: ~85 tokens per tile (512x512)

**Beispiel-Kosten:**
- Screenshot (1920x1080): ~$0.02 pro Analyse
- Icon (256x256): ~$0.001 pro Analyse

## Roadmap

- [x] Ollama LLaVA Support (lokal, kostenlos)
- [x] Backend-unabhängige Vision-API
- [ ] Claude 3 Opus/Sonnet Support
- [ ] Gemini Pro Vision Support
- [ ] Multi-Image Vergleiche
- [ ] Batch-Processing
- [ ] Weitere lokale Vision Models (CLIP, moondream)
- [ ] Video-Frame Analyse
- [ ] OCR-optimierte Models

## Troubleshooting

### Debug-Mode aktivieren

```bash
LOG_LEVEL=debug cacli
```

### Logs prüfen

```bash
> /screenshot test.png
📸 Loading image: test.png
[INFO] Loaded image: test.png (245KB)
🔍 Analyzing with GPT-4 Vision...
[DEBUG] API Request: POST https://api.openai.com/v1/chat/completions
[DEBUG] Model: gpt-4o
[DEBUG] Response: 200 OK
```

## Weitere Infos

- [OpenAI Vision Guide](https://platform.openai.com/docs/guides/vision)
- [GPT-4o Model Card](https://openai.com/research/gpt-4)
- [cacli GitHub Issues](https://github.com/rso-rom/multiAgentCli/issues)
