const jwt = require("jsonwebtoken");
const { validateJwt } = require("./auth-middleware");
const { env } = require("../config/env");

describe("Authentication middleware: validateJwt", () => {
  /** @type {import("express").Request} */
  let req;
  /** @type {import("express").Response} */
  let res;
  /** @type {import("express").NextFunction} */
  let next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      setHeader: jest.fn().mockReturnThis(),
      sendStatus: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  it("should return a 401 when no authorization headers are included", () => {
    validateJwt(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "WWW-Authenticate",
      'Bearer error="missing_token" error_description="Authentication required. No token was included."'
    );
    expect(res.sendStatus).toHaveBeenCalledWith(401);
  });
  it("should return a 401 when the authentication header doesn't have two parts", () => {
    req.headers.authorization = "invalid";

    validateJwt(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "WWW-Authenticate",
      'Bearer error="invalid_request" error_message="Invalid authorization format. Use \'Bearer <token>\'"'
    );
  });
  it(`should return a 401 when the authentication header doesn't use "bearer" as the authentication scheme`, () => {
    req.headers.authorization = "invalid token";

    validateJwt(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "WWW-Authenticate",
      'Bearer error="invalid_request" error_message="Invalid authorization format. Use \'Bearer <token>\'"'
    );
    expect(res.sendStatus).toHaveBeenCalledWith(401);
  });
  it("should return a 401 when the bearer token is expired", async () => {
    const token = jwt.sign({}, env.JWT.SECRET, { expiresIn: "1s" });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    req.headers.authorization = `Bearer ${token}`;

    validateJwt(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "WWW-Authenticate",
      `Bearer error="invalid_token" error_description="Token expired"`
    );
    expect(res.sendStatus).toHaveBeenCalledWith(401);
  });
  it("should return a 401 when the bearer token cannot be verified", () => {
    const token = jwt.sign({}, "invalid_secret");
    req.headers.authorization = `Bearer ${token}`;
    validateJwt(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "WWW-Authenticate",
      `Bearer error="invalid_token" error_description="Invalid or malformed token"`
    );
    expect(res.sendStatus).toHaveBeenCalledWith(401);
  });
  it("should call next() with valid token and add user to request", () => {
    const data = { user: "user" };
    const token = jwt.sign(data, env.JWT.SECRET, { expiresIn: "1h" });
    req.headers.authorization = `Bearer ${token}`;

    validateJwt(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(jwt.decode(token));
  });
});
