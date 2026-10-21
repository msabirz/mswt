import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "design/**",
      "playwright-report/**",
      "test-results/**",
      ".lighthouseci/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // eslint-config-next already registers the jsx-a11y plugin; turn on its full strict rule set.
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];

export default config;
