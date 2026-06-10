# 🔍 Guia de Análise Segura de CSS Não Utilizado

> Como rodar PurgeCSS em **dry-run** ou usar **DevTools Coverage** para identificar CSS que pode ser removido,
> **antes** de remover qualquer regra.

---

## ⚠️ Princípio: Sempre validar em dry-run PRIMEIRO

Nunca apague CSS sem saber com certeza onde ele é usado. Este guia oferece dois caminhos paralelos:

1. **PurgeCSS (automático, linha de comando)** — varredura estática dos arquivos
2. **DevTools Coverage (manual, navegador)** — validação em tempo real durante uso

Use os dois em paralelo para máxima confiança.

---

## 📋 Pré-requisitos

```bash
# 1. Node.js + npm (já temos Vite)
node --version  # v18+ esperado

# 2. Instalar PurgeCSS e PostCSS
cd frontend && npm install --save-dev purgecss postcss

# 3. Verificar arquivos CSS
ls -la assets/css/
# app.css, theme.css

# 4. Verificar fontes HTML + JS templates
find . -name "*.html" -o -name "*.js" | head -20
# pages/*.html, assets/js/page-behaviors.js, shell.js, ui.js
```

---

## 🔬 Método 1: PurgeCSS em Dry-Run (Automático)

### Passo 1: Criar arquivo de configuração

Cria `frontend/purgecss.config.js`:

```javascript
// frontend/purgecss.config.js
module.exports = {
  content: [
    // HTML pages (onde as classes são usadas)
    "./pages/**/*.html",
    "./index.html",

    // JavaScript files (templates, dinamicamente renderizados)
    "./assets/js/page-behaviors.js",
    "./assets/js/shell.js",
    "./assets/js/ui.js",

    // Todos os JS (para ter certeza)
    "./assets/js/**/*.js",
  ],

  // Bootstrap 5 safelist (classes que PurgeCSS poderia remover mas não deve)
  safelist: [
    // Bootstrap classes dinamicamente adicionadas
    /^modal-/, // modais
    /^collapse/, // collapse
    /^fade/, // fade animation
    /^show$/, // Bootstrap show class
    /^active$/, // active states
    /^disabled$/, // disabled states
    /^d-/, // display utilities
    /^text-/, // text utilities
    /^bg-/, // background utilities
    /^border-/, // border utilities
    /^btn-/, // button variants
    /^alert-/, // alert variants
    /^badge-/, // badge variants
    /^list-group/, // list group
    /^table-/, // table utilities
    // Status classes dinamicamente definidas em shell.js
    /^status-/,
    /^tone-/, // tone classes
  ],

  css: ["./assets/css/app.css", "./assets/css/theme.css"],

  output: "./purgecss-report.css", // saída do relatório (dry-run)
};
```

### Passo 2: Rodar PurgeCSS em Dry-Run (apenas análise, não modifica)

```bash
cd frontend

# Instalar PurgeCSS localmente
npm install --save-dev purgecss

# Rodar análise (modo DRY-RUN - apenas lê, não escreve)
npm run analyze:css

# OU se preferir rodar PurgeCSS diretamente (imprime resultado, não modifica):
npx purgecss --config purgecss.config.js
```

### Passo 3: Interpretar o relatório

```bash
# Ver quanto CSS seria removido
wc -l assets/css/app.css assets/css/theme.css purgecss-report.css

# Exemplo output:
#   50 assets/css/app.css
#   40 assets/css/theme.css
#   35 purgecss-report.css
#   → 55 linhas seria removidas (55 = 90 - 35)

# Ver quais classes foram marcadas para remoção
diff -u purgecss-report.css assets/css/app.css | grep "^-" | head -20
```

### Passo 4: Script automático para análise

Cria `frontend/scripts/analyze-css-usage.js`:

```javascript
// frontend/scripts/analyze-css-usage.js
const fs = require("fs");
const path = require("path");
const purgecss = require("purgecss");

async function analyzeCSS() {
  console.log("🔍 Analisando CSS não utilizado...\n");

  const result = await purgecss.default({
    content: [
      "pages/**/*.html",
      "index.html",
      "assets/js/page-behaviors.js",
      "assets/js/shell.js",
      "assets/js/ui.js",
      "assets/js/**/*.js",
    ],
    css: ["assets/css/app.css", "assets/css/theme.css"],
    safelist: [
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
    ],
  });

  // Salvar relatório
  const reportContent = result[0].css;
  fs.writeFileSync("purgecss-report.css", reportContent);

  // Calcular estatísticas
  const originalSize = fs
    .readdirSync("assets/css")
    .filter((f) => f.endsWith(".css"))
    .reduce(
      (sum, f) =>
        sum + fs.readFileSync(path.join("assets/css", f), "utf8").length,
      0
    );

  const reportSize = reportContent.length;
  const removedSize = originalSize - reportSize;
  const removedPercent = ((removedSize / originalSize) * 100).toFixed(1);

  console.log("📊 RELATÓRIO DE ANÁLISE CSS\n");
  console.log(`✓ Arquivos analisados:`);
  console.log(`  • HTML: pages/*.html`);
  console.log(`  • JS: page-behaviors.js, shell.js, ui.js\n`);

  console.log(`📈 Estatísticas:`);
  console.log(`  • CSS original: ${originalSize} bytes`);
  console.log(`  • CSS utilizado: ${reportSize} bytes`);
  console.log(
    `  • CSS não utilizado: ${removedSize} bytes (${removedPercent}%)\n`
  );

  console.log(`✅ Relatório salvo em: purgecss-report.css`);
  console.log(`   (Abra no navegador para revisar)\n`);

  console.log(`⚠️  PRÓXIMOS PASSOS:`);
  console.log(`   1. Revisar purgecss-report.css`);
  console.log(`   2. Executar DevTools Coverage (método 2)`);
  console.log(`   3. Comparar resultados dos dois métodos`);
  console.log(`   4. Criar PR com mudanças\n`);
}

analyzeCSS().catch(console.error);
```

### Passo 5: Adicionar script ao package.json

```bash
# frontend/package.json
npm set-script analyze:css "node scripts/analyze-css-usage.js"

# Agora rodar com:
npm run analyze:css
```

---

## 🌐 Método 2: DevTools Coverage (Validação em Tempo Real)

### Passo 1: Abrir DevTools no navegador

```bash
# 1. Iniciar stack
docker compose up -d --build

# 2. Abrir navegador
open http://localhost:4173

# 3. Abrir DevTools
Cmd+Opt+I (Mac) ou Ctrl+Shift+I (Windows/Linux)
```

### Passo 2: Ativar Coverage

```
1. DevTools → Command Palette (Cmd/Ctrl + Shift + P)
2. Digitar "Coverage"
3. Selecionar "Show Coverage"
4. Clicar no ícone ⏺️ "Record" (canto inferior esquerdo)
5. Deixar rodando enquanto você testa o app
```

### Passo 3: Testar todos os flows

Enquanto Coverage está rodando, clique em **todas as telas e ações**:

- Login de teste: `jade@capharmacy.com` / senha `password123`

- ✅ Fazer login
- ✅ Dashboard → todas as abas
- ✅ Inventário → filter, search
- ✅ Pacientes → CRUD
- ✅ Fornecedores → CRUD
- ✅ Prescrições → ver, criar, editar
- ✅ Ordens de compra → listar, criar
- ✅ PDV → testes de transação
- ✅ Modais, tooltips, validações

Roteiro de 10 minutos para sentir o produto:

1. Faça login. Olhe o Dashboard.
2. Vá em **Inventory**, escolha um remédio, dê entrada de estoque ("Receive"). Veja o número subir.
3. Vá no **POS**, monte um carrinho com esse remédio, finalize a venda. Volte no Inventory: o número desceu.
4. No POS/histórico, **anule (void)** a venda. O estoque volta.
5. Em **Orders**, crie um pedido e mude o estado até `received`. O estoque sobe.
6. Em **Prescriptions**, leve uma receita até `dispensed` e veja o estoque cair.

### Passo 4: Gerar relatório

```
1. Clicar botão "Stop" no Coverage
2. Ver:
   - % de cobertura por arquivo CSS
   - Linhas que NÃO foram usadas
3. Clicar em "app.css" ou "theme.css"
4. Vermelho = não usado, azul = usado
5. Clicar em uma regra vermelha → mostra onde seria usado (debug)
```

### Passo 5: Exportar e comparar

```bash
# DevTools não exporta nativamente, mas você pode:
# 1. Clicar direito no relatório
# 2. "Save as..." → salvar screenshot
# OU copiar manualmente as linhas não usadas
```

---

## ✅ Checklist de Segurança ANTES de Remover CSS

### 1️⃣ Validação Cruzada

- [ ] PurgeCSS rodou sem erros (`analyze:css`)
- [ ] DevTools Coverage foi executado em **todas as telas**
- [ ] **Ambos os métodos apontam as MESMAS regras como não usadas**
- [ ] Versão do Bootstrap 5 é a mesma nos dois métodos

### 2️⃣ Verificação de Contexto

Para cada classe marcada como não usada, verificar:

```bash
# Procurar em HTML
grep -r "class-name" pages/ --include="*.html"

# Procurar em JavaScript (templates string literals)
grep -r "class-name" assets/js/ --include="*.js"

# Procurar em componentes dinamicamente gerados
grep -rn "backgroundColor\|classList\|className" assets/js/ | grep -i "class-name"

# Procurar em CSS inline (muito raro mas possível)
grep -r "style=" pages/ assets/js | grep "property-name"
```

### 3️⃣ Validação de Bootstrap Safelist

Antes de remover, garantir que:

- [ ] Nenhuma classe Bootstrap foi removida por engano
- [ ] Classes de estado (`active`, `disabled`, `show`) não foram tocadas
- [ ] Classes de animação (`fade`, `collapse`) não foram tocadas
- [ ] Utilities (`d-*`, `text-*`, `bg-*`) estão todas preservadas

### 4️⃣ Testes de Regressão

```bash
# 1. Fazer o "remove" (criando versão limpa)
cp assets/css/app.css assets/css/app.css.backup
cp purgecss-report.css assets/css/app.css

# 2. Rodar stack e testar
docker compose up -d --build

# 3. DevTools Coverage NOVAMENTE
# Resultado esperado: % de uso deve subir (menos CSS = menos não usado)

# 4. Se algo quebrou, reverter
cp assets/css/app.css.backup assets/css/app.css
```

### 5️⃣ Review de Diff

```bash
# Ver exatamente o que será removido
diff -u assets/css/app.css purgecss-report.css > css-removal.patch

# Revisar cada remoção
cat css-removal.patch | grep "^-" | less

# Confirmar cada linha

# Criar branch + PR
git checkout -b refactor/purge-unused-css
git add css-removal.patch
git commit -m "Remover CSS não utilizado (validado com PurgeCSS + DevTools)"
git push origin refactor/purge-unused-css
```

---

## 🧪 Exemplo Prático: Remover uma classe não usada

Cenário: PurgeCSS + DevTools indicam que `.my-old-component` nunca aparece.

### 1. Confirmar que é realmente morto

```bash
# Procurar em TUDO
grep -r "my-old-component" .
# Resultado: nada → seguro remover

# Procurar variações
grep -r "my.old.component\|my_old_component" .
# Resultado: nada → seguro remover
```

### 2. Verificar em CSS

```bash
# Abrir app.css e localizar:
grep -n "my-old-component" assets/css/app.css

# Ver contexto
sed -n '50,70p' assets/css/app.css  # linhas 50-70

# Se for safe, remover a regra
```

### 3. Testar

```bash
# Stack rodando
docker compose up -d --build

# Visitar TODAS as telas no navegador
open http://localhost:4173

# Garantir que nada quebrou
# Verificar console por erros de CSS
```

### 4. Confirmar remoção

```bash
git add assets/css/app.css
git commit -m "Remove unused CSS rule: .my-old-component"
```

---

## 🚨 Armadilhas Comuns

| Armadilha                                         | Sintoma                              | Solução                                                   |
| ------------------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| Classes Bootstrap removidas por erro              | Layout desalinha, botões ficam feios | Usar `safelist` no config PurgeCSS                        |
| Classes em Bootstrap JS (modais, collapse)        | Modais não abrem                     | Adicionar `modal-*` ao safelist                           |
| Classes geradas dinamicamente (`status-${state}`) | Certos status não recebem cor        | Usar regex no safelist: `/^status-/`                      |
| CSS com @media queries                            | Layout responsivo quebra             | PurgeCSS preserva media queries, testar em todos tamanhos |
| CSS vendor-prefixed                               | Animações não funcionam              | PurgeCSS preserva prefixos automaticamente                |
| Arquivo CSS muito grande (não foi limpo)          | Análise toma muito tempo             | Aumentar recursão em `content`                            |

---

## 📈 Padrão de Execução Recomendado

```bash
# Semana 1: Análise
npm run analyze:css                    # PurgeCSS dry-run
# + DevTools Coverage manual

# Semana 2: Validação cruzada
# Criar issue com os resultados
# Review em pair programming

# Semana 3: Limpeza
# Aplicar remoção (backup + teste)
# PR para review

# Semana 4: Monitoramento
# Acompanhar em staging/prod
# Reverter se necessário
```

---

## 📚 Referências

- [PurgeCSS Documentation](https://purgecss.com/)
- [Chrome DevTools Coverage](https://developer.chrome.com/docs/devtools/coverage/)
- [Bootstrap 5 Utilities](https://getbootstrap.com/docs/5.0/utilities/api/)
- [PostCSS](https://postcss.org/)

---

## 🎯 TL;DR (Resumo para Imediatistas)

```bash
# Setup
cd frontend && npm install

# Análise rápida (dry-run - não modifica nada)
npm run analyze:css

# + DevTools Coverage manual (F12 → Coverage → ⏺️ Record)
# Testar todas as telas
# Comparar resultados

# Apenas depois:
# cp purgecss-report.css assets/css/app.css (e testar)
```
