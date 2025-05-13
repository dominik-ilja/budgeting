import { ImportProfile } from "../../entities/import-profile";
import { Mapping } from "../../entities/mapping";
import { ImportProfileRepository, CreateResult } from "./repository";
import { TargetTable } from "../../entities/target-table";
import { TABLES } from "../../database/schemas";
import { type Database } from "better-sqlite3";

type QueryEntry = {
  id: number;
  name: string;
  column: string;
  target: string;
  type: "date" | "number" | "string";
};

export class SQLiteImportProfileRepository implements ImportProfileRepository {
  #db;

  constructor(db: Database) {
    this.#db = db;
  }

  all(userId: number): ImportProfile[] {
    try {
      const query = `SELECT
          ip.id,
          ip.name,
          cm.column_name AS column,
          cm.target_column_name AS target,
          cm.data_type AS type
        FROM ${TABLES.IMPORT_PROFILES} ip
        INNER JOIN ${TABLES.TARGET_TABLES} tt ON tt.id = ip.target_table_id
        INNER JOIN ${TABLES.COLUMN_MAPPINGS} cm ON cm.import_profile_id = ip.id
        WHERE ip.user_id = @userId;`;
      const rows = this.#db.prepare(query).all({ userId }) as QueryEntry[];

      if (rows.length === 0) return [];

      const map: Map<number, ImportProfile> = new Map();

      for (const row of rows) {
        const { id, name, column, target, type } = row;
        const mapping = new Mapping(column, target, type);

        const importProfile = map.get(id);
        if (importProfile != null) {
          importProfile.mappings.push(mapping);
        } else {
          const newProfile = new ImportProfile(id, name, [mapping]);
          map.set(id, newProfile);
        }
      }

      return Array.from(map.values());
    } catch (error) {
      console.log(error);
      return [];
    }
  }
  getById(userId: number, importProfileId: number) {
    try {
      const query = `SELECT
          ip.id,
          ip.name,
          cm.column_name AS column,
          cm.target_column_name AS target,
          cm.data_type AS type
        FROM ${TABLES.IMPORT_PROFILES} ip
        INNER JOIN ${TABLES.COLUMN_MAPPINGS} cm ON cm.import_profile_id = ip.id
        WHERE ip.user_id = @userId AND ip.id = @importProfileId`;
      const rows = this.#db
        .prepare(query)
        .all({ userId, importProfileId }) as QueryEntry[];

      if (rows.length === 0) return null;

      const { id, name } = rows[0];
      const importProfile = new ImportProfile(id, name);

      for (const { column, target, type } of rows) {
        const mapping = new Mapping(column, target, type);
        importProfile.mappings.push(mapping);
      }

      return importProfile;
    } catch (error) {
      console.log((error as any)?.message);
      return null;
    }
  }
  getTargetTableById(id: number) {
    try {
      const query = `SELECT * FROM ${TABLES.TARGET_TABLES} WHERE id = @id`;

      type Result = { id: number; name: string } | undefined;
      const result = this.#db.prepare(query).get({ id }) as Result;

      if (!result) return null;

      return new TargetTable(result.id, result.name);
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  create(
    userId: number,
    targetTableId: number,
    name: string,
    mappings: Mapping[]
  ): CreateResult {
    try {
      this.#db.prepare("BEGIN").run();

      const { lastInsertRowid } = this.#db
        .prepare(
          `INSERT INTO ${TABLES.IMPORT_PROFILES} (
          user_id,
          target_table_id,
          name
        ) VALUES (@userId, @targetTableId, @name);`
        )
        .run({ userId, targetTableId, name });

      const insertMappings = this.#db.prepare(`INSERT INTO ${TABLES.COLUMN_MAPPINGS} (
          import_profile_id,
          column_name,
          target_column_name,
          data_type
        ) VALUES (@importProfileId, @column, @target, @type);`);

      for (const mapping of mappings) {
        insertMappings.run({ importProfileId: lastInsertRowid, ...mapping });
      }

      this.#db.prepare("COMMIT").run();

      return {
        isSuccessful: true,
        id: lastInsertRowid,
      };
    } catch (error) {
      console.log(error);

      this.#db.prepare("ROLLBACK").run();

      return {
        isSuccessful: false,
        error: error as Error,
      };
    }
  }
}
