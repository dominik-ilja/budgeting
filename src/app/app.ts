import type { Database } from "better-sqlite3";
import express from "express";

import { createGoogleSheetsRouter } from "../features/google-sheets/router";
import { createPostImportProfileHandler } from "../features/import-profile/create-import-profile/handler";
import { createGetImportProfileHandler } from "../features/import-profile/get-import-profile/handler";
import { createHandler } from "../features/sign-in/handler";
import { createValidateJwt } from "../middlewares/validate-jwt";
import { SqliteImportProfileRepository } from "../repositories/import-profile/sqlite-repository";
import { SqliteUserRepository } from "../repositories/user/user-repository-sqlite";

export type Config = {
  database: Database;
  jwtSecret: string;
};

export function createApp(config: Config) {
  const importProfileRepo = new SqliteImportProfileRepository(config.database);
  const userRepo = new SqliteUserRepository(config.database);
  const validateJwt = createValidateJwt(config.jwtSecret);
  const getImportProfileHandler = createGetImportProfileHandler(importProfileRepo);
  const postImportProfileHandler = createPostImportProfileHandler(importProfileRepo);
  const signInHandler = createHandler(userRepo, config.jwtSecret);

  const googleSheetsRouter = createGoogleSheetsRouter(
    config.jwtSecret,
    importProfileRepo
  );

  const app = express();
  app.use(express.json());

  app.get("/", (_, res) => {
    res.send("Hello, world!");
  });
  app.get("/import-profile/:id", validateJwt, getImportProfileHandler);
  app.post("/import-profile", validateJwt, postImportProfileHandler);
  app.use("/google-sheets", googleSheetsRouter);
  app.post("/sign-in", signInHandler);

  return app;
}
