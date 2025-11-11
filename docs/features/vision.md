# 📸 Vision / Screenshot Analysis

cacli unterstützt die Analyse von Screenshots und Bildern mit Vision-Models wie GPT-4o.

## Features

- ✅ Screenshot-Upload direkt in der CLI
- ✅ Automatische Bildvalidierung
- ✅ Unterstützung für alle gängigen Formate
- ✅ Vision-Model Integration (GPT-4o)
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

### Voraussetzungen

1. **OpenAI API Key** erforderlich
2. **GPT-4o Model** Zugriff

### Configuration

**Option 1: Environment Variable**
```bash
export OPENAI_API_KEY=your-key-here
```

**Option 2: .env File**
```bash
# .env
OPENAI_API_KEY=your-key-here
```

### API Key erhalten

1. Gehe zu [OpenAI Platform](https://platform.openai.com/)
2. Erstelle einen API Key
3. Stelle sicher, dass GPT-4 Vision aktiviert ist

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

### Vision Backend

Aktuell unterstützt:
- ✅ **GPT-4o** (OpenAI) - Empfohlen
- 🔜 **Claude 3** (Anthropic) - Coming soon
- 🔜 **Gemini Pro Vision** (Google) - Coming soon

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

// Validieren
const validation = await imageHandler.validateImage('./screenshot.png');

// Für verschiedene APIs formatieren
const openaiFormat = imageHandler.formatForOpenAI(image);
const claudeFormat = imageHandler.formatForClaude(image);
```

### VisionOpenAI

```typescript
import { VisionOpenAI } from './backends/vision-openai';

const vision = new VisionOpenAI();

// Screenshot analysieren
const analysis = await vision.analyzeScreenshot(
  './error.png',
  'What is the error?'
);

// Text extrahieren (OCR)
const text = await vision.extractText('./document.png');

// Mehrere Bilder vergleichen
const comparison = await vision.compareScreenshots(
  ['before.png', 'after.png'],
  'What changed?'
);
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

- [ ] Claude 3 Opus/Sonnet Support
- [ ] Gemini Pro Vision Support
- [ ] Multi-Image Vergleiche
- [ ] Batch-Processing
- [ ] Lokale Vision Models (CLIP, LLaVA)
- [ ] Video-Frame Analyse

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
