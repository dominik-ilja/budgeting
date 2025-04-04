const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { MIME_TYPES } = require("./constants/mime-types");

const app = express();

app.use(express.json());

app.get("/", (_, response) => {
  response.send("Hello, world!");
});

app.post("/register", (request, response) => {
  // we need a username & password
});

app.post("/upload", upload.single("file"), (request, response) => {
  if (request.file == null || request.file.mimetype !== MIME_TYPES.CSV) {
    return response.status(400).send("No CSV file was included");
  }
  if (request.body.type == null) {
    return response.status(400).send('No CSV "type" was included');
  }

  console.log(request.file.buffer.toString());
  console.log(request.body.type);
  response.status(200).send("Looks good to me");
});

module.exports.app = app;
