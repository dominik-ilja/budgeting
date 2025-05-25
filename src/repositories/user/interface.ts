import type { User } from "../../entities/user";

export interface UserRepository {
  getById(id: number): User | null;
  getByUsername(id: string): User | null;
}
