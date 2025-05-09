import express from "express";
import type { NextFunction, Request, Response } from "express";
import type { ImportProfileRepository } from "../../../repositories/import-profile/repository";
import { SQLiteImportProfileRepository } from "../../../repositories/import-profile/sqlite-repository";
import betterSqlite3 from "better-sqlite3";

export function createGetImportProfileHandler(repository: ImportProfileRepository) {
  return (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user.id;
    const importProfileId = parseInt(req.params.id);
    const importProfile = repository.getById(userId, importProfileId);

    if (!importProfile) {
      res.sendStatus(404);
      return;
    }

    res.json(importProfile);
  };
}

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
  };
}

function mid(req: Request, res: Response, next: NextFunction) {
  (req as AuthenticatedRequest).user = { id: 1 };
  next();
}

const app = express();

app.get(
  "/",
  mid,
  createGetImportProfileHandler(
    new SQLiteImportProfileRepository(betterSqlite3(":memory:"))
  )
);
