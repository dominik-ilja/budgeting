import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
  };
}

export function createValidateJwt(secret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = req.headers.authorization;

    if (!auth) {
      res
        .setHeader(
          "WWW-Authenticate",
          'Bearer error="missing_token" error_description="Authentication required. No token was included."'
        )
        .sendStatus(401);
      return;
    }

    const parts = auth.split(" ");

    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      res
        .setHeader(
          "WWW-Authenticate",
          'Bearer error="invalid_request" error_message="Invalid authorization format. Use \'Bearer <token>\'"'
        )
        .sendStatus(401);
      return;
    }

    try {
      const token = parts[1];
      const decoded = jwt.verify(token, secret);

      if (typeof decoded === "string" || typeof decoded.user?.id !== "number") {
        throw new Error('Token does not contain "user.id" property');
      }
      req.user = decoded.user;
      next();
    } catch (error) {
      let err: Error;

      if (error instanceof Error) {
        err = error;
      } else {
        err = new Error(String(error));
      }

      const message =
        err.name === "TokenExpiredError" ? "Token expired" : "Invalid or malformed token";

      res
        .setHeader(
          "WWW-Authenticate",
          `Bearer error="invalid_token" error_description="${message}"`
        )
        .sendStatus(401);
      return;
    }
  };
}
