import { createApp, type Config } from "./app";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createDatabase, seedInitialData } from "../database";
import { TABLES } from "../database/schemas";

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
