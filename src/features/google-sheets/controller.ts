import { Readable } from "node:stream";

import type { Request, Response } from "express";

import type { ImportProfileRepository } from "../../repositories/import-profile/interface";
import { CsvHeaderNotFoundError } from "./errors";
import { formatRowsAsTsv, parseCsv } from "./service";
import type { ValidatedRequest } from "./validation";

const DEFAULT_ROW_ORDER = { date: 1, description: 2, amount: 3, category: 4 } as const;

export class PostGoogleSheetsController {
  #repo: ImportProfileRepository;

  constructor(repo: ImportProfileRepository) {
    this.#repo = repo;
  }

  async convertCsvToTsv(_req: Request, res: Response) {
    const req = _req as ValidatedRequest;
    const importProfile = this.#repo.getById(req.user.id, req.body.importProfileId);

    if (!importProfile) {
      res.sendStatus(400);
      return;
    }

    try {
      const stream = Readable.from(req.file.buffer);
      const rows = await parseCsv(stream, importProfile.mappings);
      const tsv = formatRowsAsTsv(rows, DEFAULT_ROW_ORDER);
      res.json(tsv);
    } catch (error) {
      if (error instanceof CsvHeaderNotFoundError) {
        res.status(404).json(error.message);
        return;
      }

      res.sendStatus(500);
    }
  }
}
