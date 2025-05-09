import type { Request, Response } from "express";
import type { ImportProfileRepository } from "../../../repositories/import-profile/repository";

export function createCreateImportProfileHandler(repository: ImportProfileRepository) {
  return (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { targetTableId, name } = req.body;
    repository.create(userId, parseInt(targetTableId), name);

    // create the import profile for the user
    // return the import profile in JSON response
  };
}
