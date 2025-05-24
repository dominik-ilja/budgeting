import { createMockRequest, createMockResponse } from "../../testing/express";
import { createHandler } from "./handler";
import { initDatabase, MEMORY } from "../../database";
import jwt from "jsonwebtoken";
import { SqliteUserRepository } from "../../repositories/user/user-repository-sqlite";

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
      send: jest.fn().mockReturnThis(),
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
    const handler = createHandler(repository, secret);

    handler(req, res);

    const token = (res.send as jest.Mock).mock.calls[0][0].token;
    const data = jwt.decode(token) as jwt.JwtPayload;
    expect(res.send).toHaveBeenCalled();
    expect(data.user).toEqual({ id: 1 });
  });
});
