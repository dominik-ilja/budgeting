const express = require("express");
const request = require("supertest");
const { resolve } = require("path");
const { router } = require("./routes");

const ROUTE = "/upload";
const FIXTURES_PATH = resolve(__dirname, "./__fixtures__");

const app = express();
app.use(ROUTE, router);

describe(`route: ${ROUTE}`, () => {
  const req = request(app);
  const attachmentName = "file";
  const fieldName = "mapping";

  it("should return a 400 status with message when no file is included", async () => {
    const response = await req.post(ROUTE);

    expect(response.status).toBe(400);
    expect(response.text).toBe("No CSV file was included");
  });
  it("should return a 400 status with message when the file is not a CSV", async () => {
    const response = await req
      .post(ROUTE)
      .attach(attachmentName, `${FIXTURES_PATH}/bad-file.txt`);

    expect(response.status).toBe(400);
    expect(response.text).toBe("No CSV file was included");
  });
  it(`should return a 400 status with message when no "${fieldName}" is included`, async () => {
    const response = await req
      .post(ROUTE)
      .attach(attachmentName, `${FIXTURES_PATH}/chase-checkings.csv`);

    expect(response.status).toBe(400);
    expect(response.text).toBe(`No CSV "${fieldName}" was included`);
  });
  it("Parses the CSV file and returns the correct output", async () => {
    const response = await req
      .post(ROUTE)
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
