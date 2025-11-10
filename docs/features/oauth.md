# OAuth2 Login Anleitung

## 🔐 OAuth2 vs API Keys

### Mit OAuth2 einloggen kannst du bei:
- ✅ **Google** (Gmail, Drive, Gemini AI)
- ✅ **GitHub** (Repositories, Gists)
- ✅ **Microsoft** (Azure, Office 365)
- ✅ Jeden OAuth2-fähigen Dienst

### Mit API Key (nicht OAuth):
- ❌ **OpenAI** (nutzt nur API Keys)
- ❌ **Anthropic/Claude** (nutzt nur API Keys)
- ❌ **Ollama** (läuft lokal, kein Login)

---

## 🚀 Schnellstart: Google AI mit OAuth2

### 1. OAuth2 Credentials erstellen

1. Gehe zu: https://console.cloud.google.com/apis/credentials
2. Erstelle neues Projekt (z.B. "codechat-app")
3. **APIs & Services** → **Credentials**
4. **CREATE CREDENTIALS** → **OAuth client ID**
5. Falls gefragt, konfiguriere "OAuth consent screen":
   - User Type: **External**
   - App name: "CodeChat CLI"
   - Support email: deine Email
   - Scopes: Keine extra Scopes nötig
6. **Application type**: **Desktop app**
7. Name: "CodeChat Desktop"
8. **Authorized redirect URIs**: `http://localhost:8080/callback`
9. **CREATE** klicken
10. **Client ID** und **Client Secret** kopieren

### 2. Konfigurationsdatei anpassen

Öffne `my-google-ai.json` und trage ein:

```json
{
  "model": "gemini-pro",
  "auth": {
    "type": "oauth",
    "oauthConfig": {
      "authUrl": "https://accounts.google.com/o/oauth2/v2/auth",
      "tokenUrl": "https://oauth2.googleapis.com/token",
      "clientId": "123456789-abc.apps.googleusercontent.com",  ← HIER EINTRAGEN
      "clientSecret": "GOCSPX-abcdefghijk123456",  ← HIER EINTRAGEN
      "scopes": [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/generative-language"
      ],
      "callbackPort": 8080
    }
  },
  "endpoints": {
    "completion": {
      "method": "POST",
      "url": "/v1beta/models/gemini-pro:generateContent",
      "baseUrl": "https://generativelanguage.googleapis.com"
    }
  }
}
```

### 3. Workflow ausführen

```bash
npm start repl
```

Im REPL:
```
> orchestrate oauth-test-workflow.yml
```

**Was passiert:**
1. 🌐 Browser öffnet sich automatisch
2. 🔐 Du loggst dich bei Google ein
3. ✅ Du erlaubst Zugriff
4. 🎉 Token wird automatisch gespeichert
5. 🚀 Workflow läuft mit deinem Account

### 4. Token-Verwaltung

Im REPL:
```
> token list              # Zeigt alle gespeicherten Tokens
> token revoke gemini-pro # Löscht ein Token
> token clear             # Löscht alle Tokens
```

---

## 🔑 OpenAI mit API Key (Alternative)

### 1. API Key holen

1. Gehe zu: https://platform.openai.com/api-keys
2. **Create new secret key**
3. Kopiere den Key (nur einmal sichtbar!)

### 2. Workflow ausführen

```bash
npm start repl
> orchestrate openai-workflow.yml
```

Du wirst nach dem API Key gefragt (wird sicher gespeichert).

---

## 📊 OAuth2 Flow - Was passiert?

```
1. Du startest Workflow
   ↓
2. Browser öffnet → Google Login
   ↓
3. Du erlaubst Zugriff
   ↓
4. Google sendet Code → http://localhost:8080/callback
   ↓
5. App tauscht Code gegen Access Token
   ↓
6. Token wird verschlüsselt gespeichert (~/.codechat/tokens.json)
   ↓
7. Token wird automatisch erneuert (wenn refresh_token vorhanden)
   ↓
8. Bei nächstem Start: Kein Login nötig! ✅
```

---

## 🔒 Sicherheit

### Token Storage:
- Verschlüsselt mit **AES-256-GCM**
- Maschinenspezifischer Key
- Gespeichert in: `~/.codechat/tokens.json`

### Auto-Refresh:
- Token wird 5 Minuten vor Ablauf erneuert
- Vollautomatisch im Hintergrund
- Kein erneuter Login nötig

### PKCE (Proof Key for Code Exchange):
- Aktiviert standardmäßig
- Zusätzlicher Schutz gegen Code-Interception
- Industry Best Practice

---

## 🛠️ Weitere Provider konfigurieren

### GitHub OAuth

```json
{
  "model": "github-copilot",
  "auth": {
    "type": "oauth",
    "oauthConfig": {
      "authUrl": "https://github.com/login/oauth/authorize",
      "tokenUrl": "https://github.com/login/oauth/access_token",
      "clientId": "DEINE_GITHUB_CLIENT_ID",
      "clientSecret": "DEIN_GITHUB_SECRET",
      "scopes": ["repo", "user"],
      "callbackPort": 8080
    }
  },
  "endpoints": {
    "completion": {
      "method": "POST",
      "url": "/v1/completions",
      "baseUrl": "https://api.github.com"
    }
  }
}
```

**GitHub App erstellen:**
- https://github.com/settings/applications/new
- Authorization callback URL: `http://localhost:8080/callback`

### Microsoft OAuth

```json
{
  "model": "azure-openai",
  "auth": {
    "type": "oauth",
    "oauthConfig": {
      "authUrl": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      "tokenUrl": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      "clientId": "DEINE_AZURE_CLIENT_ID",
      "clientSecret": "DEIN_AZURE_SECRET",
      "scopes": ["https://cognitiveservices.azure.com/.default"],
      "callbackPort": 8080
    }
  }
}
```

---

## 🧪 Testen

### Test 1: Token speichern und laden
```bash
npm start repl
> orchestrate oauth-test-workflow.yml
# Beim ersten Mal: Browser Login
# Beim zweiten Mal: Nutzt gespeichertes Token!
```

### Test 2: Token-Verwaltung
```bash
> token list
📋 Saved OAuth Tokens:
  ✅ gemini-pro (expires in 55m) [auto-refresh]

> token revoke gemini-pro
✅ Token revoked and deleted: gemini-pro
```

### Test 3: Auto-Refresh
```bash
# Warte bis Token fast abgelaufen ist...
# App erneuert automatisch! 🔄
```

---

## ❌ Troubleshooting

### "No authorization code received"
→ Überprüfe redirect URI: `http://localhost:8080/callback`
→ Port 8080 muss frei sein

### "Token refresh failed"
→ Refresh Token fehlt (bei manchen Providern)
→ Einfach neu einloggen

### "OAuth error: access_denied"
→ Du hast Zugriff verweigert
→ Nochmal versuchen und erlauben

### Browser öffnet nicht
→ URL wird angezeigt, manuell kopieren
→ Oder Browser-Befehl in Pfad prüfen

---

## 📚 Dateien

- `my-google-ai.json` - Google OAuth Konfiguration
- `openai-apikey.json` - OpenAI API Key Konfiguration
- `oauth-test-workflow.yml` - Test-Workflow für OAuth
- `openai-workflow.yml` - Test-Workflow für OpenAI
- `~/.codechat/tokens.json` - Verschlüsselte Token-Speicherung

---

## 🎯 Zusammenfassung

**Ja, du kannst dich per OAuth einloggen!** ✅

- **Google, GitHub, Microsoft**: OAuth2 Login möglich
- **OpenAI**: Nur API Key (kein OAuth)
- **Tokens werden automatisch verwaltet**
- **Kein erneuter Login nach Neustart**
- **Sicher verschlüsselt gespeichert**

**Nächster Schritt:**
1. Google OAuth Credentials erstellen
2. In `my-google-ai.json` eintragen
3. `npm start repl` → `orchestrate oauth-test-workflow.yml`
4. Browser öffnet sich → Einloggen → Fertig! 🚀
