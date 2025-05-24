import betterSqlite, { type Database } from "better-sqlite3";
import { MEMORY } from "../../database";
import { SCHEMAS, TABLES } from "../../database/schemas";
import { SqliteUserRepository } from "./user-repository-sqlite";
import { User } from "../../entities/user";

describe("User Repository SQLite", () => {
  const role = "admin";
  const username = "username";
  const password = "password";
  let db: Database;

  beforeEach(() => {
    db = betterSqlite(MEMORY);
    db.prepare(SCHEMAS.CREATE_ROLES_TABLE).run();
    db.prepare(SCHEMAS.CREATE_USERS_TABLE).run();
    db.prepare(
      `INSERT INTO ${TABLES.ROLES} (name, description)
        VALUES ('${role}', 'admin role');`
    ).run();
    db.prepare(
      `INSERT INTO ${TABLES.USERS} (role_id, username, password)
        VALUES (1, '${username}', '${password}');`
    ).run();
  });

  test("Retrieves the correct user", () => {
    const repository = new SqliteUserRepository(db);
    const expected = new User({ id: 1, password, role, roleId: 1, username });

    const actual = repository.getById(1);

    expect(actual).toEqual(expected);
  });
  test("Retrieves the correct user", () => {
    const repository = new SqliteUserRepository(db);
    const expected = new User({ id: 1, password, role, roleId: 1, username });

    const actual = repository.getByUsername(username);

    expect(actual).toEqual(expected);
  });
});
