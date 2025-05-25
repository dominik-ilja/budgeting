import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import type { UserRepository } from "../../repositories/user/interface";

export class SignInController {
  #repo: UserRepository;
  #secret: string;

  constructor(repo: UserRepository, secret: string) {
    this.#repo = repo;
    this.#secret = secret;
  }

  signIn(req: Request, res: Response) {
    const auth = req.headers.authorization;

    if (!auth) {
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
      const user = this.#repo.getByUsername(username);

      if (!user) {
        res.sendStatus(401);
        return;
      }

      const match = bcrypt.compareSync(password, user.password);

      if (!match) {
        res.sendStatus(401);
        return;
      }

      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, this.#secret, { expiresIn: "1h" }); // todo: pass in expiration time

      res.json({ token });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }
}
