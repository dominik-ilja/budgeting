const express = require("express");
const { validateJwt } = require("../../middlewares/auth-middleware");
const { z } = require("zod");
const multer = require("multer");
const { Readable } = require("stream");
const csv = require("csv-parser");
const { getDatabase } = require("../../loaders/sqlite");
const { TABLES } = require("../../database/schemas");

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// this route is for creating a csv mapping for a user
// 1. verify that the jwt is valid
// 2. verify that the correct information is in the jwt
// 2. verify that the request is formatted correctly
// 3. try to create the new mapping in the database - whole thing should fail if one entry fails
// 4. Returns the created mapping to the database

// With this route, you can upload a CSV file and the ID to the import profile you'd like to use. The CSV file is updated then returned
// 1. verify the JWT
// 2. verify the request is valid
// 3. ~~check the CSV file for viruses~~
// 4. parse the CSV
// 5. return the result to the user

/**
 * @description Validates if a request has the required attributes for processing a CSV file.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
function validateRequest(req, res, next) {
  if (!req.file || req.file.mimetype !== "text/csv") {
    return res.status(400).send("CSV file is required");
  }

  const importId = req.body.importProfileId;
  const schema = z.number().min(0);
  const validationResult = schema.safeParse(importId);

  if (!validationResult.success) {
    return res.status(400).send(`Invalid importProfileId: "${importId}"`);
  }

  next();
}

/**
 * @param {string} str
 */
function formatNumber(str) {
  let num = parseFloat(str);

  if (Number.isNaN(num)) {
    const msg = `The string "${str}" could not be converted to a number`;
    throw new Error(msg);
  }

  num = Math.abs(num);

  const value = num.toFixed(2);
  const parts = value.split(".");
  const decimal = parts[1];

  if (!decimal) {
    return value + ".00";
  }
  if (decimal.length === 1) {
    return value + "0";
  }
  return value;
}

/**
 * @param {Readable} stream
 * @param {{ column: string, target: string, type: "date" | "number" | "string" }[]} mappings
 * @throws
 */
async function parseCSV(stream, mappings) {
  return new Promise((resolve, reject) => {
    const rows = [];

    const parser = csv()
      .on("headers", (headers) => {
        const notFound = mappings.filter(({ column }) => !headers.includes(column));

        if (notFound.length > 0) {
          const items = notFound.map((e) => e.column).join(", ");
          const msg = `Headers not found in file: "${items}"`;
          parser.destroy(new Error(msg));
        }
      })
      .on("data", (row) => {
        const entry = {};
        for (const { column, target, type } of mappings) {
          let value = row[column];

          if (type === "number") value = formatNumber(value);

          entry[target] = value;
        }
        rows.push(entry);
      })
      .on("error", (error) => {
        stream.destroy();
        reject(error);
      })
      .on("end", () => resolve(rows));

    stream.pipe(parser);
  });
}

/**
 * @param {{[key: string]: string}[]} rows
 */
function createGoogleSheetsCSV(rows) {
  return rows.map((row) => Object.values(row).join("\t")).join("\n");
}

function getMappings(userId, importProfileId) {
  const db = getDatabase();
  try {
    const rows = db
      .prepare(
        `SELECT * FROM import_profiles ip
       INNER JOIN target_tables tt ON tt.id = ip.target_table_id
       INNER JOIN column_mappings cm ON cm.import_profile_id = ip.id
       WHERE ip.id = @userId`
      )
      .get({
        userId,
        importProfileId,
      });
  } catch (e) {
    console.log(e);
  }
}

class Mapping {
  /**
   * @param {string} column
   * @param {string} target
   * @param {"date" | "number" | "string"} type
   */
  constructor(column, target, type) {
    this.column = column;
    this.target = target;
    this.type = type;
  }
}
class ImportProfile {
  /**
   * @param {number} id
   * @param {string} name
   * @param {Mapping[]} mappings
   */
  constructor(id, name, mappings) {
    this.id = id;
    this.name = name;
    this.mappings = mappings ?? [];
  }
}

class ImportProfileRepository {
  all(userId) {
    throw new Error("Method not implemented");
  }
  getById(userId, importProfileId) {
    throw new Error("Method not implemented");
  }
}

class SQLiteImportProfileRepository extends ImportProfileRepository {
  #db;

  /**@param {import("better-sqlite3").Database} db */
  constructor(db) {
    super();
    this.#db = db;
  }

  getById(userId, importProfileId) {
    const query = `SELECT
        ip.id,
        ip.name,
        cm.column_name AS column,
        cm.target_column_name AS target,
        cm.data_type AS type
      FROM ${TABLES.IMPORT_PROFILES} ip
      INNER JOIN ${TABLES.TARGET_TABLES} tt ON tt.id = ip.target_table_id
      INNER JOIN ${TABLES.COLUMN_MAPPINGS} cm ON cm.import_profile_id = ip.id
      WHERE ip.user_id = @userId AND ip.id = @importProfileId`;
    const rows = this.#db.prepare(query).all({ userId, importProfileId });

    console.log(rows);

    if (rows.length === 0) return null;

    const { id, name } = rows[0];
    const importProfile = new ImportProfile(id, name);

    for (const { column, target, type } of rows) {
      importProfile.mappings.push(new Mapping(column, target, type));
    }

    return importProfile;
  }

  all(userId) {
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
    const rows = this.#db.prepare(query).all({ userId });

    console.log(rows);

    if (rows.length === 0) return [];

    // we need to group the import profile ids together

    /** @type {Map<number, ImportProfile>} */
    const map = new Map();

    for (const row of rows) {
      const { id, name, column, target, type } = row;
      const mapping = new Mapping(column, target, type);

      if (map.has(id)) {
        const importProfile = map.get(id);
        importProfile.mappings.push(mapping);
      } else {
        const importProfile = new ImportProfile(id, name, [mapping]);
        map.set(id, importProfile);
      }
    }

    return Array.from(map.values());
  }
}

function createRouteHandler(repository) {
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  return async (req, res) => {
    const userId = req.user.id;
    const profileId = req.body.importProfileId;
    const importProfile = repository.getById(userId, profileId);

    const stream = Readable.from(req.file.buffer);
    const rows = await parseCSV(stream, importProfile.mappings);
    const csv = createGoogleSheetsCSV(rows);

    res.send(csv);
  };
}

router
  .route("/")
  .post(
    validateJwt,
    upload.single("file"),
    validateRequest,
    createRouteHandler(new SQLiteImportProfileRepository(db))
  );

module.exports = {
  createGoogleSheetsCSV,
  createRouteHandler,
  formatNumber,
  ImportProfile,
  Mapping,
  parseCSV,
  router,
  SQLiteImportProfileRepository,
};
