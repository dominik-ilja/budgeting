import fs from "node:fs";
import { resolve } from "node:path";

import { initDatabase, MEMORY } from "../../database/database";
import { Mapping } from "../../entities/mapping";
import { SqliteImportProfileRepository } from "../../repositories/import-profile/sqlite-repository";
import { createMockRequest, createMockResponse } from "../../testing/express";
import { getDirname } from "../../utils/file-system";
import { PostGoogleSheetsController } from "./controller";

const __dirname = getDirname(import.meta.url);

describe("Post Google Sheets Controller", () => {
  test("", async () => {
    const req = createMockRequest({
      body: { importProfileId: 1 },
      file: {
        buffer: fs.readFileSync(
          resolve(__dirname, "../../testing/__fixtures__/chase-checkings.csv")
        ),
      },
      user: { id: 1 },
    });
    const res = createMockResponse({
      json: jest.fn().mockReturnThis(),
      sendStatus: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    });
    const database = initDatabase({
      filename: MEMORY,
      seed: {
        adminPassword: "password",
        adminUsername: "admin",
      },
    });
    const repository = new SqliteImportProfileRepository(database);
    repository.create(1, 1, "Chase Checkings", [
      new Mapping("Posting Date", "date", "date"),
      new Mapping("Description", "description", "string"),
      new Mapping("Amount", "amount", "number"),
    ]);
    const controller = new PostGoogleSheetsController(repository);
    const expected = `2025-03-20\tPaycheck\t1500.00
2025-03-21\tGrocery Store\t75.50
2025-03-22\tGas Station\t40.00
2025-03-23\tFreelance Payment\t500.00
2025-03-24\tOnline Subscription\t12.99
2025-03-25\tGift\t200.00
2025-03-26\tDining Out\t55.00
2025-03-27\tElectric Bill\t100.00
2025-03-28\tTax Refund\t800.00
2025-03-29\tCar Maintenance\t250.00`;

    await controller.convertCsvToTsv(req, res);

    expect(res.json).toHaveBeenCalledWith(expected);
  });
});
