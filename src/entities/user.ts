import type { DbUser } from "../repositories/user/sqlite-repository";

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
