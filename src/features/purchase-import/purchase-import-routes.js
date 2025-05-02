const express = require("express");
const { validateJwt } = require("../../middlewares/auth-middleware");
const { z } = require("zod");
const multer = require("multer");
const { Readable } = require("stream");
const csv = require("csv-parser");

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
 * @param {Readable} stream
 * @param {{[key: string]: string}} mapping
 * @throws
 */
async function parseCSV(stream, mapping) {
  const rows = [];

  return new Promise((resolve, reject) => {
    const parser = csv()
      .on("headers", (headers) => {
        const keys = Object.keys(mapping);
        const notFoundKeys = keys.filter((key) => !headers.includes(key));

        if (notFoundKeys.length > 0) {
          parser.destroy(new Error(`Headers not found in file: "${notFoundKeys.join(", ")}"`));
        }
      })
      .on("data", (row) => {
        rows.push(row);
      })
      .on("error", reject)
      .on("end", () => resolve(rows));

    stream.pipe(parser);
  });
}

/**
 * @description
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
function routeHandler(req, res) {
  const stream = Readable.from(req.file.buffer);
  // retrieve the field mappings
  // give the stream and mappings to the CSV parser
}

router.route("/").post(validateJwt, upload.single("file"), validateRequest, routeHandler);

module.exports = { router, parseCSV };
