import path from "node:path";
import fs from "node:fs";
import { initDatabase, type InitDatabaseOpts } from "./index";
import { getDirname } from "../utils";
import type { Database } from "better-sqlite3";

type Role = { id: number; name: string; description: string };
type User = { id: number; role_id: number; username: string; password: string };

describe("Database initialization", () => {
  let database: Database;
  const dbPath = path.resolve(getDirname(import.meta.url), "temp.db");
  const opts: InitDatabaseOpts = {
    filename: dbPath,
    seed: {
      adminUsername: "Admin",
      adminPassword: "Password",
    },
  };

  beforeEach(() => {
    database = initDatabase(opts);
  });
  afterEach(() => {
    database.close();
    fs.rmSync(dbPath);
  });

  test("Default user and roles are inserted into the database", () => {
    const roles = database.prepare(`SELECT * FROM roles;`).all() as Role[];
    const users = database.prepare(`SELECT * FROM users;`).all() as User[];

    expect(roles.length).toBe(2);
    expect(roles.find((role) => role.name === "admin")).toBeDefined();
    expect(roles.find((role) => role.name === "user")).toBeDefined();
    expect(users.length).toBe(1);
    expect(users.find((user) => user.username === opts.seed.adminUsername)).toBeDefined();
  });
  // test("Doesn't error when creating the database multiple times", () => {
  //   seedInitialData(opts);
  //   seedInitialData(opts);
  //   seedInitialData(opts);
  // });
  // test("Creates all the required tables", () => {
  //   const database = seedInitialData(opts);
  //   const tables = database
  //     .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  //     .all() as { name: string }[];
  //   const names = tables.map((t) => t.name);

  //   for (const table of Object.values(TABLES)) {
  //     expect(names).toContain(table);
  //   }
  // });
});
