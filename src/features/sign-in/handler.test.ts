import { createMockRequest, createMockResponse } from "../../testing/express";
import { handler } from "./handler";

describe("Sign In Handler", () => {
  test("", () => {
    const username = "username";
    const password = "password";
    const credentials = Buffer.from(`${username}:${password}`).toString("base64");
    const req = createMockRequest({
      headers: {
        authorization: `Basic ${credentials}`,
      },
    });
    const res = createMockResponse({});

    console.log(credentials);

    handler(req, res);
  });
});
