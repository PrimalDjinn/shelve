import { createConfig } from "@hrcd/eslint-config";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default createConfig([
  {
    features: {
      packageJson: {
        enabled: false,
      },
    },
  },
  eslintConfigPrettier,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["**/*.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
      "import/first": "off",
    },
  },
]);
