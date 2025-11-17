import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["src/**/*.ts"],
    ignores: ["dist/", "node_modules/", "coverage/", "**/*.test.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      // TypeScript-specific rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-floating-promises": "warn",

      // General rules
      "no-console": "off", // We'll keep console for now, logger system will replace it gradually
      "no-debugger": "error",
      "prefer-const": "warn",
      "no-var": "error",

      // Code style
      "semi": ["error", "always"],
      "quotes": ["warn", "single", { "avoidEscape": true }],
      "indent": ["warn", 2, { "SwitchCase": 1 }],
      "comma-dangle": ["warn", "only-multiline"],
    },
  },
];
