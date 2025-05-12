import type { Request, Response } from "express";
import type { ImportProfileRepository } from "../../../repositories/import-profile/repository";
import type { AuthenticatedRequest } from "../../../middlewares/validate-jwt";
import type { TargetTableRepository } from "../../../repositories/target-table/repository";
import { purchaseProfileSchema } from "./schemas/purchase-profile-schema";

// This is the final step in creating an import profile for a specific user
// we need the "id" of the user, the "id" of the target table, and the "name" of the profile
// when we finish

export function createPostImportProfileHandler(
  importProfileRepo: ImportProfileRepository,
  targetTableRepo: TargetTableRepository
) {
  return (req: Request, res: Response) => {
    const _req = req as AuthenticatedRequest;

    const targetTableId = parseInt(req.body.targetTableId);
    const table = targetTableRepo.getById(targetTableId);

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

    const result = schema.safeParse({
      userId: _req.user.id,
      importProfileId: parseInt(_req.params.id),
      targetTableId,
      name: _req.body.name,
      mappings: _req.body.mappings,
    });

    if (!result.success) {
      res.sendStatus(400);
      return;
    }

    const data = result.data;

    // wrap in a transaction
    // create the import profile
    // create the mappings for the import profile
    // finish transaction
    importProfileRepo.create(data.userId, targetTableId, data.name, data.mappings);

    // return the import profile in JSON response
  };
}
