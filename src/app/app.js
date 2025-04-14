const express = require("express");
const bcrypt = require("bcrypt");
const { db } = require("../loaders/sqlite");
const { env } = require("../config/env");

async function initializeApp() {
  const app = express();
  app.use(express.json());

  db.prepare(
    `CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL CHECK(username != ''),
  password TEXT NOT NULL CHECK(password != ''),
  role TEXT NOT NULL CHECK(password != '')
);`
  ).run();
  db.prepare(
    `INSERT INTO users (username, password, role)
VALUES (@username, @password, @role)`
  ).run({
    username: env.ADMIN_USERNAME,
    password: bcrypt.hashSync(env.ADMIN_PASSWORD, 10),
    role: "admin",
  });

  console.log(db.prepare("SELECT * FROM users;").get());

  // attach various middlewares, routes, etc.

  app.listen(env.PORT, () => {
    console.log(`Server is running on port: ${env.PORT}`);
  });
}

module.exports = { app: initializeApp() };
