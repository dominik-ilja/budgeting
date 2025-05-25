import type { Database } from "better-sqlite3";
import express from "express";
import multer from "multer";

import { createGoogleSheetsRouter } from "../features/google-sheets/router";
import { createImportProfileRouter } from "../features/import-profile/router";
import { createSignInRouter } from "../features/sign-in/router";
import { createValidateJwt } from "../middlewares/validate-jwt";
import { SqliteImportProfileRepository } from "../repositories/import-profile/sqlite-repository";
import { SqliteUserRepository } from "../repositories/user/sqlite-repository";

export type Config = {
  database: Database;
  jwtSecret: string;
};

export function createApp(config: Config) {
  const importProfileRepo = new SqliteImportProfileRepository(config.database);
  const upload = multer({ storage: multer.memoryStorage() });
  const userRepo = new SqliteUserRepository(config.database);
  const validateJwt = createValidateJwt(config.jwtSecret);

  const googleSheetsRouter = createGoogleSheetsRouter({
    repository: importProfileRepo,
    upload,
    validateJwt,
  });
  const importProfileRouter = createImportProfileRouter({
    repository: importProfileRepo,
    validateJwt,
  });
  const signInRouter = createSignInRouter({
    repository: userRepo,
    secret: config.jwtSecret,
  });

  const app = express();
  app.use(express.json());

  app.get("/", (_, res) => {
    res.json("Hello, world!");
  });

  app.use("/google-sheets", googleSheetsRouter);
  app.use("/import-profile", importProfileRouter);
  app.use("/sign-in", signInRouter);

  return app;
}
