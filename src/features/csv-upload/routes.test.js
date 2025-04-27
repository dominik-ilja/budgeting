const express = require("express");
const request = require("supertest");
const { resolve } = require("path");
const { router } = require("./routes");
const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");

const UPLOAD_ROUTE = "/upload";
const CREATE_MAPPING_ROUTE = "/create-mapping";
const FIXTURES_PATH = resolve(__dirname, "./__fixtures__");

const app = express();
app.use(express.json());
app.use("/", router);

describe(`route: ${UPLOAD_ROUTE}`, () => {
  const user = {
    id: 1,
    username: "user",
    role: "admin",
  };
  const token = jwt.sign(user, env.JWT_SECRET);
  const attachmentName = "file";
  const fieldName = "mapping";
  let req;

  beforeEach(() => {
    req = request(app).post(UPLOAD_ROUTE).set("authorization", `BEARER ${token}`);
  });

  it("should return a 400 status with message when no file is included", async () => {
    const response = await req;

    expect(response.status).toBe(400);
    expect(response.text).toBe("No CSV file was included");
  });
  it("should return a 400 status with message when the file is not a CSV", async () => {
    const response = await req.attach(attachmentName, `${FIXTURES_PATH}/bad-file.txt`);

    expect(response.status).toBe(400);
    expect(response.text).toBe("No CSV file was included");
  });
  it(`should return a 400 status with message when no "${fieldName}" is included`, async () => {
    const response = await req.attach(
      attachmentName,
      `${FIXTURES_PATH}/chase-checkings.csv`
    );

    expect(response.status).toBe(400);
    expect(response.text).toBe(`No CSV "${fieldName}" was included`);
  });
  it("Parses the CSV file and returns the correct output", async () => {
    const response = await req
      .attach(attachmentName, `${FIXTURES_PATH}/chase-checkings.csv`)
      .field(fieldName, "CHASE_CHECKINGS");
    const expected = `2025-03-20\tPaycheck\t1500\t
2025-03-21\tGrocery Store\t75.5\t
2025-03-22\tGas Station\t40\t
2025-03-23\tFreelance Payment\t500\t
2025-03-24\tOnline Subscription\t12.99\t
2025-03-25\tGift\t200\t
2025-03-26\tDining Out\t55\t
2025-03-27\tElectric Bill\t100\t
2025-03-28\tTax Refund\t800\t
2025-03-29\tCar Maintenance\t250\t`;

    expect(response.status).toBe(200);
    expect(response.text).toBe(expected);
  });
});

describe.only(`route: ${CREATE_MAPPING_ROUTE}`, () => {
  const user = {
    id: 1,
    username: "user",
    role: "admin",
  };
  const token = jwt.sign(user, env.JWT_SECRET);
  let req;

  function resetRequest() {
    req = request(app).post(CREATE_MAPPING_ROUTE).set("authorization", `BEARER ${token}`);
    return req;
  }

  beforeEach(() => {
    resetRequest();
  });

  it("should return a 400 when an invalid request is made", async () => {
    const response1 = await req;
    const response2 = await resetRequest().send({ mappingName: "Chase Checkings" });
    const response3 = await resetRequest().send({
      mappingName: "Chase Checkings",
      category: 2,
    });

    expect(response1.status).toBe(400);
    expect(response2.status).toBe(400);
    expect(response3.status).toBe(400);
  });
  it("should create the mapping...", async () => {
    const response1 = await req.send({
      mappingName: "Chase Checkings",
      amount: "Amount",
      date: "Posting Date",
      description: "Description",
    });
    const response2 = await resetRequest().send({
      mappingName: "Chase Credit",
      amount: "Amount",
      category: "Category",
      date: "Post Date",
      description: "Description",
    });

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });
});
