# 🎯 Resumo Executivo: Análise Segura de CSS Não Utilizado

## A Pergunta Original

> "Como faço isso: Rodar PurgeCSS em dry-run (ou DevTools Coverage) cruzando com HTML + templates de `page-behaviors.js`/`shell.js`/`ui.js` **antes** de remover qualquer regra."

---

## A Resposta (3 opções, da mais rápida para a mais detalhada)

### ⚡ Opção 1: Comando Rápido (2 min)

```bash
cd frontend && npm install && npm run analyze:css
```

**Resultado:** Relatório de CSS não utilizado, pronto para revisar. Sem modificar nada.

---

### 🎮 Opção 2: Guia Interativo (15 min)

```bash
cd frontend && npm install && bash scripts/css-cleanup-checklist.sh
```

**O que faz:** Guia interativo que:
1. ✅ Roda PurgeCSS em dry-run
2. ✅ Pede para validar com DevTools Coverage (no navegador)
3. ✅ Compara os dois métodos
4. ✅ Aplica as mudanças se aprovado
5. ✅ Testa e faz commit

**Responde todas as perguntas para você.**

---

### 📖 Opção 3: Entendimento Completo (60 min)

Ler: [`CSS_PURGE_GUIDE.md`](../CSS_PURGE_GUIDE.md)

**Contém:**
- Configuração detalhada do PurgeCSS
- Como usar DevTools Coverage passo a passo
- Checklist de segurança ANTES de remover
- Armadilhas comuns e como evitar
- Exemplos práticos

---

## 🔬 Como Funciona: Visão Geral

### PurgeCSS (automático)

```
┌─────────────────────────────────────────────┐
│ PurgeCSS escaneia:                          │
│  • HTML pages/ (onde classes são usadas)    │
│  • JS assets/js/ (templates dinamicamente)  │
│  • CSS assets/css/ (as regras)              │
│                                             │
│ Resultado: lista de classes NUNCA usadas   │
│ (DRY-RUN = não modifica nada)               │
└─────────────────────────────────────────────┘
```

### DevTools Coverage (manual, no navegador)

```
┌─────────────────────────────────────────────┐
│ 1. Abrir http://localhost:4173              │
│ 2. F12 → Coverage → ⏺️ Record               │
│ 3. Clicar em TODAS as telas + interações   │
│ 4. Stop recording                           │
│ 5. Ver % de CSS usado vs. não usado         │
└─────────────────────────────────────────────┘
```

### Validação Cruzada

```
PurgeCSS: "app.css não usa classe .foo-bar"
DevTools: "Na verdade, nenhuma página usa .foo-bar"
         ↓
    ✅ SEGURO REMOVER
```

---

## 📋 Checklist Rápido (O que o script automatiza)

- [ ] **Setup** — PurgeCSS + PostCSS instalados
- [ ] **Análise PurgeCSS** — dry-run identificou CSS não utilizado
- [ ] **Validação DevTools** — você testou todas as telas com Coverage
- [ ] **Comparação** — ambos métodos indicam mesmas remoções
- [ ] **Backup** — `assets/css/app.css.backup` criado
- [ ] **Aplicação** — `cp purgecss-report.css assets/css/app.css`
- [ ] **Testes** — stack rodou, nenhum erro visual
- [ ] **Commit** — mudanças commitadas

---

## 📂 Arquivos Criados

Quando você rodar os comandos, esses arquivos serão criados:

```
frontend/
├── purgecss.config.js              ← Config (usa HTML + JS do projeto)
├── scripts/
│   ├── analyze-css-usage.js        ← Script que roda PurgeCSS
│   └── css-cleanup-checklist.sh    ← Guia interativo
├── CSS_CLEANUP.md                  ← Este arquivo (referência rápida)
│
├── assets/css/
│   ├── app.css                     ← Original (preservado)
│   └── app.css.backup              ← Backup (gerado na análise)
│
└── purgecss-report.css             ← CSS limpo (resultado do dry-run)
```

---

## 🚨 Alertas de Segurança

### ❌ NÃO FAÇA ISSO:
```bash
# ❌ Não rode sem validação cruzada
npm run analyze:css && cp purgecss-report.css assets/css/app.css

# ❌ Não pule DevTools Coverage
# (PurgeCSS pode não capturar classes geradas dinamicamente em runtime)

# ❌ Não confie em um método só
# Use sempre: PurgeCSS + DevTools juntos
```

### ✅ SEMPRE FAÇA ISSO:
```bash
# ✅ Validação cruzada
npm run analyze:css   # PurgeCSS
# + DevTools Coverage manual

# ✅ Backup antes
ls -la assets/css/app.css.backup

# ✅ Teste depois
docker compose up -d --build
open http://localhost:4173
# Testar: login → dashboard → todas as telas

# ✅ Revert se quebrou
cp assets/css/app.css.backup assets/css/app.css
```

---

## 🎯 Resultado Esperado

**Antes:**
```
frontend/assets/css/app.css → 5000 bytes → muitos CSS não usados
```

**Depois:**
```
frontend/assets/css/app.css → 4200 bytes → apenas CSS realmente usado
```

**Ganho:** ~16% de redução (varia por projeto)

---

## 🏃 Para Começar AGORA:

```bash
# 1. Instalar dependências
cd frontend && npm install

# 2. Rodar análise (não modifica nada!)
npm run analyze:css

# 3. Resultado → veja purgecss-report.css
# Ou ir para próximo passo: DevTools Coverage (manual, no navegador)
```

---

## 📚 Para Mais Detalhes

- 🔬 **Método técnico completo:** [`CSS_PURGE_GUIDE.md`](../CSS_PURGE_GUIDE.md)
- ⚡ **Referência rápida frontend:** [`frontend/CSS_CLEANUP.md`](./CSS_CLEANUP.md)
- 🎮 **Script interativo:** `bash scripts/css-cleanup-checklist.sh`

---

**Pronto? `npm run analyze:css` agora!** ✨
