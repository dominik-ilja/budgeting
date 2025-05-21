import type { Database } from "better-sqlite3";
import { UserRepository } from "./user-repository-interface";
import { TABLES } from "../../database/schemas";

type DbUser = {
  id: number;
  username: string;
  password: string;
  roleId: number;
  role: string;
};

export class User {
  id: number;
  username: string;
  password: string;
  roleId: number;
  role: string;

  constructor(dbUser: DbUser) {
    this.id = dbUser.id;
    this.username = dbUser.username;
    this.password = dbUser.password;
    this.roleId = dbUser.roleId;
    this.role = dbUser.role;
  }
}

export class SqliteUserRepository implements UserRepository {
  #db: Database;

  constructor(db: Database) {
    this.#db = db;
  }

  getById(id: number) {
    try {
      const query = `SELECT
        u.id,
        u.username,
        u.password,
        r.id AS roleId,
        r.name AS role
      FROM ${TABLES.USERS} u
      INNER JOIN ${TABLES.ROLES} r ON r.id = u.role_id
      WHERE u.id = @id;`;
      const result = this.#db.prepare(query).get({ id });

      return result as DbUser;
    } catch (error) {
      console.log(error);

      return null;
    }
  }
}
