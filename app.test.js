const fs = require("node:fs");
const { app } = require("./app.js");
const { MIME_TYPES } = require("./constants/mime-types.js");
const request = require("supertest");
const TestAgent = require("supertest/lib/agent.js");

test("route: /", async () => {
  const response = await request(app).get("/");

  expect(response.text).toBe("Hello, world!");
});

describe("route: /register", () => {
  const req = request(app);

  it("should return a 400 status when either username or password is missing", async () => {
    const response = await req.post("/register");
    expect(response.status).toBe(400);
  });
  it("should return a 409 status code when username is already taken", async () => {
    const response = await req
      .post("/register")
      .set("content-type", MIME_TYPES.JSON)
      .send({ username: "username", password: "password" });
    expect(response.status).toBe(409);
  });
  it("should return a 200 status when username doesn't exist", async () => {
    const response = await req
      .post("/register")
      .send({ username: "username1", password: "password" });
    expect(response.status).toBe(200);
  });
});

describe("route: /login", () => {
  const req = request(app);

  it("should return a 200 status when username and password match entry in database", async () => {
    const credentials = { username: "username1", password: "password" };

    await req.post("/register").set("content-type", MIME_TYPES.JSON).send(credentials);

    const response = await req
      .post("/login")
      .set("content-type", MIME_TYPES.JSON)
      .send(credentials);

    expect(response.status).toBe(200);
  });
});

describe("route: /upload", () => {
  const req = request(app);

  it("should return a 400 status with message when no file is included", async () => {
    const response = await req.post("/upload");

    expect(response.status).toBe(400);
    expect(response.text).toBe("No CSV file was included");
  });
  it("should return a 400 status with message when the file is not a CSV", async () => {
    const response = await req.post("/upload").attach("file", "./test/bad-file.txt");

    expect(response.status).toBe(400);
    expect(response.text).toBe("No CSV file was included");
  });
  it('should return a 400 status with message when no "type" is included', async () => {
    const response = await req
      .post("/upload")
      .attach("file", "./test/chase-checkings.csv");

    expect(response.status).toBe(400);
    expect(response.text).toBe('No CSV "type" was included');
  });
  it("Parses the CSV file and returns the correct JSON", async () => {
    const response = await req
      .post("/upload")
      .attach("file", "./test/chase-checkings.csv")
      .field("type", "CHASE_CHECKINGS");

    const expected = JSON.stringify([
      {
        date: "2025-03-20",
        description: "Paycheck",
        amount: 1500,
        category: null,
      },
    ]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expected);
  });
});
