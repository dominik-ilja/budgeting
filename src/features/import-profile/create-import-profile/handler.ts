import type { Request, Response } from "express";
import type { ImportProfileRepository } from "../../../repositories/import-profile/repository";
import type { AuthenticatedRequest } from "../../../middlewares/validate-jwt";
import { purchaseProfileSchema } from "./schemas/purchase-profile-schema";

export function createPostImportProfileHandler(
  importProfileRepo: ImportProfileRepository
) {
  return (req: Request, res: Response) => {
    const _req = req as AuthenticatedRequest;

    const targetTableId = parseInt(_req.body?.targetTableId);
    const table = importProfileRepo.getTargetTableById(targetTableId);

    if (!table) {
      res.sendStatus(400);
      return;
    }

    let schema;
    if (table.name === "purchases") {
      schema = purchaseProfileSchema;
    } else {
      throw new Error("Unsupported table name");
    }

    const validation = schema.safeParse({
      userId: _req.user.id,
      targetTableId,
      name: _req.body.name,
      mappings: _req.body.mappings,
    });

    if (!validation.success) {
      res.sendStatus(400); // add the validation error messages
      return;
    }

    const data = validation.data;
    const result = importProfileRepo.create(
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
  };
}
