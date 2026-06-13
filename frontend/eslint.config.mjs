import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
  {
    files: ["assets/js/**/*.js"],
    plugins: { js },
    extends: [js.configs.recommended, eslintConfigPrettier],
    languageOptions: {
      globals: globals.browser,
    },
  },

  {
    files: [
      "scripts/**/*.js",
      "*.config.js",
      "*.config.mjs",
      "vite.config.mjs",
    ],
    extends: [js.configs.recommended, eslintConfigPrettier],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
