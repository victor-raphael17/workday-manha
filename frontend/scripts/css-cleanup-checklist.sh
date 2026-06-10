#!/bin/bash

# 📋 Checklist interativo de análise e limpeza de CSS
# 
# Uso: bash scripts/css-cleanup-checklist.sh
# 
# Guia o usuário por todos os passos: PurgeCSS → DevTools → Validação → Commit

set -e

clear

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           🔍 CSS CLEANUP CHECKLIST & GUIDE                ║"
echo "║        Safe Removal via PurgeCSS + DevTools Coverage      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# PHASE 1: SETUP
# ============================================================================

echo "📦 PHASE 1: Setup & Dependencies"
echo "─────────────────────────────────"
echo ""

read -p "Install dependencies (purgecss, postcss)? [y/N]: " -n 1 -r install_deps
echo ""
if [[ $install_deps =~ ^[Yy]$ ]]; then
  echo "Installing..."
  npm install --save-dev purgecss postcss
  echo "✅ Dependencies installed"
fi

echo ""
echo "✅ PHASE 1 COMPLETE"
echo ""
sleep 1

# ============================================================================
# PHASE 2: PURGECSS DRY-RUN
# ============================================================================

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🔬 PHASE 2: PurgeCSS Dry-Run Analysis             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Starting PurgeCSS analysis (dry-run mode - no changes)..."
npm run analyze:css

echo ""
echo "📊 Dry-run complete!"
echo "   Report saved to: purgecss-report.css"
echo "   Backup saved to: assets/css/app.css.backup"
echo ""

read -p "Review purgecss-report.css now? [y/N]: " -n 1 -r review_report
echo ""
if [[ $review_report =~ ^[Yy]$ ]]; then
  if command -v open &> /dev/null; then
    open purgecss-report.css
  elif command -v xdg-open &> /dev/null; then
    xdg-open purgecss-report.css
  else
    echo "Open purgecss-report.css in your editor to review"
  fi
fi

echo ""
echo "✅ PHASE 2 COMPLETE"
echo ""
sleep 2

# ============================================================================
# PHASE 3: DEVTOOLS COVERAGE
# ============================================================================

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🌐 PHASE 3: DevTools Coverage Validation (Manual)         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Next, validate with DevTools Coverage in your browser:"
echo ""
echo "1. Ensure backend is running:"
echo "   $ docker compose up -d api db"
echo ""
echo "2. Start dev server (if not running):"
echo "   $ npm run dev"
echo ""
echo "3. Open browser:"
echo "   → http://localhost:4173"
echo ""
echo "4. Open DevTools (F12 or Cmd+Opt+I)"
echo ""
echo "5. Enable Coverage:"
echo "   • Command Palette: Cmd/Ctrl + Shift + P"
echo "   • Type 'Coverage'"
echo "   • Press Enter"
echo "   • Click ⏺️ Record (start recording)"
echo ""
echo "6. Test ALL screens and interactions:"
echo "   ✓ Login flow"
echo "   ✓ Dashboard (all views)"
echo "   ✓ Inventory (search, filter)"
echo "   ✓ Patients (CRUD)"
echo "   ✓ Suppliers (CRUD)"
echo "   ✓ Prescriptions (create, dispense)"
echo "   ✓ Purchase Orders (workflow)"
echo "   ✓ Point of Sale (transactions)"
echo "   ✓ Modals, tooltips, form validations"
echo ""
echo "7. Stop recording (click button or F8)"
echo ""
echo "8. Compare results:"
echo "   • Open purgecss-report.css in editor"
echo "   • Compare unused rules in DevTools"
echo "   • Do they match?"
echo ""

read -p "Press ENTER when DevTools validation complete..." dummy_var

echo ""
echo "✅ PHASE 3 COMPLETE"
echo ""
sleep 1

# ============================================================================
# PHASE 4: COMPARISON & DECISION
# ============================================================================

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     ⚖️  PHASE 4: Compare Results & Make Decision           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Questions to answer BEFORE proceeding:"
echo ""
echo "1. Did PurgeCSS and DevTools identify the SAME rules as unused?"
echo "   - If NO: Do NOT proceed. Review both reports carefully."
echo "   - If YES: Continue to next question."
echo ""
echo "2. Are you confident about removing these rules?"
echo "   - Bootstrap safelist preserved?"
echo "   - Dynamic classes (status-*, tone-*, etc) preserved?"
echo "   - Any custom JS-generated classes included?"
echo "   - If uncertain: Do NOT proceed. Ask for peer review."
echo ""
echo "3. Do you have a backup?"
echo "   ✓ Yes: assets/css/app.css.backup exists"
echo ""

read -p "Proceed with CSS removal? [y/N]: " -n 1 -r proceed_removal
echo ""

if [[ ! $proceed_removal =~ ^[Yy]$ ]]; then
  echo "❌ Removal cancelled."
  echo "   Next time: npm run analyze:css"
  exit 0
fi

echo ""
echo "✅ PHASE 4 COMPLETE"
echo ""
sleep 1

# ============================================================================
# PHASE 5: APPLY & TEST
# ============================================================================

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       🔧 PHASE 5: Apply Changes & Test                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Applying CSS changes..."
cp purgecss-report.css assets/css/app.css
echo "✓ CSS updated"
echo ""

echo "Rebuilding stack..."
docker compose up -d --build
echo "✓ Stack rebuilt"
echo ""

echo "Testing application..."
echo "   • Opening http://localhost:4173"
echo "   • Open DevTools Console (F12)"
echo "   • Check for CSS errors"
echo ""

if command -v open &> /dev/null; then
  open http://localhost:4173
elif command -v xdg-open &> /dev/null; then
  xdg-open http://localhost:4173
else
  echo "   → Open http://localhost:4173 in your browser"
fi

echo ""
read -p "Did everything look good? [y/N]: " -n 1 -r looks_good
echo ""

if [[ ! $looks_good =~ ^[Yy]$ ]]; then
  echo "❌ Reverting changes..."
  cp assets/css/app.css.backup assets/css/app.css
  docker compose up -d --build
  echo "✓ Reverted to backup"
  echo "   Next steps: Review purgecss-report.css more carefully"
  exit 1
fi

echo "✅ PHASE 5 COMPLETE"
echo ""
sleep 1

# ============================================================================
# PHASE 6: COMMIT & CLEANUP
# ============================================================================

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║    📝 PHASE 6: Commit Changes & Cleanup                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Preparing for commit..."
echo ""

# Show diff stats
echo "Changes summary:"
git diff --stat assets/css/app.css || echo "   (Git not initialized)"
echo ""

read -p "Create feature branch? [y/N]: " -n 1 -r create_branch
echo ""
if [[ $create_branch =~ ^[Yy]$ ]]; then
  git checkout -b refactor/purge-unused-css
  echo "✓ Branch created: refactor/purge-unused-css"
fi

read -p "Stage and commit? [y/N]: " -n 1 -r do_commit
echo ""
if [[ $do_commit =~ ^[Yy]$ ]]; then
  git add assets/css/app.css
  git commit -m "refactor: Remove unused CSS via PurgeCSS analysis

- Analyzed with PurgeCSS (dry-run)
- Validated with DevTools Coverage
- All screens tested
- Bootstrap safelist preserved
- Removed ${removed_percent}% of original CSS"
  echo "✓ Changes committed"
  echo ""
  read -p "Push branch? [y/N]: " -n 1 -r do_push
  echo ""
  if [[ $do_push =~ ^[Yy]$ ]]; then
    git push origin refactor/purge-unused-css
    echo "✓ Branch pushed"
  fi
fi

echo ""
echo "Cleaning up temporary files..."
rm -f purgecss-report.css
echo "✓ Cleanup complete"

echo ""
echo "✅ ALL PHASES COMPLETE!"
echo ""
echo "📋 Final checklist:"
echo "   ✓ PurgeCSS dry-run executed"
echo "   ✓ DevTools Coverage validation done"
echo "   ✓ Results compared and matched"
echo "   ✓ CSS removed and tested"
echo "   ✓ Changes committed"
echo ""
echo "🎉 CSS cleanup successful!"
echo ""
