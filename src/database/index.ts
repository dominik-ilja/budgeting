import betterSqlite3 from "better-sqlite3";
import type { Database } from "better-sqlite3";
import { SCHEMAS, TABLES } from "./schemas";
import bcrypt from "bcrypt";

export const MEMORY = ":memory:";

export function createDatabase(filename: string) {
  return betterSqlite3(filename);
}

type Schemas = Record<string, string>;
export function createTables(database: Database, schemas: Schemas) {
  for (const schema of Object.values(schemas)) {
    database.prepare(schema).run();
  }
}

export type SeedDataOpts = {
  adminPassword: string;
  adminUsername: string;
  schemas?: Record<string, string>;
};
export function seedInitialData(
  database: Database,
  { schemas = SCHEMAS, ...opts }: SeedDataOpts
) {
  createTables(database, schemas);

  const doesAdminRoleExist = database
    .prepare(`SELECT 1 FROM ${TABLES.ROLES} WHERE name = 'admin' `)
    .get();
  const doesUserRoleExist = database
    .prepare(`SELECT 1 FROM ${TABLES.ROLES} WHERE name = 'user' `)
    .get();
  const doesAdminExist = database
    .prepare(`SELECT 1 FROM ${TABLES.USERS} WHERE username = ?`)
    .get(opts.adminUsername);
  const doesPurchaseTableExist = database
    .prepare(`SELECT 1 FROM ${TABLES.TARGET_TABLES} WHERE name = 'purchases'`)
    .get();

  if (!doesAdminRoleExist) {
    database
      .prepare(
        `INSERT INTO ${TABLES.ROLES} (name, description) VALUES
        ('admin', 'Can create users and access their own data');`
      )
      .run();
  }
  if (!doesUserRoleExist) {
    database
      .prepare(
        `INSERT INTO ${TABLES.ROLES} (name, description) VALUES
        ('user', 'Default role. It can only read/write their own data');`
      )
      .run();
  }
  if (!doesAdminExist) {
    database
      .prepare(
        `INSERT INTO ${TABLES.USERS} (role_id, username, password) VALUES
        (1, @username, @password);`
      )
      .run({
        username: opts.adminUsername,
        password: bcrypt.hashSync(opts.adminPassword, 10),
      });
  }
  if (!doesPurchaseTableExist) {
    database
      .prepare(`INSERT INTO ${TABLES.TARGET_TABLES} (name) VALUES ('purchases')`)
      .run();
  }

  // if (process.env.APP_ENV === "test") {
  //   console.log(database.prepare(`SELECT * FROM ${TABLES.USERS};`).all());
  // }

  return database;
}

export type InitDatabaseOpts = {
  filename: string;
  seed: SeedDataOpts;
};
export function initDatabase(opts: InitDatabaseOpts) {
  const database = createDatabase(opts.filename);
  seedInitialData(database, opts.seed);
  return database;
}
