import type { Database } from "better-sqlite3";
import { initDatabase, MEMORY } from "../../database";
import { ImportProfile } from "../../entities/import-profile";
import { Mapping } from "../../entities/mapping";
import { seedImportProfiles } from "../../testing/database";
import { SQLiteImportProfileRepository } from "./sqlite-repository";
import { TargetTable } from "../../entities/target-table";

// I should write some code that initializes

describe("SQLite Import Profile Repository", () => {
  const importProfiles = [
    new ImportProfile(1, "Chase Checkings", [
      new Mapping("Amount", "amount", "number"),
      new Mapping("Posting Date", "date", "date"),
      new Mapping("Description", "description", "string"),
    ]),
    new ImportProfile(2, "Chase Credit", [
      new Mapping("Amount", "amount", "number"),
      new Mapping("Category", "category", "string"),
      new Mapping("Post Date", "date", "date"),
      new Mapping("Description", "description", "string"),
    ]),
    new ImportProfile(3, "Discover Credit", [
      new Mapping("Amount", "amount", "number"),
      new Mapping("Category", "category", "string"),
      new Mapping("Post Date", "date", "date"),
      new Mapping("Description", "description", "string"),
    ]),
  ];
  let database: Database;
  let repository: SQLiteImportProfileRepository;

  beforeEach(() => {
    database = initDatabase({
      filename: MEMORY,
      seed: {
        adminPassword: "password",
        adminUsername: "admin",
      },
    });
    seedImportProfiles(database);
    repository = new SQLiteImportProfileRepository(database);
  });
  afterEach(() => {
    database.close();
  });

  test.each([
    [1, 1, importProfiles[0]],
    [1, 2, importProfiles[1]],
    [1, 3, importProfiles[2]],
  ])(
    "Gets the correct import profile - userId: %s, importProfileId: %s",
    (userId, importProfileId, expected) => {
      const result = repository.getById(userId, importProfileId);
      expect(result).toEqual(expected);
    }
  );
  test.each([
    [100, 1],
    [1, 4],
    [2, 0],
  ])(
    "Returns null for not found import profiles - userId: %s, importProfileId: %s",
    (userId, importProfileId) => {
      const result = repository.getById(userId, importProfileId);
      expect(result).toEqual(null);
    }
  );

  test("Gets all the import profiles for the user", () => {
    const expected = importProfiles;

    const result = repository.all(1);

    expect(result).toEqual(expected);
  });

  test("Gets the correct target table", () => {
    const expected = new TargetTable(1, "purchases");

    const result = repository.getTargetTableById(1);

    expect(result).toEqual(expected);
  });

  test("Creates a new import profile", () => {
    const mappings = [
      new Mapping("column1", "target1", "string"),
      new Mapping("column2", "target2", "string"),
      new Mapping("column3", "target3", "string"),
    ];
    const expected = {
      isSuccessful: true,
      id: 4,
    };

    const actual = repository.create(1, 1, "New Import Profile", mappings);
    const profile = repository.getById(1, 4);

    expect(actual).toEqual(expected);
    expect(profile).toEqual(new ImportProfile(4, "New Import Profile", mappings));
  });
});
