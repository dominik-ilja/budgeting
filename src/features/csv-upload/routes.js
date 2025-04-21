const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { MIME_TYPES } = require("../../constants/mime-types");
const { parseTransactionsCSV } = require("./parse-transactions-csv");
const { validateJwt } = require("../../middlewares/auth-middleware");
const { z } = require("zod");

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

// user should be able to create mapping / import profile all at once

router.route("/").post(validateJwt, upload.single("file"), (request, response) => {
  console.log("/");

  if (request.file == null || request.file.mimetype !== MIME_TYPES.CSV) {
    return response.status(400).send("No CSV file was included");
  }
  if (request.body.mapping == null) {
    return response.status(400).send('No CSV "mapping" was included');
  }
  // console.log(request.user);

  // todo - retrieve corresponding user mapping - hard coded for now
  const mapping = getMapping();
  const parsed = parseTransactionsCSV(request.file.buffer.toString(), mapping);
  response.status(200).send(parsed);
});

router.route("/create-mapping").post(validateJwt, (request, response) => {
  const body = request.body;
  console.log({ body });

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

  response.sendStatus(200);
});

module.exports = { router };
