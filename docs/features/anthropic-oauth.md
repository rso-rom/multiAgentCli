# Anthropic Claude mit OAuth2 Login

## 🔐 Zwei Authentifizierungs-Methoden

cacli unterstützt **zwei Wege**, um Claude (Anthropic) zu nutzen:

### 1. OAuth2-Login (wie Claude Code CLI) ✨

**Vorteile:**
- ✅ Browser-basierter Login
- ✅ Kein API Key notwendig
- ✅ Token wird automatisch gespeichert und erneuert
- ✅ Genau wie `claude auth login` in Claude Code

**So funktioniert's:**

```bash
# Einmaliger Login
cacli login claude

# → Browser öffnet sich automatisch
# → Login bei Anthropic
# → Token wird gespeichert in ~/.codechat/tokens.json

# Danach einfach nutzen:
cacli -b claude
# oder
cacli -b anthropic
```

### 2. API Key (Traditionell)

**Vorteile:**
- ✅ Keine Browser-Interaktion nötig
- ✅ Gut für CI/CD und Server
- ✅ Direkte Kontrolle über API-Zugriff

**So funktioniert's:**

```bash
# .env-Datei erstellen/bearbeiten
echo "MODEL_BACKEND=claude" >> .env
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env

# Starten
cacli
```

---

## 🚀 OAuth2-Login im Detail

### Erstmaliger Login

```bash
cacli login claude
```

**Was passiert:**

1. 🌐 Browser öffnet sich: `https://console.anthropic.com/oauth/authorize`
2. 🔐 Du loggst dich bei Anthropic ein
3. ✅ Du erlaubst Zugriff für cacli
4. 🎉 Token wird verschlüsselt gespeichert in `~/.codechat/tokens.json`
5. 🚀 Zukünftig: Kein erneuter Login nötig!

### Token-Verwaltung

```bash
# Alle gespeicherten Tokens anzeigen
cacli token list

# Beispiel-Ausgabe:
# 📋 Saved OAuth Tokens:
#   ✅ anthropic (expires in 23h 45m) [auto-refresh]

# Token löschen (Logout)
cacli logout claude

# Oder explizit:
cacli token revoke anthropic

# Alle Tokens löschen
cacli token clear
```

### Automatische Token-Erneuerung

- ✅ Token wird automatisch erneuert, wenn abgelaufen
- ✅ Kein erneuter Login nötig
- ✅ Refresh-Token wird sicher gespeichert

---

## 🔧 Konfiguration

### OAuth aktivieren (in .env)

```env
MODEL_BACKEND=claude
ANTHROPIC_USE_OAUTH=true
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

**Dann:**

```bash
cacli login claude  # Einmalig
cacli                # Nutzt OAuth-Token
```

### API Key nutzen (in .env)

```env
MODEL_BACKEND=claude
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_USE_OAUTH=false
```

**Dann:**

```bash
cacli  # Nutzt API Key
```

---

## 🤖 Multi-Agent mit verschiedenen Backends

**Ja!** Du kannst verschiedene Backends pro Agent nutzen:

```yaml
# workflow.yml
agents:
  - name: researcher
    backend: claude    # Nutzt OAuth oder API Key
    model: claude-3-5-sonnet-20241022

  - name: coder
    backend: openai    # Nutzt OpenAI API Key
    model: gpt-4o

  - name: reviewer
    backend: ollama    # Nutzt lokales Ollama
    model: llama3
```

**Jeder Agent kann ein anderes Backend/Modell nutzen!** 🎉

---

## 🔒 Sicherheit

### Token-Speicherung

- **Verschlüsselung:** AES-256-GCM
- **Speicherort:** `~/.codechat/tokens.json`
- **Key-Ableitung:** Maschinenspezifisch (Hostname + Username + Random Salt)
- **Permissions:** 0o600 (nur Owner kann lesen/schreiben)

### PKCE (Proof Key for Code Exchange)

- ✅ Schutz gegen Authorization Code Interception
- ✅ SHA-256 Code Challenge
- ✅ Industry Best Practice für CLI-Apps

### OAuth-Konfiguration

cacli nutzt die **gleichen OAuth-Endpoints wie Claude Code CLI:**

```typescript
{
  clientId: '9d1c250a-e61b-44d9-88ed-5944d1962f5e',
  authUrl: 'https://console.anthropic.com/oauth/authorize',
  tokenUrl: 'https://console.anthropic.com/oauth/token',
  scopes: ['org:create_api_key', 'user:profile', 'user:inference']
}
```

---

## 📊 Vergleich: OAuth vs API Key

| Feature | OAuth2 | API Key |
|---------|--------|---------|
| **Browser-Login** | ✅ Ja | ❌ Nein |
| **Automatische Erneuerung** | ✅ Ja | ❌ Nein (manuell) |
| **Server/CI geeignet** | ⚠️ Bedingt | ✅ Ja |
| **Headless-Umgebung** | ⚠️ `--no-browser` nötig | ✅ Ja |
| **Token-Management** | ✅ Integriert | ❌ Manuell |
| **Setup-Aufwand** | 🟢 Einfach (1x Login) | 🟢 Einfach (Key kopieren) |

---

## 🧪 Testen

### Test 1: OAuth-Login

```bash
# Erste Login
cacli login claude
# → Browser öffnet sich

# Test: Token nutzen
cacli -b claude
> Hello from Claude!
```

### Test 2: Token-Persistenz

```bash
# Nach Neustart:
cacli -b claude
# → Kein Login nötig! Nutzt gespeichertes Token
```

### Test 3: Multi-Backend

```bash
# OpenAI nutzen
cacli ask -b openai "Hello from GPT"

# Claude nutzen (OAuth)
cacli ask -b claude "Hello from Claude"

# Ollama nutzen
cacli ask -b ollama "Hello from Llama"
```

---

## ❌ Troubleshooting

### "No authorization code received"

**Problem:** Browser-Redirect hat nicht funktioniert

**Lösung:**
1. Überprüfe, ob Port 8080 frei ist
2. Firewall-Einstellungen prüfen
3. Manuell URL kopieren und in Browser öffnen

### "Token refresh failed"

**Problem:** Refresh-Token abgelaufen oder ungültig

**Lösung:**

```bash
cacli logout claude
cacli login claude
```

### "API key required"

**Problem:** OAuth nicht aktiviert UND kein API Key gesetzt

**Lösung:**

```bash
# Option 1: OAuth nutzen
cacli login claude

# Option 2: API Key setzen
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
```

### Browser öffnet nicht

**Problem:** Kein Standard-Browser gefunden

**Lösung:**
- URL wird in Terminal angezeigt
- Manuell kopieren und in Browser öffnen
- Oder: `xdg-open` (Linux), `open` (macOS), `start` (Windows) installieren

---

## 🎯 Zusammenfassung

✅ **OAuth2-Login wie Claude Code CLI**
✅ **Browser-basierter Flow mit PKCE**
✅ **Automatische Token-Verwaltung**
✅ **API Key als Alternative**
✅ **Multi-Agent mit verschiedenen Backends**
✅ **Sichere verschlüsselte Token-Speicherung**

**Nächste Schritte:**

```bash
# 1. Login mit OAuth
cacli login claude

# 2. Nutzen
cacli -b claude

# 3. Token verwalten
cacli token list
```

🚀 **Viel Erfolg!**
