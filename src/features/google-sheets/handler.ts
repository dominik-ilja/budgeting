import { Readable } from "node:stream";

import type { Request, Response } from "express";

import type { ImportProfileRepository } from "../../repositories/import-profile/repository";
import { CsvHeaderNotFoundError } from "./errors";
import { formatRowsAsTsv, parseCsv } from "./service";
import type { ValidatedRequest } from "./validation";

const DEFAULT_ROW_ORDER = { date: 1, description: 2, amount: 3, category: 4 } as const;

export function createHandler(repository: ImportProfileRepository) {
  return async (req: Request, res: Response) => {
    const _req = req as ValidatedRequest;
    const importProfile = repository.getById(_req.user.id, _req.body.importProfileId);

    if (!importProfile) {
      res.sendStatus(400);
      return;
    }

    try {
      const stream = Readable.from(_req.file.buffer);
      const rows = await parseCsv(stream, importProfile.mappings);
      const tsv = formatRowsAsTsv(rows, DEFAULT_ROW_ORDER);
      res.send(tsv);
    } catch (error) {
      if (error instanceof CsvHeaderNotFoundError) {
        res.status(404).send(error.message);
        return;
      }

      res.sendStatus(500);
    }
  };
}
