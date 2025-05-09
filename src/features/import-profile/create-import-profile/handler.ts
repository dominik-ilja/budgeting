import type { Request, Response } from "express";
import type { ImportProfileRepository } from "../../../repositories/import-profile/repository";
import type { AuthenticatedRequest } from "../../../middlewares/validate-jwt";

export function createCreateImportProfileHandler(repository: ImportProfileRepository) {
  return (req: Request, res: Response) => {
    const _req = req as AuthenticatedRequest;
    const userId = _req.user.id;
    const { targetTableId, name } = req.body;
    repository.create(userId, parseInt(targetTableId), name);

    // create the import profile for the user
    // return the import profile in JSON response
  };
}
