import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../../../middlewares/validate-jwt";
import type { ImportProfileRepository } from "../../../repositories/import-profile/interface";

export class GetImportProfileController {
  #repo: ImportProfileRepository;

  constructor(repo: ImportProfileRepository) {
    this.#repo = repo;
  }

  getById(_req: Request, res: Response) {
    const req = _req as AuthenticatedRequest;
    const userId = req.user.id;
    const importProfileId = parseInt(req.params.id);
    const importProfile = this.#repo.getById(userId, importProfileId);

    if (!importProfile) {
      res.sendStatus(404);
      return;
    }

    res.json(importProfile);
  }
  getByUserId(_req: Request, res: Response) {
    const req = _req as AuthenticatedRequest;
    const userId = req.user.id;
    const importProfiles = this.#repo.all(userId);

    if (importProfiles.length === 0) {
      res.sendStatus(404);
      return;
    }

    res.json({ importProfiles });
  }
}
