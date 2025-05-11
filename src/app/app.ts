import express from "express";
import { createGetImportProfileHandler } from "../features/import-profile/get-import-profile/handler";
import { SQLiteImportProfileRepository } from "../repositories/import-profile/sqlite-repository";
import { createValidateJwt } from "../middlewares/validate-jwt";
import type { Database } from "better-sqlite3";

export type Config = {
  database: Database;
  jwtSecret: string;
};

export function createApp(config: Config) {
  const importProfileRepo = new SQLiteImportProfileRepository(config.database);
  const validateJwt = createValidateJwt(config.jwtSecret);
  const getImportProfileHandler = createGetImportProfileHandler(importProfileRepo);

  const app = express();
  app.use(express.json());

  app.get("/", (_, res) => {
    res.send("Hello, world!");
  });
  app.get("/import-profile/:id", validateJwt, getImportProfileHandler);

  return app;
}
