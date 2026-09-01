import type { Config } from "jest";

const swcOptions = {
  jsc: {
    parser: {
      decorators: true,
      syntax: "typescript",
      tsx: true,
    },
    transform: {
      decoratorMetadata: false,
      legacyDecorator: true,
      react: {
        runtime: "automatic",
      },
      useDefineForClassFields: false,
    },
  },
  module: {
    type: "commonjs",
  },
};

const config: Config = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^components/(.*)$": "<rootDir>/src/components/$1",
    "^utils/(.*)$": "<rootDir>/src/utils/$1",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "\\.(bmp|gif|jpg|jpeg|png|svg|webp|woff|woff2|eot|ttf|otf)$":
      "<rootDir>/test/fileMock.js",
  },
  setupFiles: ["<rootDir>/test/setupJest.js"],
  setupFilesAfterEnv: ["<rootDir>/test/setupTestFramework.js"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[cm]?[jt]sx?$": ["@swc/jest", swcOptions],
  },
};

export default config;
