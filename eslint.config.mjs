import js from "@eslint/js";
import babelParser from "@babel/eslint-parser";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import security from "eslint-plugin-security";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  allConfig: js.configs.all,
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const babelParserOptions = {
  babelOptions: {
    babelrc: false,
    configFile: false,
    plugins: [
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      "@babel/plugin-syntax-class-properties",
      "@babel/plugin-syntax-jsx",
    ],
  },
  requireConfigFile: false,
};

const browserInjectedGlobals = {
  $: "readonly",
  DataSet: "readonly",
  G2: "readonly",
  IsKnowledgeWhite: "readonly",
  jQuery: "readonly",
  markdown: "readonly",
  qt_type: "writable",
  typeName: "writable",
  upload_file: "writable",
  isYungu: "writable",
};

export default [
  {
    ignores: [
      "build/**",
      "coverage/**",
      "node_modules/**",
      "src/i18n/en.js",
      "src/i18n/zh-CN.js",
    ],
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...browserInjectedGlobals,
      },
      sourceType: "module",
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
          paths: ["src"],
        },
      },
      jest: {
        version: 22,
      },
      react: {
        version: "16.14.0",
      },
    },
  },
  ...compat.extends(
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:jsdoc/recommended-typescript-flavor",
    "plugin:promise/recommended",
    "plugin:regexp/recommended",
    "plugin:sonarjs/recommended",
    "plugin:unicorn/recommended",
    "prettier",
  ),
  security.configs.recommended,
  ...compat
    .extends("plugin:jest/recommended", "plugin:testing-library/react")
    .map((config) => ({
      ...config,
      files: ["src/**/*.test.{js,jsx,ts,tsx}"],
    })),
  {
    files: [
      "*.config.{js,mjs,cjs}",
      "scripts/**/*.{js,mjs,cjs}",
      "build/**/*.{js,mjs,cjs}",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "import/no-unresolved": "off",
    },
  },
  {
    files: ["*.config.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "import/no-unresolved": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      parser: babelParser,
      parserOptions: babelParserOptions,
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "no-unused-vars": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "max-lines": [
        "error",
        { max: 800, skipBlankLines: true, skipComments: true },
      ],
      complexity: ["error", { max: 8 }],
      "simple-import-sort/exports": "error",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^\\u0000"],
            ["^react$", "^@?\\w"],
            ["^(components|utils)(/.*|$)"],
            ["^"],
            ["^\\."],
            ["^.+\\.(css|less)$"],
          ],
        },
      ],
      "unicorn/filename-case": "off",
      "unicorn/no-null": "off",
      "unicorn/no-this-assignment": "off",
      "unicorn/prefer-logical-operator-over-ternary": "off",
      "unicorn/prefer-query-selector": "off",
      "unicorn/prevent-abbreviations": "off",
    },
  },
  {
    files: ["src/**/*.test.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },
  {
    files: ["src/components/ImportPaperUploadModal/**/*.{js,jsx}"],
    rules: {
      "max-lines": [
        "error",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
    },
  },
];
