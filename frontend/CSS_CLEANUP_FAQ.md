# 🆘 CSS Cleanup - FAQ & Troubleshooting

> Respostas para as perguntas mais comuns e soluções rápidas para problemas.

---

## ❓ Perguntas Frequentes

### P1: "Quanto tempo leva para fazer a análise completa?"

**R:** ~40 minutos total:

- Setup: 5 min
- PurgeCSS: 5 min
- DevTools Coverage: 20 min (depende de quantas telas você testar)
- Aplicação + testes: 10 min

**Dica:** Se com pressa, faça PurgeCSS em 5 min, depois DevTools em 15 min = 20 min total.

---

### P2: "Posso rodar PurgeCSS sem testar em DevTools Coverage?"

**R:** ⚠️ **Não recomendo!**

**Por quê:**

- PurgeCSS escaneia arquivos (estático)
- DevTools vê o que é REALMENTE usado no navegador (dinâmico)
- Classes geradas em runtime (ex: `status-${state}`) podem não aparecer no scan estático

**Solução:** Use AMBOS em paralelo. Se PurgeCSS e DevTools concordarem, é seguro.

---

### P3: "PurgeCSS achou 20% de CSS não utilizado, mas DevTools mostrou 5%. Por quê?"

**R:** Você não testou todas as telas em DevTools!

**Checklist:**

- [ ] Login?
- [ ] Dashboard?
- [ ] Inventário (com search)?
- [ ] Pacientes (abrir modal)?
- [ ] Fornecedores?
- [ ] Prescrições (change state)?
- [ ] Ordens de compra?
- [ ] PDV (transação)?
- [ ] Responsivo (testar em mobile size)?

**Solução:** Re-rode DevTools Coverage testando TODAS essas telas.

---

### P4: "Removi CSS e agora uma página está quebrada. Como faço rollback?"

**R:** Super rápido (30 segundos):

```bash
# 1. Revert CSS
cp frontend/assets/css/app.css.backup frontend/assets/css/app.css

# 2. Rebuild
docker compose up -d --build

# 3. Testar
open http://localhost:4173

# 4. Investigar o que deu errado
# Re-rode PurgeCSS, veja o que foi removido
diff -u frontend/assets/css/app.css.backup frontend/purgecss-report.css
```

---

### P5: "PurgeCSS removeu classe Bootstrap. Como corrijo?"

**R:** Adicione ao `safelist` em `purgecss.config.js`:

```javascript
safelist: [
  /^btn-success$/, // Adicionar a classe específica
  /^table-/, // Ou regex para grupo
];
```

Depois re-rode:

```bash
npm run analyze:css
```

**Comum:** Classes Bootstrap não aparecem em HTML direto, aparecem via JavaScript (modais, collapse, etc). Por isso a `safelist` é crítica.

---

### P6: "Como sei se um CSS foi realmente removido?"

**R:** Compare os arquivos:

```bash
# Ver diferenças
diff -u frontend/assets/css/app.css.backup frontend/assets/css/app.css | less

# Ou contar linhas
wc -l frontend/assets/css/app.css.backup frontend/assets/css/app.css

# Ou ver tamanho em bytes
ls -lh frontend/assets/css/app.css.backup frontend/assets/css/app.css
```

---

### P7: "Preciso fazer isso toda semana?"

**R:** Não, depende:

- **Quarterly (a cada 3 meses):** Rotina normal. JS cresce, CSS incha, revisar.
- **Após grande refactor:** Se removeu várias telas/componentes.
- **Antes de deploy:** Bom momento para limpar.

**Dica:** Adicione `npm run analyze:css` ao CI/CD para alertar quando CSS cresce além do esperado.

---

### P8: "PurgeCSS tá lento. Por quê?"

**R:** Possível que o `content` array está scaneando muitos arquivos.

**Solução:**

```javascript
// purgecss.config.js
content: [
  "./pages/**/*.html", // Específico
  "./assets/js/**/*.js", // Evite muitos **/
  // NÃO faça: './**/*.js'  (muito lento)
];
```

Se ainda lento, verifique:

```bash
# Quantos arquivos está scaneando?
find frontend/pages -name "*.html" | wc -l
find frontend/assets/js -name "*.js" | wc -l
```

---

### P9: "Backup foi deletado acidentalmente. E agora?"

**R:** Se ainda não commitou:

```bash
git checkout HEAD -- frontend/assets/css/app.css
```

Se já commitou:

```bash
git log --oneline frontend/assets/css/app.css | head -5
git revert <commit-hash>
```

---

### P10: "Posso fazer CSS cleanup em produção?"

**R:** ✅ Sim, mas com cuidado:

1. Fazer em staging PRIMEIRO
2. Testar 24h em staging
3. Se OK, deploy para produção
4. Manter backup (sempre!)
5. Ter rollback plan pronto

**Nunca** faça CSS cleanup sem:

- [ ] Backup
- [ ] Teste completo
- [ ] Rollback plan

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: "Modal não abre depois de remover CSS"

**Sintomas:**

- Modal não aparece ao clicar
- Ou aparece mas sem estilos

**Causa provável:**

- Classe `.modal` ou `.fade` foi removida
- Classe `.show` foi removida

**Solução:**

```javascript
// purgecss.config.js
safelist: [
  /^modal-/,
  /^fade/,
  /^show$/, // ← Adicionar isso
];
```

Re-rode: `npm run analyze:css`

---

### Problema 2: "Formulário com validação está feio"

**Sintomas:**

- Inputs com `invalid` class parecem iguais aos normais
- Mensagens de erro desaparecem

**Causa provável:**

- Classes `.is-invalid` ou `.invalid-feedback` foram removidas

**Solução:**

```javascript
safelist: [/^is-/, /^invalid/];
```

Re-rode: `npm run analyze:css`

---

### Problema 3: "DevTools Coverage não mostra nada"

**Sintomas:**

- Aba Coverage vazia
- "No CSS coverage" mensagem

**Causa provável:**

- DevTools não encontrou arquivos CSS
- Ou CSS foi carregado de CDN

**Solução:**

1. Verificar que CSS está sendo carregado:

   ```bash
   # DevTools → Network → filtre "css"
   # Veja se app.css aparece
   ```

2. Se vem de CDN (ex: Bootstrap CDN):
   - Marque "Include third-party resources" em Coverage
   - Ou adicione arquivo ao `content` do PurgeCSS manualmente

---

### Problema 4: "Erro: PurgeCSS não encontrado"

**Sintomas:**

```bash
npm run analyze:css
# Error: Cannot find module 'purgecss'
```

**Solução:**

```bash
cd frontend
npm install --save-dev purgecss postcss

# Depois re-rode
npm run analyze:css
```

---

### Problema 5: "CSS file não foi modificado após copiar relatório"

**Sintomas:**

- Rodei `cp purgecss-report.css assets/css/app.css`
- Mas `app.css` não mudou

**Causa provável:**

- Permissões de arquivo
- Ou caminho errado

**Solução:**

```bash
# Verificar caminho correto
ls -la frontend/purgecss-report.css
ls -la frontend/assets/css/app.css

# Copiar com verbose
cp -v purgecss-report.css assets/css/app.css

# Verificar tamanho
ls -lh frontend/assets/css/app.css

# Se ainda não mudou, fazer manualmente
cat purgecss-report.css > assets/css/app.css
```

---

### Problema 6: "Telas renderizam diferente em staging vs produção após cleanup"

**Sintomas:**

- Funciona em localhost
- Mas quebra em staging ou produção

**Causa provável:**

- Cache do navegador ou CDN
- Ou CSS minificado vs não-minificado

**Solução:**

1. Limpar cache:

   ```bash
   # DevTools → Network → "Disable cache"
   ```

2. Hard refresh:

   ```
   Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows/Linux)
   ```

3. Se produção usa CDN/cache:
   ```bash
   # Fazer cache invalidation
   # (depende do seu setup)
   ```

---

### Problema 7: "Relatório diz que removeu 30%, mas arquivo ficou quase igual"

**Sintomas:**

- `purgecss-report.css` é menor que `app.css`
- Mas só 2-3% de diferença

**Causa provável:**

- % é de "regras", não de "bytes"
- Ou muitos comentários aumentam o tamanho original

**Solução:**

```bash
# Ver em bytes
du -h frontend/assets/css/app.css
du -h frontend/purgecss-report.css

# Ver em linhas
wc -l frontend/assets/css/app.css
wc -l frontend/purgecss-report.css

# Ver diferença exata
diff <(cat frontend/assets/css/app.css | wc -c) <(cat frontend/purgecss-report.css | wc -c)
```

---

## ✅ Checklist de Validação Final

Antes de fazer merge em produção:

- [ ] PurgeCSS rodou sem erros
- [ ] DevTools Coverage > 90% (CSS sendo usado)
- [ ] Ambos métodos concordam
- [ ] Backup foi criado
- [ ] CSS foi aplicado
- [ ] Stack rebuilt
- [ ] Teste completo passou (todas 8 telas)
- [ ] Console limpo (sem erros)
- [ ] Responsivo testado
- [ ] Git commit feito com mensagem descritiva
- [ ] PR criada para review
- [ ] Pelo menos 1 peer review approval

---

## 📞 Escalação

Se ainda tiver dúvida após checklist acima:

1. **Revisar:** [`CSS_PURGE_GUIDE.md`](../CSS_PURGE_GUIDE.md) (guia técnico completo)
2. **Comparar:** [`CSS_ANALYSIS_FLOWCHART.md`](../CSS_ANALYSIS_FLOWCHART.md) (diagrama visual)
3. **Validar:** [`CSS_CLEANUP.md`](./CSS_CLEANUP.md) (referência rápida frontend)
4. **Ask:** Pergunte no time + guarde esse FAQ para próxima vez

---

## 🎯 Referência Rápida

| Situação               | Comando                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| Começar análise        | `cd frontend && npm run analyze:css`                                   |
| Rodar guia interativo  | `bash frontend/scripts/css-cleanup-checklist.sh`                       |
| Aplicar mudança        | `cp frontend/purgecss-report.css frontend/assets/css/app.css`          |
| Rollback               | `cp frontend/assets/css/app.css.backup frontend/assets/css/app.css`    |
| Ver o que foi removido | `diff frontend/assets/css/app.css.backup frontend/purgecss-report.css` |
| Contar linhas          | `wc -l frontend/assets/css/app.css*`                                   |
| Confirmar CSS válido   | `npx postcss --syntax css frontend/assets/css/app.css`                 |

---

**Última atualização:** 2026-06-09
