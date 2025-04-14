const { env } = require("../config/env");
const db = require("better-sqlite3")(env.DB_PATH);

module.exports = { db };
