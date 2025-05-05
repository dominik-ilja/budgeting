const TABLES = Object.freeze({
  COLUMN_MAPPINGS: "column_mappings",
  IMPORT_PROFILES: "import_profiles",
  // PURCHASES: "purchases",
  ROLES: "roles",
  TARGET_TABLES: "target_tables",
  USERS: "users",
});

const CREATE_ROLES_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLES.ROLES} (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);`;

const CREATE_USERS_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLES.USERS} (
  id INTEGER PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES ${TABLES.ROLES} (id),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);`;

const CREATE_TARGET_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLES.TARGET_TABLES} (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);`;

const CREATE_IMPORT_PROFILE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLES.IMPORT_PROFILES} (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES ${TABLES.USERS} (id),
  target_table_id INTEGER NOT NULL REFERENCES ${TABLES.TARGET_TABLES} (id),
  name TEXT NOT NULL
);`;

const CREATE_COLUMN_MAPPINGS_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLES.COLUMN_MAPPINGS} (
  id INTEGER PRIMARY KEY,
  import_profile_id INTEGER NOT NULL REFERENCES ${TABLES.IMPORT_PROFILES} (id),
  column_name TEXT NOT NULL,
  target_column_name TEXT NOT NULL,
  data_type TEXT NOT NULL,
  UNIQUE (import_profile_id, column_name),
  UNIQUE (import_profile_id, target_column_name)
);`;

const SCHEMAS = Object.freeze({
  CREATE_COLUMN_MAPPINGS_TABLE,
  CREATE_IMPORT_PROFILE_TABLE,
  CREATE_ROLES_TABLE,
  CREATE_TARGET_TABLE,
  CREATE_USERS_TABLE,
});

/**
 * @param {import("better-sqlite3").Database} database
 */
function initializeTables(database) {
  for (const schema of Object.values(SCHEMAS)) {
    database.prepare(schema).run();
  }
}

module.exports = {
  SCHEMAS,
  TABLES,
  initializeTables,
};
