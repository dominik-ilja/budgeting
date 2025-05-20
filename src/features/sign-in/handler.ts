import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import type { Database } from "better-sqlite3";
import { TABLES } from "../../database/schemas";
import jwt from "jsonwebtoken";

export function createHandler(database: Database, secret: string) {
  return (req: Request, res: Response) => {
    const auth = req.headers.authorization;

    if (!auth) {
      // be more specific in this
      res.sendStatus(401);
      return;
    }

    const parts = auth.split(" ");

    if (parts.length !== 2 || parts[0].toLowerCase() !== "basic") {
      res.sendStatus(401);
      return;
    }

    const credentials = Buffer.from(parts[1], "base64").toString().split(":");

    if (credentials.length !== 2) {
      res.sendStatus(401);
      return;
    }

    try {
      const [username, password] = credentials;
      const query = `SELECT * FROM ${TABLES.USERS} WHERE username = @username`;
      const result = database.prepare(query).get({ username }) as any;
      const passwordsMatch = bcrypt.compareSync(password, result.password);

      if (!passwordsMatch) {
        res.sendStatus(401);
        return;
      }

      const payload = { user: { id: result.id } };
      const token = jwt.sign(payload, secret, { expiresIn: "1h" });

      res.send({ token });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  };
}
