const fs = require("node:fs");
const { Readable } = require("node:stream");
const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { MIME_TYPES } = require("../../constants/mime-types");
const { parseTransactionsCSV } = require("./parse-transactions-csv");
const { validateJwt } = require("../../middlewares/auth-middleware");
const { z } = require("zod");
const { db } = require("../../loaders/sqlite");
const csv = require("csv-parser");

const router = express.Router();

// todo - replace with call to database
const MAPPINGS = {
  CHASE_CHECKINGS: {
    amount: "Amount",
    category: null,
    date: "Posting Date",
    description: "Description",
  },
  CHASE_CREDIT: {
    amount: "Amount",
    category: "Category",
    date: "Post Date",
    description: "Description",
  },
  DISCOVER: {
    amount: "Amount",
    category: "Category",
    date: "Post Date",
    description: "Description",
  },
};

// todo - replace with call to database
function getMapping(userId, mappingId) {
  return MAPPINGS.CHASE_CHECKINGS;
}

function validateFile(request, response, next) {
  if (request.file == null || request.file.mimetype !== MIME_TYPES.CSV) {
    return response.status(400).send("No CSV file was included");
  }
  if (request.body.mapping == null) {
    return response.status(400).send('No CSV "mapping" was included');
  }

  next();
}

// user should be able to create mapping / import profile all at once

router
  .route("/")
  .post(validateJwt, upload.single("file"), validateFile, (request, response) => {
    // todo - retrieve corresponding user mapping - hard coded for now
    const mapping = getMapping();
    const parsed = parseTransactionsCSV(request.file.buffer.toString(), mapping);
    response.status(200).send(parsed);
  });

router.route("/create-mapping").post(validateJwt, (request, response) => {
  const body = request.body;

  // request body needs to contain the name of the mapping and the required fields for purchases
  const schema = z.object({
    mappingName: z.string(),
    amount: z.string(),
    category: z.string().optional(),
    date: z.string(),
    description: z.string(),
  });

  const results = schema.safeParse(body);

  if (!results.success) {
    console.log(results.error.errors);
    return response.sendStatus(400);
  }

  const user = request.user;
  const { mappingName, amount, category, date, description } = results.data;

  try {
    const info = db
      .prepare(
        `INSERT INTO import_profiles (name, target_table_id, user_id) VALUES
(@name, 1, @userID);`
      )
      .run({
        name: mappingName,
        userID: user.id,
      });

    console.log(info);
    console.log(db.prepare(`SELECT * FROM import_profiles;`).get());

    // if category is undefined or null don't create the mapping
    // if it is a string, then create the mapping

    console.log(db.prepare(`SELECT * FROM column_mappings;`).all());
    db.prepare(
      `INSERT INTO column_mappings (
    column_name,
    import_profile_id,
    target_column_name
  ) VALUES
  (@amount, @importProfileID, 'amount'),
  (@date, @importProfileID, 'date'),
  ${category != null ? "(@category, @importProfileID, 'category'),\n" : ""}
  (@description, @importProfileID, 'description');`
    ).run({
      amount,
      category,
      date,
      description,
      importProfileID: info.lastInsertRowid,
    });
    console.log(db.prepare(`SELECT * FROM column_mappings;`).all());
  } catch (error) {
    console.log(error);
    return response.sendStatus(400);
  }

  // create the entry

  response.sendStatus(200);
});

function parseCsv(file, cb) {
  const entries = [];
  const stream = Readable.from([file]);

  return new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on("data", (data) => entries.push(cb(data)))
      .on("error", reject)
      .on("end", () => resolve(entries));
  });
}

router
  .route("/google-sheets")
  .post(validateJwt, upload.single("file"), validateFile, async (request, response) => {
    const mapping = JSON.parse(request.body.mapping);
    const file = request.file;
    const rows = await parseCsv(file.buffer, (row) => ({
      date: row[mapping.date],
      description: row[mapping.description],
      amount: row[mapping.amount] * -1,
      category: row[mapping.category] ?? "",
    }));
    const result = rows.map((row) => Object.values(row).join("\t")).join("\n");

    response.status(200).send(result);
  });

module.exports = { router };
