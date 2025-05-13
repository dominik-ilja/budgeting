import { ImportProfile } from "../../entities/import-profile";
import type { Mapping } from "../../entities/mapping";

export type CreateResult =
  | { isSuccessful: true; id: number | bigint }
  | { isSuccessful: false; error: Error };

export interface ImportProfileRepository {
  all(userId: number): ImportProfile[];
  create(
    userId: number,
    targetTableId: number,
    name: string,
    mappings: Mapping[]
  ): CreateResult;
  getById(userId: number, importProfileId: number): ImportProfile | null;
}
