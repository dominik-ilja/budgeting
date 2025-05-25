import checkFile from "eslint-plugin-check-file";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Files that shouldn't have their contents linted, but should still have their file names enforced.
  {
    files: ["**/*.{csv,txt}"],
    processor: "check-file/eslint-processor-check-file",
  },

  // File naming enforcement
  {
    files: ["src/**/*"],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        { "**/*.*": "KEBAB_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/no-index": "error",
    },
  },

  // Folder naming enforcement. Exceptions are specified in files config.
  {
    files: ["src/**/!(__fixtures__|__tests__)/*"],
    plugins: { "check-file": checkFile },
    rules: { "check-file/folder-naming-convention": ["error", { "**/*": "KEBAB_CASE" }] },
  },

  // TypeScript linting
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { sourceType: "module" },
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
  },

  // Import and export ordering enforcement
  {
    files: ["**/*.{js,ts}"],
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/exports": "error",
      "simple-import-sort/imports": "error",
    },
  }
);
