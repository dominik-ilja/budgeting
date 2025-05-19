import type { Request, Response } from "express";
import bcrypt from "bcrypt";

export function handler(req: Request, res: Response) {
  // we should receive a username and password that will be compared
  // to what's in the database

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

  // encrypt the password before database lookup
  // this is done to combat a timing attack
  const credentials = Buffer.from(parts[1], "base64").toString().split(":");

  if (credentials.length !== 2) {
    res.sendStatus(401);
    return;
  }

  const username = credentials[0];
  const password = bcrypt.hashSync(credentials[1], 10);

  try {
    // query the database
    console.log({ username, password });
  } catch (error) {
    console.log(error);
  }
}
