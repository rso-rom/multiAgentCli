# Backend Setup Guide

> **Wähle dein KI-Backend: LM Studio oder Ollama Docker**

## 🎯 Welches Backend ist richtig für mich?

### Nutze **LM Studio** wenn du:
- ✅ Eine **grafische Oberfläche** bevorzugst
- ✅ Auf **Windows** arbeitest
- ✅ **Desktop-Entwicklung** machst
- ✅ Modelle **visuell verwalten** möchtest
- ✅ **Einfache Installation** willst

👉 **[Zur LM Studio Anleitung](lm-studio.md)**

### Nutze **Ollama Docker** wenn du:
- ✅ **Docker** bereits nutzt
- ✅ **Server/Headless** Setup brauchst
- ✅ **CI/CD Integration** planst
- ✅ **Automatisierung** bevorzugst
- ✅ **CLI-basiert** arbeiten willst

👉 **[Zur Ollama Docker Anleitung](ollama-docker.md)**

---

## 📊 Detaillierter Vergleich

| Kriterium | LM Studio | Ollama Docker | Gewinner |
|-----------|-----------|---------------|----------|
| **Einfachheit** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 🏆 LM Studio |
| **GUI** | ✅ Ja | ❌ Nein | 🏆 LM Studio |
| **Windows-Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 🏆 LM Studio |
| **Modell-Management** | ⭐⭐⭐⭐⭐ Visuell | ⭐⭐⭐⭐ CLI | 🏆 LM Studio |
| **Automatisierung** | ⭐⭐ | ⭐⭐⭐⭐⭐ | 🏆 Ollama |
| **Server-Nutzung** | ⭐⭐ | ⭐⭐⭐⭐⭐ | 🏆 Ollama |
| **CI/CD Integration** | ❌ | ✅ | 🏆 Ollama |
| **Resource Overhead** | Niedrig | Mittel (Docker) | 🏆 LM Studio |
| **Updates** | Automatisch (GUI) | `docker pull` | ⚖️ Unentschieden |

---

## 🚀 Schnellstart-Links

### LM Studio
```bash
# 1. Download & Install: https://lmstudio.ai/
# 2. Modell laden (GUI)
# 3. Server starten (GUI Button)
# 4. App konfigurieren:
OLLAMA_URL=http://localhost:1234/v1

# Fertig!
```
📖 **[Vollständige LM Studio Anleitung](lm-studio.md)**

### Ollama Docker
```bash
# 1. Docker Compose starten
docker-compose up -d ollama

# 2. Modell laden
docker exec -it codechat-ollama ollama pull mistral:7b

# 3. App konfigurieren:
OLLAMA_URL=http://localhost:11434

# Fertig!
```
📖 **[Vollständige Ollama Docker Anleitung](ollama-docker.md)**

---

## 💡 Empfehlungen

### Für Anfänger
👉 **LM Studio**
- Einfachste Installation
- Visuelle Modell-Verwaltung
- Kein Docker nötig

### Für Entwickler
👉 **LM Studio** (Desktop) oder **Ollama Docker** (Server)
- LM Studio: Wenn du lokal entwickelst
- Ollama: Wenn du Remote/Server nutzt

### Für DevOps/CI/CD
👉 **Ollama Docker**
- Komplett automatisierbar
- Container-basiert
- Einfach in Pipelines integrierbar

---

## 📚 Vollständige Dokumentation

| Anleitung | Inhalt | Link |
|-----------|--------|------|
| **LM Studio Setup** | Installation, Konfiguration, Modelle, Troubleshooting | [→ Anleitung](lm-studio.md) |
| **Ollama Docker Setup** | Docker Compose, Modelle, CLI, Automatisierung | [→ Anleitung](ollama-docker.md) |
| **Memory Testing** | Qdrant, 4-Ebenen-Memory, Semantic Search | [→ Anleitung](../features/memory-system.md) |
| **Quick Start** | 3-Minuten Einstieg | [→ Anleitung](../../QUICK-START.md) |

---

## 🔄 Kann ich später wechseln?

**Ja!** Beide Backends nutzen die gleiche API. Du kannst jederzeit wechseln:

### Von LM Studio zu Ollama Docker:
```env
# In .env ändern:
OLLAMA_URL=http://localhost:11434  # statt 1234/v1
```

### Von Ollama Docker zu LM Studio:
```env
# In .env ändern:
OLLAMA_URL=http://localhost:1234/v1  # /v1 hinzufügen!
```

Kein Code-Änderung nötig! Nur .env anpassen und `npm run build`.

---

## ⚙️ Beide gleichzeitig nutzen?

**Ja!** Du kannst beide parallel laufen lassen:

**LM Studio**: Port 1234
**Ollama Docker**: Port 11434

Wechsle per Workflow:
```yaml
agents:
  fast-agent:
    backend: ollama
    model: llama3.2:3b  # Ollama Docker

  quality-agent:
    backend: ollama
    model: gpt-4  # LM Studio (via OpenAI API)
```

Oder in .env für verschiedene Projekte.

---

## 🆘 Hilfe & Support

- **LM Studio Probleme**: [LM Studio Discord](https://discord.gg/lmstudio)
- **Ollama Probleme**: [Ollama GitHub](https://github.com/ollama/ollama/issues)
- **App Probleme**: Siehe [README.md](../README.md)

---

## ✅ Zusammenfassung

| Wähle | Wenn du |
|-------|---------|
| **LM Studio** | GUI magst, Windows nutzt, Desktop-Entwicklung |
| **Ollama Docker** | CLI bevorzugst, Server/Automation brauchst |
| **Beide** | Verschiedene Setups für verschiedene Projekte |

**Los geht's!** Wähle eine Anleitung oben und starte in 5 Minuten! 🚀
