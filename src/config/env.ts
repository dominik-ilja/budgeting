import { resolve } from "node:path";

import dotenv from "dotenv";
import z from "zod";

import { getDirname } from "../utils/file-utils";

const APP_ENV = process.env.APP_ENV;
const DIRNAME = getDirname(import.meta.url);
const ENVIRONMENTS = ["production", "development", "test"];

let envName = ".env";
let configPath = resolve(DIRNAME, `../../${envName}`);

if (APP_ENV != null && ENVIRONMENTS.includes(APP_ENV)) {
  envName = `.env.${APP_ENV}`;
  configPath = resolve(DIRNAME, `../../${envName}`);
}

const { error } = dotenv.config({ path: configPath });

if (error) throw new Error(`"${envName}" was not found at: "${configPath}"`);

const schema = z.object({
  ADMIN_PASSWORD: z.string().min(20),
  ADMIN_USERNAME: z.string(),
  DB_PATH: z.string(),
  JWT_EXPIRES_IN: z.string(),
  JWT_SECRET: z.string().min(20),
  PORT: z.preprocess((val) => {
    if (typeof val === "string") {
      return parseInt(val, 10);
    }
    return val;
  }, z.number()),
});
const parsedEnv = schema.safeParse(process.env);

if (!parsedEnv.success) {
  const errors = parsedEnv.error.flatten().fieldErrors;

  let errorMessage = `Invalid .env file was used.
The following variables are missing or invalid:\n`;

  Object.entries(errors).forEach(([key, value]) => {
    errorMessage += `- ${key}: ${value}\n`;
  });

  throw new Error(errorMessage);
}

export const env = parsedEnv.data;
