import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import type { UserRepository } from "../../repositories/user/user-repository-interface";

export function createHandler(repository: UserRepository, secret: string) {
  return (req: Request, res: Response) => {
    const auth = req.headers.authorization;

    if (!auth) {
      // todo: be more specific in this
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
      const user = repository.getByUsername(username);

      if (!user) {
        res.sendStatus(401);
        return;
      }

      const passwordsMatch = bcrypt.compareSync(password, user.password);

      if (!passwordsMatch) {
        res.sendStatus(401);
        return;
      }

      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, secret, { expiresIn: "1h" });

      res.send({ token });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  };
}
