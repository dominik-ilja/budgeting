const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { MIME_TYPES } = require("../../constants/mime-types");
const { parseTransactionsCSV } = require("./parse-transactions-csv");

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

router.route("/").post(upload.single("file"), (request, response) => {
  if (request.file == null || request.file.mimetype !== MIME_TYPES.CSV) {
    return response.status(400).send("No CSV file was included");
  }
  if (request.body.mapping == null) {
    return response.status(400).send('No CSV "mapping" was included');
  }

  // todo - retrieve corresponding user mapping - hard coded for now
  const mapping = getMapping();
  const parsed = parseTransactionsCSV(request.file.buffer.toString(), mapping);
  response.status(200).send(parsed);
});

module.exports = { router };
