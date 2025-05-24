import { resolve } from "node:path";

import jwt from "jsonwebtoken";
import request from "supertest";

import { createDatabase, seedInitialData } from "../database/database";
import { TABLES } from "../database/schemas";
import { getDirname } from "../utils/file-system";
import { type Config, createApp } from "./app";

const __dirname = getDirname(import.meta.url);

let config: Config;

beforeEach(() => {
  const database = createDatabase(":memory:");
  seedInitialData(database, { adminPassword: "password", adminUsername: "username" });

  database
    .prepare(
      `INSERT INTO ${TABLES.IMPORT_PROFILES} (user_id, target_table_id, name) VALUES
      (1, 1, 'Chase Checkings');`
    )
    .run();
  database
    .prepare(
      `INSERT INTO ${TABLES.COLUMN_MAPPINGS}
    (
      import_profile_id,
      column_name,
      target_column_name,
      data_type
    ) VALUES
    (1, 'Amount', 'amount', 'number'),
    (1, 'Posting Date', 'date', 'date'),
    (1, 'Description', 'description', 'string');`
    )
    .run();

  config = {
    database,
    jwtSecret: "secret",
  };
});
afterEach(() => {
  config.database.close();
});

test("route: /", async () => {
  const app = createApp(config);

  const response = await request(app).get("/");

  expect(response.text).toBe("Hello, world!");
});

test("route: /import-profile/:id", async () => {
  const app = createApp(config);
  const payload = { user: { id: 1 } };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "1h" });
  const expected = {
    id: 1,
    name: "Chase Checkings",
    mappings: [
      { column: "Amount", target: "amount", type: "number" },
      { column: "Posting Date", target: "date", type: "date" },
      { column: "Description", target: "description", type: "string" },
    ],
  };

  const response = await request(app)
    .get("/import-profile/1")
    .set("authorization", `Bearer ${token}`);

  console.log(response.headers);
  console.log(response.status);

  expect(response.status).toBe(200);
  expect(response.body).toEqual(expected);
});

test("route: /import-profile (post)", async () => {
  const app = createApp(config);
  const payload = { user: { id: 1 } };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "1h" });
  const expected = { id: 2 };

  const response = await request(app)
    .post("/import-profile")
    .set("authorization", `Bearer ${token}`)
    .send({
      targetTableId: 1,
      name: "Chase Checkings",
      mappings: [
        { column: "Amount", target: "amount", type: "number" },
        { column: "Posting Date", target: "date", type: "date" },
        { column: "Description", target: "description", type: "string" },
      ],
    });

  expect(response.status).toBe(201);
  expect(response.body).toEqual(expected);
});

test.only("route: /google-sheets", async () => {
  const app = createApp(config);
  const payload = { user: { id: 1 } };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "1h" });
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

  const response = await request(app)
    .post("/google-sheets")
    .set("authorization", `Bearer ${token}`)
    .field("importProfileId", 1)
    .attach("file", resolve(__dirname, "../testing/__fixtures__/chase-checkings.csv"));

  expect(response.status).toBe(200);
  expect(response.text).toEqual(expected);
});
