## Dados das tasks

### Feitas

# Front
- [V] Remover wrapper `api.medication` — `frontend/assets/js/api.js:140`
    - Author: Pilonetto | Status: Merged

- [V] Remover wrapper `api.sales` — `frontend/assets/js/api.js:163`
    - Author: Paulo S.  | Status: Merged

- [ ] **Adicionar ESLint + Prettier** — `frontend/package.json`
    - Author: Paulo S.  | Status: In Analisys

- [V] **Paginação nas listagens** — `frontend/assets/js/page-behaviors.js`
    - Author: Pilonetto | Status: Merged(Reanalisar)

- [ ] **CSS potencialmente não usado** — `frontend/assets/css/app.css`
    - Author: Victor    | Status: In Analisys

# Back

- [V] Remover `Env::int()` — `backend/src/Support/Env.php:37`
    - Author: Pilonetto | Status: Merged

- [V] Endpoints sem consumidor de UI - `GET /api/medications/{id}` — `backend/routes/api.php`
    - Author: Paulo S.  | Status: Merged

- [V] **Restringir CORS por configuração** — `backend/src/Core/App.php:79`
    - Author: Paulo S.  | Status: Merged


### Distribuidas

# Front


- [ ] **Implementar a busca global da topbar** — `frontend/assets/js/shell.js:64`

- [ ] **Feedback de offline / retry de rede** — `frontend/assets/js/api.js:107`
    - Victor

# Back

- [ ] **Logging estruturado de erros** — `backend/src/Core/App.php:58`
    - Paulo

- [ ] CRUD de fornecedores (store/show/update/delete) — `backend/routes/api.php`
    - Victor

- [ ] CRUD de fornecedores (store/show/update/delete) — `backend/routes/api.php`
    - Victor

- [ ] **Rate limiting / proteção contra brute-force no login**
    - Victor

- [ ] Endpoints sem consumidor de UI - `GET /api/medications/low-stock` e `GET /api/medications/expiring` — `backend/routes/api.php`
- [ ] Endpoints sem consumidor de UI - `GET /api/auth/me` — `backend/routes/api.php`


### Não distribuidas

# Front

- [ ] **`aria-live` nos toasts e estados** — `frontend/assets/js/ui.js:11`
- [ ] **Extrair helper de render de tabela reutilizável** — `frontend/assets/js/page-behaviors.js`
