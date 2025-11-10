# Publishing Guide - codechat-ts

## 📦 Vorbereitung für npm publish

### 1. Voraussetzungen

- ✅ npm Account erstellt (https://www.npmjs.com/signup)
- ✅ npm login durchgeführt: `npm login`
- ✅ Git Repository erstellt
- ✅ Code committed

### 2. Package-Name prüfen

Prüfe ob Name verfügbar ist:
```bash
npm search codechat-ts
```

Falls belegt, ändere in `package.json`:
```json
"name": "codechat-cli" // oder anderer Name
```

### 3. Vor dem Publish

**Wichtig! In package.json anpassen:**
```json
"author": "Dein Name <deine@email.com>",
"repository": {
  "type": "git",
  "url": "https://github.com/deinusername/codechat-ts.git"
}
```

### 4. Build testen

```bash
# Dependencies installieren
npm install

# Build
npm run build

# Testen ob alles kompiliert
ls dist/

# Lokal testen
npm link
codechat --help
```

### 5. Version bump

Semantische Versionierung:

```bash
# Patch (3.0.0 → 3.0.1) - Bugfixes
npm version patch

# Minor (3.0.0 → 3.1.0) - Neue Features
npm version minor

# Major (3.0.0 → 4.0.0) - Breaking Changes
npm version major
```

### 6. Publish

**Dry-Run (empfohlen zuerst):**
```bash
npm publish --dry-run
```

Zeigt was veröffentlicht werden würde.

**Tatsächlich publishen:**
```bash
# Öffentlich (kostenlos)
npm publish --access public

# Oder für scoped packages
npm publish
```

### 7. Nach dem Publish

**Installieren testen:**
```bash
npm install -g codechat-ts

# Oder mit anderem Namen
npm install -g deinpackagename

# Test
codechat --help
codechat repl
```

**Deinstallieren:**
```bash
npm uninstall -g codechat-ts
```

---

## 🔄 Updates veröffentlichen

```bash
# 1. Änderungen machen
git add .
git commit -m "feat: neue features"

# 2. Build
npm run build

# 3. Version bump
npm version minor  # oder patch/major

# 4. Git push (optional)
git push
git push --tags

# 5. Publish
npm publish
```

---

## 📊 Package-Statistiken

Nach dem Publish:
- **npm Registry**: https://www.npmjs.com/package/codechat-ts
- **Download Stats**: https://npm-stat.com/charts.html?package=codechat-ts

---

## ⚠️ Troubleshooting

### "403 Forbidden"
```bash
npm login
npm whoami  # Prüfe ob eingeloggt
```

### "Package name taken"
Ändere `name` in package.json oder wähle scoped package:
```json
"name": "@deinusername/codechat-ts"
```

### "No access"
```bash
npm publish --access public
```

---

## 🔐 .npmrc (optional)

Für private Registry oder Auth:
```bash
# ~/.npmrc
//registry.npmjs.org/:_authToken=DEIN_TOKEN
```

---

## ✅ Checkliste vor Publish

- [ ] `package.json` komplett ausgefüllt (author, repo, etc.)
- [ ] `README.md` informativ
- [ ] `LICENSE` vorhanden
- [ ] `.npmignore` erstellt
- [ ] `npm run build` funktioniert
- [ ] Lokal mit `npm link` getestet
- [ ] Version gebumpt (`npm version`)
- [ ] Git committed
- [ ] `npm publish --dry-run` gecheckt

---

## 🚀 Quick Publish

```bash
# All-in-One
npm run build && \
npm version patch && \
npm publish --access public
```
