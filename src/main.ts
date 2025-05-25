import { createApp } from "./app/app";
import { env } from "./config/env";
import { initDatabase } from "./database/database";

const database = initDatabase({
  filename: env.DB_PATH,
  seed: {
    adminPassword: env.ADMIN_PASSWORD,
    adminUsername: env.ADMIN_USERNAME,
  },
});

const app = createApp({
  database,
  jwtSecret: env.JWT_SECRET,
});

app.listen(env.PORT, () => {
  console.log(`Server is running on port: ${env.PORT}`);
});
