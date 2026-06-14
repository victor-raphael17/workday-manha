
# DISTRIBUIÇÃO DAS TASKS ENTRE GRUPOS

## APENAS PARA MAPEAMENTO DAS TASKS, PARA DETALHES CONSULTE O ARQUIVO ORIGINAL

## GRUPO BENÍCIO:

### TECH LEAD
- [x] **Parâmetro `reason` do ajuste de estoque é coletado e descartado**

### FRONTEND
- [x] Escapar dados da API ante de injetar via `innerHTML` (XSS) (Paulo Eduardo)
- [x] Remover wrapper `api.categories` — `frontend/assets/js/api.js:144` (Murilo)
- [x] Remover wrapper `api.voidSale` — `frontend/assets/js/api.js:165` (Matheus)
- [x] **Checar expiração do token proativamente** — `frontend/assets/js/api.js:36` (Jeff)
- [x] **Ligar ou remover os botões decorativos da topbar** — `frontend/assets/js/shell.js:74` (Matheus)
- [x] **Loading state e prevenção de duplo-submit nos forms** — (Jeff)
- [x] **Focus trap nos modais** — `frontend/assets/js/ui.js:46` (Murilo)
- [x] **Externalizar a identidade da filial** — `frontend/assets/js/data.js` (Paulo Eduardo)
- [x] **Adicionar testes ao frontend (Vitest)** — `frontend/package.json` (Murilo)

### BACKEND
- [x] **Proteger as rotas autenticadas com middleware** — `backend/routes/api.php`, (Murilo)
- [x] Remover `SessionRepository::purgeExpired()` — `backend/src/Repositories/SessionRepository.php:56` (Paulo Eduardo)
- [x] Endpoints sem consumidor de UI - `GET /api/medications/categories` — `backend/routes/api.php` (Paulo Eduardo)
- [x] Endpoints sem consumidor de UI - `PUT/PATCH/DELETE /api/medications/{id}` — `backend/routes/api.php` (Jeff)
- [x] Endpoints sem consumidor de UI - `PUT/PATCH/DELETE /api/patients/{id}` — `backend/routes/api.php` (Jeff)
- [x] Endpoints sem consumidor de UI - `GET /api/sales`, `GET /api/sales/{id}`, `POST /api/sales/{id}/void` — `backend/routes/api.php` (Murilo)
- [x] **Paginação nos endpoints de listagem** — `backend/src/Repositories/` (Matheus)
- [x] **Suite de testes automatizados** — `backend/tests/` (Matheus)


## GRUPO FABIO:

### TECH LEAD
- [x] **Pipeline de CI (build + lint + testes)** (Fabio)

### FRONTEND
- [x] Remover wrapper `api.medication` — `frontend/assets/js/api.js:140` (Matheus P)
- [x] Remover wrapper `api.sales` — `frontend/assets/js/api.js:163` (Paulo S.)
- [x] **CSS potencialmente não usado** — `frontend/assets/css/app.css` (Paulo S.)
- [x] **Implementar a busca global da topbar** — `frontend/assets/js/shell.js:64` (Fabio)
- [x] **Paginação nas listagens** — `frontend/assets/js/page-behaviors.js`  (Matheus P)
- [x] **Feedback de offline / retry de rede** — `frontend/assets/js/api.js:107` (Victor)
- [x] **`aria-live` nos toasts e estados** — `frontend/assets/js/ui.js:11`      (Paulo S.)
- [x] **Extrair helper de render de tabela reutilizável** — `frontend/assets/js/page-behaviors.js` (Paulo S.)
- [x] **Adicionar ESLint + Prettier** — `frontend/package.json` (Paulo S. e Fabio)

### BACKEND
- [x] Remover `Env::int()` — `backend/src/Support/Env.php:37` (Matheus P)
- [x] Endpoints sem consumidor de UI - `GET /api/medications/{id}` — `backend/routes/api.php` (Paulo S.)
- [x] Endpoints sem consumidor de UI - `GET /api/medications/low-stock` e `GET /api/medications/expiring` (Fabio)
- [x] Endpoints sem consumidor de UI - `GET /api/auth/me` — `backend/routes/api.php` (Fabio)
- [x] CRUD de fornecedores (store/show/update/delete) — `backend/routes/api.php`  (Victor)
- [x] **Rate limiting / proteção contra brute-force no login** —  (Victor)
- [x] **Logging estruturado de erros** — `backend/src/Core/App.php:58` (Paulo S.)
- [x] **Restringir CORS por configuração** — `backend/src/Core/App.php:79` (Paulo S.)
