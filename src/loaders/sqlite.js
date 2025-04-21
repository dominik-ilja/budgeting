const { env } = require("../config/env");
const bcrypt = require("bcrypt");

const db = require("better-sqlite3")(env.DB_PATH);

function initializeDatabase() {
  db.pragma("foreign_keys = 1");
  db.prepare(
    `CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );`
  ).run();
  db.prepare(
    `INSERT INTO roles (name, description) VALUES
      ('admin', 'Can create users and access their own data'),
      ('user', 'Default role. It can only read/write their own data')
    ;`
  ).run();
  db.prepare(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      role_id INTEGER NOT NULL REFERENCES roles (id),
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );`
  ).run();
  db.prepare(
    `INSERT INTO users (role_id, username, password) VALUES
    (1, @username, @password);`
  ).run({
    username: env.ADMIN_USERNAME,
    password: bcrypt.hashSync(env.ADMIN_PASSWORD, 10),
  });

  console.log(db.prepare(`SELECT * FROM users;`).get());
}

initializeDatabase();

module.exports = { db };
