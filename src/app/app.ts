import express from "express";
import { createGetImportProfileHandler } from "../features/import-profile/get-import-profile/handler";
import betterSqlite3 from "better-sqlite3";
import { SQLiteImportProfileRepository } from "../repositories/import-profile/sqlite-repository";
import { createValidateJwt } from "../middlewares/validate-jwt";
import { env } from "../config/env";

export function createApp() {
  const database = betterSqlite3(":memory:");
  const importProfileRepo = new SQLiteImportProfileRepository(database);
  const app = express();
  app.use(express.json());

  app.get("/", (_, res) => {
    res.send("Hello, world!");
  });
  app.get(
    "/import-profile/:id",
    createValidateJwt(env.JWT_SECRET),
    createGetImportProfileHandler(importProfileRepo)
  );

  return app;
}
