import fs from "node:fs";
import path from "node:path";

import { jest } from "@jest/globals";
import type { Database } from "better-sqlite3";
import betterSqlite3 from "better-sqlite3";
import type { Response } from "express";

import { createTables } from "../../../database/database";
import { SCHEMAS, TABLES } from "../../../database/schemas";
import { ImportProfile } from "../../../entities/import-profile";
import { Mapping } from "../../../entities/mapping";
import { SqliteImportProfileRepository } from "../../../repositories/import-profile/sqlite-repository";
import { createMockRequest, createMockResponse } from "../../../testing/express";
import { getDirname } from "../../../utils/file-utils";
import { createGetImportProfileHandler } from "./handler";

const __dirname = getDirname(import.meta.url);

function setupDatabase(db: Database) {
  createTables(db, SCHEMAS);
  db.prepare(`INSERT INTO ${TABLES.ROLES} (name) VALUES ('admin');`).run();
  db.prepare(
    `INSERT INTO ${TABLES.USERS} (role_id, username, password)
        VALUES (1, 'username', '123abc');`
  ).run();
  db.prepare(`INSERT INTO ${TABLES.TARGET_TABLES} (name) VALUES ('purchases');`).run();
  db.prepare(
    `INSERT INTO ${TABLES.IMPORT_PROFILES} (user_id, target_table_id, name) VALUES
    (1, 1, 'Chase Checkings'),
    (1, 1, 'Chase Credit'),
    (1, 1, 'Discover Credit');`
  ).run();
  db.prepare(
    `INSERT INTO ${TABLES.COLUMN_MAPPINGS}
    (
      import_profile_id,
      column_name,
      target_column_name,
      data_type
    ) VALUES
    (1, 'Amount', 'amount', 'number'),
    (1, 'Posting Date', 'date', 'date'),
    (1, 'Description', 'description', 'string'),
    (2, 'Amount', 'amount', 'number'),
    (2, 'Category', 'category', 'string'),
    (2, 'Post Date', 'date', 'date'),
    (2, 'Description', 'description', 'string'),
    (3, 'Amount', 'amount', 'number'),
    (3, 'Category', 'category', 'string'),
    (3, 'Post Date', 'date', 'date'),
    (3, 'Description', 'description', 'string')
    ;`
  ).run();
}

describe("get-import-profile-handler", () => {
  const databasePath = path.resolve(__dirname, "database.db");
  let database: Database;
  let repository: SqliteImportProfileRepository;
  let res: Response;

  beforeEach(() => {
    database = betterSqlite3(databasePath);
    repository = new SqliteImportProfileRepository(database);
    res = createMockResponse({
      sendStatus: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    });
    setupDatabase(database);
  });
  afterEach(() => {
    database.close();
    fs.rmSync(databasePath);
  });

  test.each([
    [
      1,
      "1",
      new ImportProfile(1, "Chase Checkings", [
        new Mapping("Amount", "amount", "number"),
        new Mapping("Posting Date", "date", "date"),
        new Mapping("Description", "description", "string"),
      ]),
    ],
    [
      1,
      "2",
      new ImportProfile(2, "Chase Credit", [
        new Mapping("Amount", "amount", "number"),
        new Mapping("Category", "category", "string"),
        new Mapping("Post Date", "date", "date"),
        new Mapping("Description", "description", "string"),
      ]),
    ],
    [
      1,
      "3",
      new ImportProfile(3, "Discover Credit", [
        new Mapping("Amount", "amount", "number"),
        new Mapping("Category", "category", "string"),
        new Mapping("Post Date", "date", "date"),
        new Mapping("Description", "description", "string"),
      ]),
    ],
  ])(
    "Returns the correct import profile - userId: %s, importProfileId: %s",
    (userId, importProfileId, expected) => {
      const handler = createGetImportProfileHandler(repository);
      const req = createMockRequest({
        user: { id: userId },
        params: { id: importProfileId },
      });

      handler(req, res);

      expect(res.json).toHaveBeenCalledWith(expected);
    }
  );

  test.each([
    [100, "1"],
    [1, "100"],
  ])(
    "Returns a 404 when the importProfile doesn't exist - userId: %s, importProfileId: %s",
    (userId, importProfileId) => {
      const handler = createGetImportProfileHandler(repository);
      const req = createMockRequest({
        user: { id: userId },
        params: { id: importProfileId },
      });

      handler(req, res);

      expect(res.sendStatus).toHaveBeenCalledWith(404);
    }
  );
});
