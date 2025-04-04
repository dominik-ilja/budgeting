const { app } = require("./app.js");
const request = require("supertest");
const TestAgent = require("supertest/lib/agent.js");

test("route: /", async () => {
  const response = await request(app).get("/");

  expect(response.text).toBe("Hello, world!");
});

describe("route: /upload", () => {
  /** @type {TestAgent} */
  let req;

  beforeEach(() => {
    req = request(app);
  });

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
