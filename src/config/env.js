const z = require("zod");
const dotenv = require("dotenv");

const { error } = dotenv.config();

if (error) {
  throw new Error(".env file not found");
}

const schema = z.object({
  ADMIN_PASSWORD: z.string().min(20),
  ADMIN_USERNAME: z.string(),
  DB_PATH: z.string(),
  JWT_EXPIRES_IN: z.string(),
  JWT_SECRET: z.string().min(20),
  PORT: z.number(),
});

const env = process.env;
const envConfig = Object.freeze({
  ADMIN_PASSWORD: env["ADMIN_PASSWORD"],
  ADMIN_USERNAME: env["ADMIN_USERNAME"],
  DB_PATH: env["DB_PATH"],
  JWT_EXPIRES_IN: env["JWT_EXPIRES_IN"],
  JWT_SECRET: env["JWT_SECRET"],
  PORT: parseInt(env["PORT"]),
});

const parsedEnv = schema.safeParse(envConfig);
if (!parsedEnv.success) {
  const errors = parsedEnv.error.flatten().fieldErrors;

  let errorMessage = `Invalid .env file was used.
The following variables are missing or invalid:\n`;

  Object.entries(errors).forEach(([key, value]) => {
    errorMessage += `- ${key}: ${value}\n`;
  });

  throw new Error(errorMessage);
}

module.exports = { env: envConfig };
