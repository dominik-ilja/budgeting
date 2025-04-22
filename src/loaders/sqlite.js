const { env } = require("../config/env");
const bcrypt = require("bcrypt");

const db = require("better-sqlite3")(env.DB_PATH);

const TABLES = Object.freeze({
  COLUMN_MAPPINGS: "column_mappings",
  IMPORT_PROFILES: "import_profiles",
  PURCHASES: "purchases",
  ROLES: "roles",
  TARGET_TABLES: "target_tables",
  USERS: "users",
});

function initializeDatabase() {
  db.pragma("foreign_keys = 1");

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${TABLES.ROLES} (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );`
  ).run();
  db.prepare(
    `INSERT INTO ${TABLES.ROLES} (name, description) VALUES
      ('admin', 'Can create users and access their own data'),
      ('user', 'Default role. It can only read/write their own data')
    ;`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${TABLES.USERS} (
      id INTEGER PRIMARY KEY,
      role_id INTEGER NOT NULL REFERENCES roles (id),
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );`
  ).run();
  db.prepare(
    `INSERT INTO ${TABLES.USERS} (role_id, username, password) VALUES
    (1, @username, @password);`
  ).run({
    username: env.ADMIN_USERNAME,
    password: bcrypt.hashSync(env.ADMIN_PASSWORD, 10),
  });

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${TABLES.TARGET_TABLES} (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );`
  ).run();
  db.prepare(`INSERT INTO ${TABLES.TARGET_TABLES} (name) VALUES ('${TABLES.PURCHASES}')`);

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${TABLES.IMPORT_PROFILES} (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES ${TABLES.USERS} (id),
      target_table_id INTEGER NOT NULL REFERENCES ${TABLES.TARGET_TABLES} (id),
      name TEXT NOT NULL
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${TABLES.COLUMN_MAPPINGS} (
      id INTEGER PRIMARY KEY,
      import_profile_id INTEGER NOT NULL REFERENCES ${TABLES.IMPORT_PROFILES} (id),
      csv_column_name TEXT NOT NULL,
      target_column_name TEXT NOT NULL,
      UNIQUE(import_profile_id, csv_column_name),
      UNIQUE(import_profile_id, target_column_name)
    );`
  ).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS ${TABLES.PURCHASES} (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES ${TABLES.USERS},
      amount REAL NOT NULL,
      category TEXT,
      description TEXT NOT NULL,
      transaction_date TEXT NOT NULL
    );`);
}

module.exports = { db, initializeDatabase };
