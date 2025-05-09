import type { Request, Response } from "express";
import type { ImportProfileRepository } from "../../../repositories/import-profile/repository";

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
  };
}

export function createGetImportProfileHandler(repository: ImportProfileRepository) {
  return (req: Request, res: Response) => {
    const _req = req as AuthenticatedRequest;
    const userId = _req.user.id;
    const importProfileId = parseInt(_req.params.id);
    const importProfile = repository.getById(userId, importProfileId);

    if (!importProfile) {
      res.sendStatus(404);
      return;
    }

    res.json(importProfile);
  };
}
