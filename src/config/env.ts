import { resolve } from "node:path";

import dotenv from "dotenv";
import z from "zod";

import { getDirname } from "../utils";

const APP_ENV = process.env.APP_ENV;

const __dirname = getDirname(import.meta.url);
let envName = ".env";
let configPath = resolve(__dirname, `../../${envName}`);

if (APP_ENV != null && ["production", "development", "test"].includes(APP_ENV)) {
  envName = `.env.${APP_ENV}`;
  configPath = resolve(__dirname, `../../${envName}`);
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
