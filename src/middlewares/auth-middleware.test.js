const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const { validateJwt } = require("./auth-middleware");
const { env } = require("../config/env");

describe("Authentication middleware: validateJwt", () => {
  const app = express();
  app.use(express.json());
  app.use("/", validateJwt, (req, res) => {
    res.status(200).json({ user: req.user });
  });

  describe("Requests with invalid authorization headers are unauthorized", () => {
    test.each([
      {
        name: "No authorization headers",
        headers: {},
        expected: 'Bearer error="missing_token" error_description="Authentication required. No token was included."',
      },
      {
        name: "No space in token",
        headers: { authorization: "invalid" },
        expected: `Bearer error="invalid_request" error_message="Invalid authorization format. Use 'Bearer <token>'"`,
      },
      {
        name: 'No "Bearer" in token',
        headers: { authorization: "invalid token" },
        expected: `Bearer error="invalid_request" error_message="Invalid authorization format. Use 'Bearer <token>'"`,
      },
      {
        name: "JWT is expired",
        headers: { authorization: `Bearer ${jwt.sign({}, env.JWT_SECRET, { expiresIn: "-1s" })}` },
        expected: `Bearer error="invalid_token" error_description="Token expired"`,
      },
      {
        name: "JWT is invalid",
        headers: { authorization: `Bearer ${jwt.sign({}, "invalid_secret")}` },
        expected: `Bearer error="invalid_token" error_description="Invalid or malformed token"`,
      },
    ])("$name", async ({ expected, headers }) => {
      const req = request(app).get("/");
      Object.entries(headers).forEach(([key, value]) => req.set(key, value));

      const response = await req;

      expect(response.status).toBe(401);
      expect(response.headers["www-authenticate"]).toBe(expected);
    });
  });

  test("Calls the next middleware when the JWT is valid", async () => {
    const token = jwt.sign({ user: "user" }, env.JWT_SECRET, { expiresIn: "1h" });
    const req = request(app).get("/").set("authorization", `Bearer ${token}`);

    const response = await req;

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual(jwt.decode(token));
  });
});
