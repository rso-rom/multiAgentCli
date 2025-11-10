# Testing Guide: Webshop mit arc42 Dokumentation

## Voraussetzungen

Um deine Anwendung mit einem echten KI-Backend zu testen, benötigst du eines der folgenden:

### Option 1: Ollama (Empfohlen für lokale Tests)
```bash
# Installiere Ollama von: https://ollama.ai
# Starte Ollama und lade ein Modell:
ollama pull llama3
# oder
ollama pull mistral
```

Dann in `.env`:
```
MODEL_BACKEND=ollama
OLLAMA_MODEL=llama3
```

### Option 2: OpenAI API
In `.env`:
```
MODEL_BACKEND=openai
OPENAI_API_KEY=dein-api-key
OPENAI_MODEL=gpt-4o-mini
```

**Hinweis:** Du musst noch das OpenAI Backend implementieren in `src/backends/openai.ts`

### Option 3: Mock (Aktuell aktiv)
```
MODEL_BACKEND=mock
```
Gibt nur Dummy-Antworten zurück.

---

## Test-Szenarien

### 1. Einfacher Ask-Test
```bash
npm start ask "Erstelle ein einfaches Hello World in Python"
```

### 2. REPL-Session
```bash
npm start repl
```

Im REPL:
```
> help
> ask Erkläre mir REST APIs
> web on
> ask Was sind die neuesten Web-Frameworks?
> exit
```

### 3. Komplexer Multi-Agent Workflow
```bash
npm start repl
```

Im REPL:
```
> orchestrate webshop-arc42-workflow.yml
```

Dies startet den Multi-Agent Workflow, der:
1. **Architect**: Entwirft die Systemarchitektur
2. **Backend Developer**: Erstellt Backend-Code
3. **Frontend Developer**: Erstellt Frontend-Code
4. **Database Designer**: Entwirft das Datenbankschema
5. **arc42 Documenter**: Erstellt die vollständige arc42 Dokumentation

Ausgaben werden in separaten Dateien gespeichert.

---

## Workflow anpassen

Die Datei `webshop-arc42-workflow.yml` kannst du anpassen:

```yaml
name: dein-projekt
description: Deine Beschreibung

agents:
  - name: agent1
    prompt: |
      Deine Anweisungen hier.
      Du kannst andere Agents referenzieren: {{agent-name}}

outputs:
  - agent: agent1
    file: output.md
```

---

## Erweiterte Funktionen

### Web-Suche aktivieren
```bash
npm start repl
```
```
> web on
> ask Was sind aktuelle Best Practices für E-Commerce Security?
```

### Direkte Web-Suche
```
> webs "React 19 neue Features"
```

### Token-Management (OAuth2)
```
> token list
> token revoke google
> token clear
```

### Prompt-Historie (benötigt Qdrant)
```
> history
> history "webshop"
```

---

## Troubleshooting

### REPL startet nicht
- Stelle sicher, dass `npm run build` ohne Fehler durchläuft
- Überprüfe, dass das Backend erreichbar ist

### Mock-Antworten statt echte KI
- Überprüfe `.env` Datei: `MODEL_BACKEND=ollama` (oder anderes Backend)
- Stelle sicher, dass Ollama läuft (falls verwendet)

### Workflow funktioniert nicht
- Überprüfe YAML-Syntax
- Stelle sicher, dass Agent-Namen konsistent sind
- Teste zuerst mit einfacherem Workflow

---

## Beispiel-Output

Mit echtem Backend würde der Workflow generieren:

1. **webshop-arc42-documentation.md**: Vollständige arc42 Dokumentation
2. **backend-implementation.ts**: Node.js/Express Backend
3. **frontend-implementation.tsx**: React Frontend
4. **database-schema.sql**: PostgreSQL Schema

---

## Nächste Schritte

1. Installiere Ollama oder konfiguriere OpenAI
2. Aktualisiere `.env`
3. Baue das Projekt: `npm run build`
4. Starte den Workflow: `npm start repl` → `orchestrate webshop-arc42-workflow.yml`
