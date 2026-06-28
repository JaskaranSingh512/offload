import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "api/**",
      "e2e/**",
      "UI for offload/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
