import fs from "node:fs";
import path from "node:path";

import { getDirname } from "../utils/file-utils";
import { initDatabase, type InitDatabaseOpts } from "./database";
import { TABLES } from "./schemas";

type Role = { id: number; name: string; description: string };
type User = { id: number; role_id: number; username: string; password: string };

const __dirname = getDirname(import.meta.url);

describe("Database initialization", () => {
  const dbPath = path.join(__dirname, "temp.db");
  const opts: InitDatabaseOpts = {
    filename: dbPath,
    seed: {
      adminUsername: "Admin",
      adminPassword: "Password",
    },
  };

  afterEach(() => {
    if (fs.existsSync(dbPath)) fs.rmSync(dbPath);
  });

  test("Default user and roles are inserted into the database", () => {
    const database = initDatabase(opts);
    const roles = database.prepare(`SELECT * FROM roles;`).all() as Role[];
    const users = database.prepare(`SELECT * FROM users;`).all() as User[];

    expect(roles.length).toBe(2);
    expect(roles.find((role) => role.name === "admin")).toBeDefined();
    expect(roles.find((role) => role.name === "user")).toBeDefined();
    expect(users.length).toBe(1);
    expect(users.find((user) => user.username === opts.seed.adminUsername)).toBeDefined();

    database.close();
  });
  test("Doesn't error when initializing the database multiple times", () => {
    const db1 = initDatabase(opts);
    const db2 = initDatabase(opts);
    const db3 = initDatabase(opts);

    db1.close();
    db2.close();
    db3.close();
  });
  test("Creates all the required tables", () => {
    const database = initDatabase(opts);
    const tables = database
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);

    for (const table of Object.values(TABLES)) {
      expect(names).toContain(table);
    }

    database.close();
  });
});
