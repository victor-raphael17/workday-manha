#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function analyzeCSS() {
  try {
    console.log('\n📊 Analisando CSS não utilizado...\n');

    try {
      require.resolve('purgecss');
    } catch (e) {
      console.log('⚠️  PurgeCSS não instalado. Instalando...\n');
      execSync('npm install --save-dev purgecss', { stdio: 'inherit' });
    }

    const { PurgeCSS } = require('purgecss');
    const rootDir = path.join(__dirname, '..');

    // fast-glob (usado internamente pelo PurgeCSS) exige forward slashes,
    // mesmo no Windows. path.join gera backslashes, então convertemos.
    const toGlob = (...segments) => path.join(rootDir, ...segments).split(path.sep).join('/');

    const result = await new PurgeCSS().purge({
      content: [
        toGlob('pages/**/*.html'),
        toGlob('index.html'),
        toGlob('assets/js/page-behaviors.js'),
        toGlob('assets/js/shell.js'),
        toGlob('assets/js/ui.js'),
        toGlob('assets/js/**/*.js'),
      ],
      css: [
        toGlob('assets/css/app.css'),
        toGlob('assets/css/theme.css'),
      ],
      safelist: {
        standard: [
          /^modal-/,
          /^collapse/,
          /^fade/,
          /^show$/,
          /^active$/,
          /^disabled$/,
          /^d-/,
          /^text-/,
          /^bg-/,
          /^border-/,
          /^btn-/,
          /^alert-/,
          /^badge-/,
          /^list-group/,
          /^table-/,
          /^status-/,
          /^tone-/,
          /^is-/,
          /^has-/,
        ],
      },
    });

    // Concatenar output de todos os arquivos CSS processados
    const purgecssOutput = result.map(r => r.css).join('\n');

    // O script cria o arquivo — sem depender da CLI
    const reportPath = path.join(rootDir, 'purgecss-report.css');
    fs.writeFileSync(reportPath, purgecssOutput, 'utf8');

    // Estatísticas
    const appCss = fs.readFileSync(path.join(rootDir, 'assets/css/app.css'), 'utf8');
    const themeCss = fs.readFileSync(path.join(rootDir, 'assets/css/theme.css'), 'utf8');
    const originalCss = appCss + '\n' + themeCss;

    const originalSize = Buffer.byteLength(originalCss, 'utf8');
    const purgecssSize = Buffer.byteLength(purgecssOutput, 'utf8');
    const removedSize = originalSize - purgecssSize;
    const removedPercent = ((removedSize / originalSize) * 100).toFixed(1);
    const originalLines = originalCss.split('\n').length;
    const purgecssLines = purgecssOutput.split('\n').length;
    const removedLines = originalLines - purgecssLines;

    // Backup
    const backupPath = path.join(rootDir, 'assets/css/app.css.backup');
    fs.writeFileSync(backupPath, appCss);

    console.log('═'.repeat(60));
    console.log('📈 RELATÓRIO DE ANÁLISE CSS - DRY-RUN');
    console.log('═'.repeat(60) + '\n');

    console.log('📁 Arquivos analisados:');
    console.log('   ✓ HTML: pages/*.html, index.html');
    console.log('   ✓ JS: page-behaviors.js, shell.js, ui.js');
    console.log('   ✓ CSS: app.css, theme.css\n');

    console.log('📊 Estatísticas:');
    console.log(`   • CSS original:       ${originalSize} bytes (${originalLines} linhas)`);
    console.log(`   • CSS utilizado:      ${purgecssSize} bytes (${purgecssLines} linhas)`);
    console.log(`   • CSS não utilizado:  ${removedSize} bytes (${removedLines} linhas)`);
    console.log(`   • % de remoção:       ${removedPercent}%\n`);

    console.log('💾 Arquivos criados:');
    console.log(`   ✓ ${reportPath}`);
    console.log(`   ✓ ${backupPath}\n`);

    console.log('⚠️  IMPORTANTE - Próximos passos:');
    console.log('   1️⃣  Revisar purgecss-report.css');
    console.log('   2️⃣  Validar com DevTools Coverage:');
    console.log('       • Abrir http://localhost:4173');
    console.log('       • F12 → Coverage → ⏺️ Record');
    console.log('       • Testar TODAS as telas');
    console.log('       • Parar recording → comparar com PurgeCSS');
    console.log('   3️⃣  Se ambos indicarem mesmas remoções:');
    console.log('       • cp purgecss-report.css assets/css/app.css');
    console.log('       • docker compose up -d --build');
    console.log('       • git commit -m "Remove unused CSS"');
    console.log('   4️⃣  Se algo quebrou:');
    console.log(`       • cp ${backupPath} assets/css/app.css\n`);

    console.log('═'.repeat(60) + '\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante análise:', error.message);
    process.exit(1);
  }
}

analyzeCSS();