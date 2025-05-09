const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function createJwtMiddleware(secret) {
  return (req, res, next) => {
    const auth = req.headers.authorization;

    if (!auth) {
      return res
        .setHeader(
          "WWW-Authenticate",
          'Bearer error="missing_token" error_description="Authentication required. No token was included."'
        )
        .sendStatus(401);
    }

    const parts = auth.split(" ");

    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return res
        .setHeader(
          "WWW-Authenticate",
          'Bearer error="invalid_request" error_message="Invalid authorization format. Use \'Bearer <token>\'"'
        )
        .sendStatus(401);
    }

    try {
      const token = parts[1];
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      console.log("User authenticated");
      next();
    } catch (error) {
      const message =
        error.name === "TokenExpiredError"
          ? "Token expired"
          : "Invalid or malformed token";

      return res
        .setHeader(
          "WWW-Authenticate",
          `Bearer error="invalid_token" error_description="${message}"`
        )
        .sendStatus(401);
    }
  };
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateJwt(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth) {
    return res
      .setHeader(
        "WWW-Authenticate",
        'Bearer error="missing_token" error_description="Authentication required. No token was included."'
      )
      .sendStatus(401);
  }

  const parts = auth.split(" ");

  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res
      .setHeader(
        "WWW-Authenticate",
        'Bearer error="invalid_request" error_message="Invalid authorization format. Use \'Bearer <token>\'"'
      )
      .sendStatus(401);
  }

  try {
    const token = parts[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    console.log("User authenticated");
    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError" ? "Token expired" : "Invalid or malformed token";

    return res
      .setHeader(
        "WWW-Authenticate",
        `Bearer error="invalid_token" error_description="${message}"`
      )
      .sendStatus(401);
  }
}

module.exports = {
  validateJwt,
  createJwtMiddleware,
};
