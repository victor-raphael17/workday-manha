module.exports = {
  content: [
    // HTML pages (onde as classes CSS são usadas)
    './pages/**/*.html',
    './index.html',

    // JavaScript files com templates e renderização dinâmica
    './assets/js/page-behaviors.js',
    './assets/js/shell.js',
    './assets/js/ui.js',

    // Todos os outros JS também (para capturar geração dinâmica)
    './assets/js/**/*.js',
  ],

  // Bootstrap 5 + classes dinamicamente geradas que PurgeCSS não deveria remover
  safelist: [
    // Bootstrap modal e collapse (adicionados dinamicamente pelo JS)
    /^modal-/,
    /^collapse/,
    /^fade/,
    /^show$/,
    /^active$/,
    /^disabled$/,

    // Utilities do Bootstrap (muito usadas dinamicamente)
    /^d-/,
    /^text-/,
    /^bg-/,
    /^border-/,
    /^btn-/,
    /^alert-/,
    /^badge-/,
    /^list-group/,
    /^table-/,

    // Classes customizadas geradas em shell.js
    /^status-/,
    /^tone-/,

    // Estados
    /^is-/,
    /^has-/,
  ],

  css: ['./assets/css/app.css', './assets/css/theme.css'],

};