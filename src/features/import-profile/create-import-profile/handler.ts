import type { Request, Response } from "express";
import type { ImportProfileRepository } from "../../../repositories/import-profile/repository";
import type { AuthenticatedRequest } from "../../../middlewares/validate-jwt";
import { purchaseProfileSchema } from "./schemas/purchase-profile-schema";

// This is the final step in creating an import profile for a specific user
// we need the "id" of the user, the "id" of the target table, and the "name" of the profile
// when we finish

export function createPostImportProfileHandler(
  importProfileRepo: ImportProfileRepository
) {
  return (req: Request, res: Response) => {
    const _req = req as AuthenticatedRequest;

    const targetTableId = parseInt(req.body.targetTableId);
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
      importProfileId: parseInt(_req.params.id),
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

    res.sendStatus(201).json({ id: result.id });
  };
}
