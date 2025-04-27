const { resolve } = require("node:path");
const dotenv = require("dotenv");
const z = require("zod");

const APP_ENV = process.env.APP_ENV;
let envName = ".env";
let configPath = resolve(__dirname, `../../${envName}`);

if (["production", "development", "test"].includes(APP_ENV)) {
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
  PORT: z.preprocess((val) => parseInt(val, 10), z.number()),
});
const env = process.env;
const parsedEnv = schema.safeParse(env);

if (!parsedEnv.success) {
  const errors = parsedEnv.error.flatten().fieldErrors;

  let errorMessage = `Invalid .env file was used.
The following variables are missing or invalid:\n`;

  Object.entries(errors).forEach(([key, value]) => {
    errorMessage += `- ${key}: ${value}\n`;
  });

  throw new Error(errorMessage);
}

module.exports = { env: parsedEnv.data };
