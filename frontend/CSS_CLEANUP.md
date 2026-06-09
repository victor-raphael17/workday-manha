# 🧹 CSS Cleanup & Analysis Quick Guide

> How to safely analyze and remove unused CSS from the CA Pharmacy frontend using PurgeCSS + DevTools Coverage.

---

## 🚀 Quick Start (3 commands)

```bash
# 1. Install dependencies
cd frontend && npm install

# 2. Run interactive checklist (recommended - guides you through all steps)
bash scripts/css-cleanup-checklist.sh

# OR run only PurgeCSS analysis (faster)
npm run analyze:css
```

---

## 📋 What Each Command Does

### `npm run analyze:css`
- ✅ Runs PurgeCSS in **dry-run mode** (no changes)
- ✅ Analyzes which CSS rules are unused
- ✅ Creates `purgecss-report.css` (clean version for review)
- ✅ Creates `assets/css/app.css.backup` (safety net)
- ✅ Shows statistics (how much % could be removed)

**Output:**
```
📊 RELATÓRIO DE ANÁLISE CSS - DRY-RUN
   • CSS original:       5000 bytes
   • CSS utilizado:      4200 bytes
   • CSS não utilizado:  800 bytes (16%)
   ✓ purgecss-report.css
   ✓ assets/css/app.css.backup
```

### `bash scripts/css-cleanup-checklist.sh`
- ✅ Runs interactive **5-phase workflow**
- ✅ PurgeCSS dry-run (Phase 1-2)
- ✅ Manual DevTools Coverage validation (Phase 3)
- ✅ Comparison & approval (Phase 4)
- ✅ Apply, test, commit (Phase 5-6)

**Interactive prompts guide you:**
```
1. Install dependencies?
2. Review PurgeCSS results?
3. Open DevTools Coverage...
4. Did everything look good?
5. Create feature branch & commit?
```

---

## 🔍 Two Methods in Parallel

### Method 1: PurgeCSS (Automated)
```bash
npm run analyze:css
# ✓ Static analysis of HTML + JS
# ✓ Generates list of unused rules
# ✓ Dry-run (no changes)
```

**Good for:** Quick scan, baseline understanding

### Method 2: DevTools Coverage (Manual)
```
1. Open http://localhost:4173 (browser)
2. F12 → Coverage tab → ⏺️ Record
3. Click through ALL screens
4. Stop recording → see % of CSS used
5. Compare with PurgeCSS report
```

**Good for:** Validating in real-time, catching edge cases

---

## ✅ Safety Checklist BEFORE Removing CSS

- [ ] **Both methods agree** — PurgeCSS and DevTools show same unused rules
- [ ] **Bootstrap safelist is intact** — no utility classes removed
- [ ] **Dynamic classes preserved** — `status-*`, `tone-*`, etc
- [ ] **Modal/collapse preserved** — Bootstrap JS-added classes
- [ ] **Backup exists** — `assets/css/app.css.backup` created
- [ ] **All screens tested** — login, dashboard, all pages
- [ ] **No console errors** — DevTools shows no CSS errors

---

## 📁 Generated Files

After running `npm run analyze:css`:

```
frontend/
├── purgecss-report.css              ← CLEAN CSS (for review)
├── assets/css/
│   ├── app.css                      ← ORIGINAL (current)
│   └── app.css.backup               ← BACKUP (safety net)
├── purgecss.config.js               ← Configuration
└── scripts/
    ├── analyze-css-usage.js         ← Script (runs PurgeCSS)
    └── css-cleanup-checklist.sh     ← Interactive guide
```

---

## 🔄 Workflow to Apply Changes

### If results look good:

```bash
# 1. Copy clean version to production CSS
cp frontend/purgecss-report.css frontend/assets/css/app.css

# 2. Rebuild stack
docker compose up -d --build

# 3. Test everything in browser
open http://localhost:4173

# 4. If OK, commit
git add frontend/assets/css/app.css
git commit -m "refactor: Remove unused CSS (validated with PurgeCSS + DevTools)"

# 5. If broken, revert
cp frontend/assets/css/app.css.backup frontend/assets/css/app.css
```

---

## ⚠️ Common Gotchas & Safelist

The `purgecss.config.js` includes a **safelist** of classes that should NOT be removed:

```javascript
safelist: [
  /^modal-/,        // Bootstrap modals
  /^collapse/,      // Bootstrap collapse
  /^show$/,         // Bootstrap show state
  /^active$/,       // Active states
  /^d-/,            // Display utilities
  /^text-/,         // Text utilities
  /^bg-/,           // Background utilities
  /^status-/,       // Custom: status badges
  /^tone-/,         // Custom: tone classes
]
```

**If you see CSS removed that shouldn't be:**
1. Add it to `safelist` in `purgecss.config.js`
2. Re-run `npm run analyze:css`
3. Verify again

---

## 🧪 Testing Checklist (After Applying Changes)

After copying `purgecss-report.css` to `app.css`, test:

- [ ] **Login** — form styles work
- [ ] **Dashboard** — cards, metrics render correctly
- [ ] **Inventory** — table, search, filters work
- [ ] **Patients** — modals open/close smoothly
- [ ] **Prescriptions** — state badges show correct colors
- [ ] **Orders** — workflow UI responds to state changes
- [ ] **Point of Sale** — live cart updates, totals display
- [ ] **Modals** — open, close, animations work
- [ ] **Responsive** — test on mobile (DevTools)
- [ ] **Console** — no CSS-related errors (F12)

---

## 📚 Reference

- **Main guide:** [`CSS_PURGE_GUIDE.md`](../CSS_PURGE_GUIDE.md) (comprehensive, all details)
- **PurgeCSS docs:** https://purgecss.com/
- **DevTools Coverage:** https://developer.chrome.com/docs/devtools/coverage/
- **Bootstrap 5:** https://getbootstrap.com/docs/5.0/

---

## 🎯 TL;DR

```bash
# Setup
cd frontend && npm install

# Analyze
npm run analyze:css

# Review in browser + DevTools Coverage (F12)
open http://localhost:4173

# If both methods agree, apply:
cp purgecss-report.css assets/css/app.css
docker compose up -d --build

# Test & commit
git add assets/css/app.css
git commit -m "Remove unused CSS"
```

---

## 🆘 Need Help?

- **PurgeCSS didn't find safelist?** → Check regex in `purgecss.config.js`
- **CSS disappeared on one page?** → Add class to `safelist`
- **DevTools shows different results?** → Make sure you tested ALL screens
- **Something broke?** → `cp assets/css/app.css.backup assets/css/app.css` + rebuild

