const express = require("express");
const request = require("supertest");
const { resolve } = require("path");
const { router } = require("./routes");
const { MIME_TYPES } = require("../../constants/mime-types");
const jwt = require("jsonwebtoken");

const app = express();
const ROUTE = "/login";

app.use(express.json());
app.use("/", router);

describe(`route: ${ROUTE}`, () => {
  const req = request(app);

  it("should...", async () => {
    const response = await req
      .post(ROUTE)
      .set("content-type", MIME_TYPES.JSON)
      .send({ username: "username", password: "password" });

    const token = response?.body?.token;

    expect(token).toBeDefined();
    expect(token.split(".").length).toBe(3);
  });
});

it("throw away", async () => {
  const req = request(app);
  const token = jwt.sign({ user_id: 1, role: "admin" }, "SECRET");
  // const response = await req.post("/dummy");
  // const response = await req.post("/dummy").set("authorization", "BEARER bad-token");
  const response = await req.post("/dummy").set("authorization", `BEARER ${token}`);
  // console.log(response.headers);

  expect(response.status).toBe(200);
});
