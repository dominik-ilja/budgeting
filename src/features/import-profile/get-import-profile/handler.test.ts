import { createGetImportProfileHandler } from "./handler";
import { SQLiteImportProfileRepository } from "../../../repositories/import-profile/sqlite-repository";
import betterSqlite3 from "better-sqlite3";
import type { Request, Response } from "express";
import type { Database } from "better-sqlite3";
import { initializeTables, TABLES } from "../../../database/schemas";
import { ImportProfile } from "../../../entities/import-profile";
import { Mapping } from "../../../entities/mapping";

function setupDatabase(db: Database) {
  initializeTables(db);
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
function createRequest(userId: number, paramId: string) {
  return {
    user: {
      id: userId,
    },
    params: {
      id: paramId,
    },
  } as unknown as Request;
}
function createResponse() {
  return {
    sendStatus: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe("get-import-profile-handler", () => {
  let database: Database;
  let repository: SQLiteImportProfileRepository;

  beforeEach(() => {
    database = betterSqlite3(":memory:");
    repository = new SQLiteImportProfileRepository(database);
    setupDatabase(database);
  });
  afterEach(() => {
    database.close();
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
      const req = createRequest(userId, importProfileId);
      const res = createResponse();

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
      const req = createRequest(userId, importProfileId);
      const res = createResponse();

      handler(req, res);

      expect(res.sendStatus).toHaveBeenCalledWith(404);
    }
  );
});
