import { type Database } from "better-sqlite3";
import type { Response } from "express";

import { initDatabase, MEMORY } from "../../../database/database";
import { SQLiteImportProfileRepository } from "../../../repositories/import-profile/sqlite-repository";
import { createMockRequest, createMockResponse } from "../../../testing/express";
import { createPostImportProfileHandler } from "./handler";

describe("post-import-profile-handler", () => {
  let database: Database;
  let repository: SQLiteImportProfileRepository;
  let res: Response;

  beforeEach(() => {
    database = initDatabase({
      filename: MEMORY,
      seed: { adminPassword: "password", adminUsername: "admin" },
    });
    repository = new SQLiteImportProfileRepository(database);
    res = createMockResponse({
      sendStatus: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    });
  });

  afterEach(() => {
    database.close();
  });

  test("Handles valid requests", () => {
    const handler = createPostImportProfileHandler(repository);
    const req = createMockRequest({
      user: {
        id: 1,
      },
      body: {
        targetTableId: "1",
        name: "New Import Profile",
        mappings: [
          { column: "Amount", target: "amount", type: "number" },
          { column: "Category", target: "category", type: "string" },
          { column: "Posting date", target: "date", type: "date" },
          { column: "Description", target: "description", type: "string" },
        ],
      },
    });
    const expected = { id: 1 };

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expected);
  });
});
