import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../../../middlewares/validate-jwt";
import type { ImportProfileRepository } from "../../../repositories/import-profile/interface";
import { purchaseProfileSchema } from "./validation";

export class CreateImportProfileController {
  #repo: ImportProfileRepository;

  constructor(repo: ImportProfileRepository) {
    this.#repo = repo;
  }

  create(_req: Request, res: Response) {
    const req = _req as AuthenticatedRequest;
    const targetTableId = parseInt(req.body.targetTableId);
    const table = this.#repo.getTargetTableById(targetTableId);

    if (!table) {
      res.sendStatus(400);
      return;
    }

    const schema = purchaseProfileSchema;
    const validation = schema.safeParse({
      userId: req.user.id,
      targetTableId,
      name: req.body.name,
      mappings: req.body.mappings,
    });

    if (!validation.success) {
      res.sendStatus(400);
      return;
    }

    const data = validation.data;
    const result = this.#repo.create(
      data.userId,
      targetTableId,
      data.name,
      data.mappings
    );

    if (!result.isSuccessful) {
      console.log(result.error);
      res.sendStatus(500);
      return;
    }

    res.status(201).json({ id: result.id });
  }
}
