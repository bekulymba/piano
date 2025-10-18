import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.ts"],
    languageOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        globals: {
          window: "readonly",
          document: "readonly",
          localStorage: "readonly",
          FileReader: "readonly",
          alert: "readonly",
          prompt: "readonly",
          performance: "readonly",
          URL: "readonly",
          Blob: "readonly",
          setTimeout: "readonly",
          clearTimeout: "readonly",
          setInterval: "readonly",
          clearInterval: "readonly"
        }
      },
    rules: {
      semi: ["error", "always"],
      "no-console": "error",
      "no-unused-vars": "error",
      "no-var": "error",
      "no-undef": "error"
    },
  },
];