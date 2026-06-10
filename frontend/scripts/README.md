# 📂 Scripts — Frontend Automation

> Collection of automation scripts to maintain CSS, JS, and build quality.

---

## 📋 Available Scripts

### 1. `analyze-css-usage.js`

**What it does:** Analyzes unused CSS using PurgeCSS (dry-run, no modifications).

**Usage:**
```bash
npm run analyze:css
# or manually
node scripts/analyze-css-usage.js
```

**Output:**
- `purgecss-report.css` — clean CSS (for review)
- `assets/css/app.css.backup` — safety backup
- Console stats (bytes, lines, % removable)

**Requires:** PurgeCSS installed (`npm install --save-dev purgecss`)

**Time:** ~1 minute

---

### 2. `css-cleanup-checklist.sh`

**What it does:** Interactive 5-phase workflow to safely remove unused CSS.

**Phases:**
1. Setup dependencies
2. Run PurgeCSS analysis
3. Manual DevTools Coverage validation
4. Compare results
5. Apply, test, commit

**Usage:**
```bash
bash scripts/css-cleanup-checklist.sh
```

**Features:**
- ✅ Step-by-step guidance
- ✅ Interactive prompts (yes/no questions)
- ✅ Auto-opens browser for testing
- ✅ Git integration (create branch, commit)
- ✅ Rollback on error

**Time:** ~40 minutes (interactive)

**Requirements:**
- Docker running
- Backend stack available
- npm dependencies installed

---

## 🚀 Quick Start

```bash
# Option 1: Fast analysis only
npm run analyze:css

# Option 2: Full interactive workflow (recommended)
bash scripts/css-cleanup-checklist.sh
```

---

## 📁 Script Directory Structure

```
frontend/
├── scripts/
│   ├── analyze-css-usage.js       ← Node.js script (PurgeCSS)
│   ├── css-cleanup-checklist.sh   ← Bash script (interactive)
│   └── README.md                  ← This file
│
├── purgecss.config.js             ← Config (which files to scan)
├── CSS_CLEANUP.md                 ← Quick reference
└── package.json                   ← Scripts defined here
```

---

## 🔧 Configuration

Scripts use `../purgecss.config.js` which scans:

```javascript
content: [
  './pages/**/*.html',              // All HTML pages
  './assets/js/page-behaviors.js',  // Main JS templates
  './assets/js/shell.js',           // Shell component
  './assets/js/ui.js',              // UI utilities
  './assets/js/**/*.js',            // Any other JS
]
```

To modify what gets scanned, edit `purgecss.config.js`.

---

## 📊 What Gets Generated

After running scripts:

```
frontend/
├── purgecss-report.css            ← Clean CSS (output of dry-run)
├── assets/css/
│   ├── app.css                    ← Original (unchanged)
│   ├── app.css.backup             ← Backup for rollback
│   └── theme.css                  ← Tokens (not touched)
└── purgecss-analysis.txt          ← Log (if created)
```

---

## ⚠️ Safety First

**Before running cleanup:**
- [ ] Backup exists (`app.css.backup`)
- [ ] PurgeCSS and DevTools agree on results
- [ ] All 8 screens tested in DevTools Coverage
- [ ] Bootstrap safelist preserved

**If something breaks:**
```bash
cp assets/css/app.css.backup assets/css/app.css
docker compose up -d --build
```

---

## 🎯 Typical Workflow

```
1. npm run analyze:css
   → Review purgecss-report.css

2. Open browser http://localhost:4173
   → DevTools Coverage: F12 → Coverage → ⏺️ Record
   → Test all screens

3. Compare both results
   → They should match

4. If OK:
   cp purgecss-report.css assets/css/app.css
   docker compose up -d --build

5. Test again
   → All screens OK?

6. Commit
   git add assets/css/app.css
   git commit -m "Remove unused CSS"
```

---

## 📚 Related Documentation

- **Full guide:** [`CSS_PURGE_GUIDE.md`](../CSS_PURGE_GUIDE.md)
- **Quick reference:** [`CSS_CLEANUP.md`](./CSS_CLEANUP.md)
- **FAQ & Troubleshooting:** [`CSS_CLEANUP_FAQ.md`](../CSS_CLEANUP_FAQ.md)
- **Flowchart & Diagrams:** [`CSS_ANALYSIS_FLOWCHART.md`](../CSS_ANALYSIS_FLOWCHART.md)
- **Executive Summary:** [`CSS_ANALYSIS_SUMMARY.md`](../CSS_ANALYSIS_SUMMARY.md)

---

## 🛠️ Maintenance

To ensure scripts stay current:

- [ ] Update `purgecss.config.js` when adding new HTML pages
- [ ] Update `safelist` when adding new dynamically-generated classes
- [ ] Re-run `npm run analyze:css` quarterly
- [ ] Monitor CSS file size in CI/CD

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| PurgeCSS not found | `npm install --save-dev purgecss` |
| Script not executable | `chmod +x scripts/css-cleanup-checklist.sh` |
| Coverage tool not opening | Manually open http://localhost:4173 + F12 |
| CSS didn't change | Check file paths, permissions, backup location |
| Stack won't rebuild | `docker compose down && docker compose up -d --build` |

See [`CSS_CLEANUP_FAQ.md`](../CSS_CLEANUP_FAQ.md) for more detailed troubleshooting.

---

**Last updated:** 2026-06-09

