const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { MIME_TYPES } = require("../constants/mime-types");

const app = express();
app.use(express.json());

const database = [
  {
    username: "username",
    password: "$2b$10$v6zqCAKfQIY/ViOgGmD/UuxJmwyVa0fG6l6YpqBje1/k81iX71jZ.", // password
  },
];

app.get("/", (_, response) => {
  response.send("Hello, world!");
});

app.post("/login", (request, response) => {
  const body = request.body;
  if (!body || !body.username || !body.password) {
    return response.status(400).send(`"username" and "password" are required`);
  }

  console.log(database);
  const { username, password } = request.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = database.find((u) => u.username === username);
  if (!user) return response.status(409).send();

  const isMatch = bcrypt.compareSync(password, hashedPassword);
  if (!isMatch) return response.status(403).send();

  return response.status(200).send();
});

app.post("/register", (request, response) => {
  const body = request.body;
  if (!body || !body.username || !body.password) {
    return response.status(400).send(`"username" and "password" are required`);
  }

  const { username, password } = request.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (database.find((u) => u.username === username)) {
    return response.status(409).send();
  }

  database.push({
    username,
    password: hashedPassword,
  });
  return response.status(200).send();
});

module.exports.app = app;
