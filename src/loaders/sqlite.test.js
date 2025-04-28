const { env } = require("../config/env");
const { getDatabase, resetDatabase, initializeDatabase, TABLES } = require("./sqlite");

describe("Database initialization", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("should create a default user and roles", () => {
    const db = getDatabase();

    initializeDatabase();
    const roles = db.prepare(`SELECT * FROM roles;`).all();
    const users = db.prepare(`SELECT * FROM users;`).all();

    expect(roles.length).toBe(2);
    expect(roles.find((role) => role.name === "admin")).toBeDefined();
    expect(roles.find((role) => role.name === "user")).toBeDefined();
    expect(users.length).toBe(1);
    expect(users.find((user) => user.username === env.ADMIN_USERNAME)).toBeDefined();
  });
  it("should not error on multiple initialization calls", () => {
    initializeDatabase();
    initializeDatabase();
    initializeDatabase();
  });
  it("should create all the required tables", () => {
    const db = getDatabase();

    initializeDatabase();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map((table) => table.name);

    for (const tableName of Object.values(TABLES)) {
      expect(tableNames).toContain(tableName);
    }
  });
});
