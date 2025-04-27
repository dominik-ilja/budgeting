const { env } = require("../config/env");
const bcrypt = require("bcrypt");
const betterSQLite = require("better-sqlite3");

// const db = require("better-sqlite3")(env.DB_PATH);
/** @type {import("better-sqlite3").Database | null} */
let db = null;

const TABLES = Object.freeze({
  COLUMN_MAPPINGS: "column_mappings",
  IMPORT_PROFILES: "import_profiles",
  PURCHASES: "purchases",
  ROLES: "roles",
  TARGET_TABLES: "target_tables",
  USERS: "users",
});

function getDatabase() {
  if (!db) {
    db = betterSQLite(env.DB_PATH);
    db.pragma("foreign_keys = 1");
  }
  return db;
}
function resetDatabase() {
  if (db) {
    db.close();
    db = null;
  }
  return getDatabase();
}

function initializeDatabase() {
  const db = getDatabase();

  // Create tables
  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${TABLES.ROLES} (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${TABLES.USERS} (
      id INTEGER PRIMARY KEY,
      role_id INTEGER NOT NULL REFERENCES ${TABLES.ROLES} (id),
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${TABLES.TARGET_TABLES} (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );`
  ).run();

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
      column_name TEXT NOT NULL,
      target_column_name TEXT NOT NULL,
      UNIQUE (import_profile_id, column_name),
      UNIQUE (import_profile_id, target_column_name)
    );`
  ).run();

  // Insert if it doesn't already exist
  const doesAdminRoleExist = db
    .prepare(`SELECT 1 FROM ${TABLES.ROLES} WHERE name = 'admin' `)
    .get();
  const doesUserRoleExist = db
    .prepare(`SELECT 1 FROM ${TABLES.ROLES} WHERE name = 'user' `)
    .get();
  const doesAdminExist = db
    .prepare(`SELECT 1 FROM ${TABLES.USERS} WHERE username = ?`)
    .get(env.ADMIN_USERNAME);
  const doesPurchaseTableExist = db
    .prepare(`SELECT 1 FROM ${TABLES.TARGET_TABLES} WHERE name = 'purchases'`)
    .get();

  if (!doesAdminRoleExist) {
    db.prepare(
      `INSERT INTO ${TABLES.ROLES} (name, description) VALUES
      ('admin', 'Can create users and access their own data');`
    ).run();
  }
  if (!doesUserRoleExist) {
    db.prepare(
      `INSERT INTO ${TABLES.ROLES} (name, description) VALUES
      ('user', 'Default role. It can only read/write their own data');`
    ).run();
  }
  if (!doesAdminExist) {
    db.prepare(
      `INSERT INTO ${TABLES.USERS} (role_id, username, password) VALUES
      (1, @username, @password);`
    ).run({
      username: env.ADMIN_USERNAME,
      password: bcrypt.hashSync(env.ADMIN_PASSWORD, 10),
    });
  }
  if (!doesPurchaseTableExist) {
    db.prepare(`INSERT INTO ${TABLES.TARGET_TABLES} (name) VALUES ('purchases')`).run();
  }

  // sanity check
  console.log(db.prepare(`SELECT * FROM ${TABLES.USERS};`).get());
}

module.exports = { getDatabase, resetDatabase, initializeDatabase };
