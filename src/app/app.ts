import express from "express";
import { createGetImportProfileHandler } from "../features/import-profile/get-import-profile/handler";
import { SQLiteImportProfileRepository } from "../repositories/import-profile/sqlite-repository";
import { createValidateJwt } from "../middlewares/validate-jwt";
import type { Database } from "better-sqlite3";
import { createPostImportProfileHandler } from "../features/import-profile/create-import-profile/handler";
import { validateRequest } from "../features/google-sheets/validate-request";
import { createCsvToGoogleSheetsHandler } from "../features/google-sheets/handler";
import multer from "multer";

export type Config = {
  database: Database;
  jwtSecret: string;
};

export function createApp(config: Config) {
  const importProfileRepo = new SQLiteImportProfileRepository(config.database);
  const validateJwt = createValidateJwt(config.jwtSecret);
  const getImportProfileHandler = createGetImportProfileHandler(importProfileRepo);
  const postImportProfileHandler = createPostImportProfileHandler(importProfileRepo);
  const googleSheetsHandler = createCsvToGoogleSheetsHandler(importProfileRepo);
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

  return app;
}
