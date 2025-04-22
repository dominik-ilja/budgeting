const { db, initializeDatabase } = require("./sqlite");

describe("Database initialization", () => {
  it("should create a default user and roles", () => {
    initializeDatabase();

    const roles = db.prepare(`SELECT * FROM roles;`).all();
    const users = db.prepare(`SELECT * FROM users;`).all();

    console.log({ roles, users });

    expect(roles.length).toBe(2);
    expect(users.length).toBe(1);
  });
  it.todo("should create all the required tables");
  it.todo("should not do the initialization if the database file already exists");
});
