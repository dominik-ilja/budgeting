import type { Database } from "better-sqlite3";

import { TABLES } from "../../database/schemas";
import { UserRepository } from "./user-repository-interface";

export type DbUser = {
  id: number;
  username: string;
  password: string;
  roleId: number;
  role: string;
};

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
  getByUsername(username: string) {
    try {
      const query = `SELECT
        u.id,
        u.username,
        u.password,
        r.id AS roleId,
        r.name AS role
      FROM ${TABLES.USERS} u
      INNER JOIN ${TABLES.ROLES} r ON r.id = u.role_id
      WHERE u.username = @username;`;
      const result = this.#db.prepare(query).get({ username });

      return result as DbUser;
    } catch (error) {
      console.log(error);

      return null;
    }
  }
}
