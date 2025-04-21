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
