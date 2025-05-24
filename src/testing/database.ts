import type { Database } from "better-sqlite3";

import { TABLES } from "../database/schemas";

/**
 * @description Database tables should be initialized before seeding
 */
export function seedImportProfiles(database: Database) {
  database
    .prepare(
      `INSERT INTO ${TABLES.IMPORT_PROFILES} (user_id, target_table_id, name) VALUES
      (1, 1, 'Chase Checkings'),
      (1, 1, 'Chase Credit'),
      (1, 1, 'Discover Credit');`
    )
    .run();

  database
    .prepare(
      `INSERT INTO ${TABLES.COLUMN_MAPPINGS}
    (
      import_profile_id,
      column_name,
      target_column_name,
      data_type
    ) VALUES
    (1, 'Amount', 'amount', 'number'),
    (1, 'Posting Date', 'date', 'date'),
    (1, 'Description', 'description', 'string'),
    (2, 'Amount', 'amount', 'number'),
    (2, 'Category', 'category', 'string'),
    (2, 'Post Date', 'date', 'date'),
    (2, 'Description', 'description', 'string'),
    (3, 'Amount', 'amount', 'number'),
    (3, 'Category', 'category', 'string'),
    (3, 'Post Date', 'date', 'date'),
    (3, 'Description', 'description', 'string')
    ;`
    )
    .run();
  return database;
}
