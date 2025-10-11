import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      // Общие правила для всех JS файлов
      "semi": ["error", "always"],               // Точка с запятой в конце строки
      "no-console": "error",                      // Запрещены консольные логи
      "no-unused-vars": "error",                  // Неиспользуемые переменные
      "no-var": "error",                          // Запрещено использование var
      "no-undef": "error"                        // Запрещены неопределенные переменные
    }
  },
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"]
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"]
  }
]);
