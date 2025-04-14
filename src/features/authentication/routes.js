const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { validateJwt } = require("../../middlewares/auth-middleware");
const { env } = require("../../config/env");

const router = express.Router();

async function getUser(username, password) {
  return { userId: 1, username, password };
}

router.route("/login").post(async (request, response) => {
  console.log(request.ip);

  const body = request.body;
  if (!body || !body.username || !body.password) {
    return response.status(400).send(`"username" and "password" are required`);
  }

  const { username, password } = request.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = await getUser(username, hashedPassword);
  const token = jwt.sign(user, env.JWT.SECRET, { expiresIn: env.JWT.EXPIRES_IN });

  return response.json({ token });
});

router.route("/dummy").post(validateJwt, (req, res) => {
  console.log(req.user);

  return res.sendStatus(200);
});

module.exports = { router };
