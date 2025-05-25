import jwt from "jsonwebtoken";

import { initDatabase, MEMORY } from "../../database/database";
import { SqliteUserRepository } from "../../repositories/user/sqlite-repository";
import { createMockRequest, createMockResponse } from "../../testing/express";
import { SignInController } from "./controller";

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
    const res = createMockResponse({
      json: jest.fn().mockReturnThis(),
      sendStatus: jest.fn().mockReturnThis(),
    });
    const database = initDatabase({
      filename: MEMORY,
      seed: {
        adminPassword: password,
        adminUsername: username,
      },
    });
    const repository = new SqliteUserRepository(database);
    const secret = "secret";
    const controller = new SignInController(repository, secret);

    controller.signIn(req, res);

    const token = (res.json as jest.Mock).mock.calls[0][0].token;
    const data = jwt.decode(token) as jwt.JwtPayload;
    expect(res.json).toHaveBeenCalled();
    expect(data.user).toEqual({ id: 1 });
  });
});
