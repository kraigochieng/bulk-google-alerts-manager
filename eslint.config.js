import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "src/panel/ui"] },
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: { "@typescript-eslint/explicit-function-return-type": "error" },
  },
  { files: ["eslint.config.js"], ...tseslint.configs.disableTypeChecked },
);
