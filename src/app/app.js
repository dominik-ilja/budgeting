const express = require("express");
const bcrypt = require("bcrypt");
const { initializeDatabase } = require("../loaders/sqlite");
const { env } = require("../config/env");

async function initializeApp() {
  const app = express();
  app.use(express.json());

  initializeDatabase();

  // attach various middlewares, routes, etc.

  app.listen(env.PORT, () => {
    console.log(`Server is running on port: ${env.PORT}`);
  });
}

module.exports = { app: initializeApp() };
