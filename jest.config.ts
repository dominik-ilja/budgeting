import type { Config } from "jest";
import { ESM_TS_TRANSFORM_PATTERN, TS_EXT_TO_TREAT_AS_ESM } from "ts-jest";

const config: Config = {
  extensionsToTreatAsEsm: [...TS_EXT_TO_TREAT_AS_ESM],
  transform: {
    [ESM_TS_TRANSFORM_PATTERN]: [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  setupFiles: ["./src/testing/jest-setup.ts"],
  clearMocks: true,
  preset: "ts-jest",
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/.temp/"],
} satisfies Config;

export default config;
