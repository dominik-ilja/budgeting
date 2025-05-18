import type { Request, Response } from "express";
import type { ImportProfileRepository } from "../../repositories/import-profile/repository";
import type { ValidatedRequest } from "./validate-request";
import { CsvHeaderNotFoundError, parseCsv } from "./parse-csv";
import { Readable } from "node:stream";
import { formatRowsAsTsv } from "./tsv-formatter";

const rowOrder = { date: 1, description: 2, amount: 3, category: 4 };

export function createCsvToGoogleSheetsHandler(repository: ImportProfileRepository) {
  return async (req: Request, res: Response) => {
    const _req = req as ValidatedRequest; // todo: fix types like id and body showing as any
    const importProfile = repository.getById(_req.user.id, _req.body.importProfileId);

    if (!importProfile) {
      res.sendStatus(400);
      return;
    }

    try {
      const stream = Readable.from(_req.file.buffer);
      const rows = await parseCsv(stream, importProfile.mappings);
      const googleSheets = formatRowsAsTsv(rows, rowOrder);
      res.send(googleSheets);
    } catch (error) {
      if (error instanceof CsvHeaderNotFoundError) {
        res.status(404).send(error.message);
        return;
      }

      res.sendStatus(500);
    }
  };
}
