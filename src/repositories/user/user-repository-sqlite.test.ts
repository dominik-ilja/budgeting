import betterSqlite from "better-sqlite3";
import { MEMORY } from "../../database";
import { SCHEMAS, TABLES } from "../../database/schemas";
import { SqliteUserRepository, User } from "./user-repository-sqlite";

describe("User Repository SQLite", () => {
  test("Retrieves the correct user", () => {
    const database = betterSqlite(MEMORY);
    database.prepare(SCHEMAS.CREATE_ROLES_TABLE).run();
    database.prepare(SCHEMAS.CREATE_USERS_TABLE).run();
    const role = "admin";
    const username = "username";
    const password = "password";
    database
      .prepare(
        `INSERT INTO ${TABLES.ROLES} (name, description)
        VALUES ('${role}', 'admin role');`
      )
      .run();
    database
      .prepare(
        `INSERT INTO ${TABLES.USERS} (role_id, username, password)
        VALUES (1, '${username}', '${password}');`
      )
      .run();
    const repository = new SqliteUserRepository(database);
    const expected = new User({ id: 1, password, role, roleId: 1, username });

    const actual = repository.getById(1);

    expect(actual).toEqual(expected);
  });
});
