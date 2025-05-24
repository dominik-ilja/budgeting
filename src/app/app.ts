import type { Database } from "better-sqlite3";
import express from "express";
import multer from "multer";

import { createCsvToGoogleSheetsHandler } from "../features/google-sheets/handler";
import { validateRequest } from "../features/google-sheets/validate-request";
import { createPostImportProfileHandler } from "../features/import-profile/create-import-profile/handler";
import { createGetImportProfileHandler } from "../features/import-profile/get-import-profile/handler";
import { createHandler } from "../features/sign-in/handler";
import { createValidateJwt } from "../middlewares/validate-jwt";
import { SQLiteImportProfileRepository } from "../repositories/import-profile/sqlite-repository";
import { SqliteUserRepository } from "../repositories/user/user-repository-sqlite";

export type Config = {
  database: Database;
  jwtSecret: string;
};

export function createApp(config: Config) {
  const importProfileRepo = new SQLiteImportProfileRepository(config.database);
  const userRepo = new SqliteUserRepository(config.database);
  const validateJwt = createValidateJwt(config.jwtSecret);
  const getImportProfileHandler = createGetImportProfileHandler(importProfileRepo);
  const postImportProfileHandler = createPostImportProfileHandler(importProfileRepo);
  const googleSheetsHandler = createCsvToGoogleSheetsHandler(importProfileRepo);
  const signInHandler = createHandler(userRepo, config.jwtSecret);
  const upload = multer({ storage: multer.memoryStorage() });

  const app = express();
  app.use(express.json());

  app.get("/", (_, res) => {
    res.send("Hello, world!");
  });
  app.get("/import-profile/:id", validateJwt, getImportProfileHandler);
  app.post("/import-profile", validateJwt, postImportProfileHandler);
  app.post(
    "/google-sheets",
    validateJwt,
    upload.single("file"),
    validateRequest,
    googleSheetsHandler
  );
  app.post("/sign-in", signInHandler);

  return app;
}
