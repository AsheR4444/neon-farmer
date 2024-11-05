import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "no-unused-private-class-members": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-private-class-members": "off",
      semi: "off",
      "max-len": ["warn", { code: 120 }],
      "no-extra-boolean-cast": "off",
    },
  },
]
