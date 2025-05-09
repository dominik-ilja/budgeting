import type { Request, Response } from "express";
import { createValidateJwt } from "./validate-jwt";
import jwt from "jsonwebtoken";

function createRequest(headers: Partial<Request["headers"]> = {}) {
  return { headers, body: {} } as unknown as Request;
}
function createResponse() {
  return {
    setHeader: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  } as unknown as Response;
}
const JWT_SECRET = "secret";

describe("Validate JWT middleware", () => {
  test.each([
    {
      name: "No authorization headers",
      headers: {},
      expected:
        'Bearer error="missing_token" error_description="Authentication required. No token was included."',
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
      headers: {
        authorization: `Bearer ${jwt.sign({}, JWT_SECRET, { expiresIn: "-1s" })}`,
      },
      expected: `Bearer error="invalid_token" error_description="Token expired"`,
    },
    {
      name: "JWT is invalid",
      headers: { authorization: `Bearer ${jwt.sign({}, "invalid_secret")}` },
      expected: `Bearer error="invalid_token" error_description="Invalid or malformed token"`,
    },
  ])(
    "Requests with invalid authorization headers are unauthorized: $name",
    ({ headers, expected }) => {
      const req = createRequest(headers);
      const res = createResponse();
      const next = jest.fn();
      const validateJwt = createValidateJwt(JWT_SECRET);

      validateJwt(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith("WWW-Authenticate", expected);
      expect(res.sendStatus).toHaveBeenCalledWith(401);
    }
  );

  test("Calls the next middleware when the JWT is valid", async () => {
    const payload = { user: { id: 1 } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    const req = createRequest({ authorization: `Bearer ${token}` });
    const res = createResponse();
    const next = jest.fn();
    const validateJwt = createValidateJwt(JWT_SECRET);

    validateJwt(req, res, next);
    console.log(req);

    expect(req.user).toEqual(payload.user);
    expect(next).toHaveBeenCalled();
  });
});
