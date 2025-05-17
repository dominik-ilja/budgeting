import type { NextFunction, Request, Response } from "express";
import { MIME_TYPES } from "../../constants/mime-types";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middlewares/validate-jwt";

export type ValidatedRequest = Request &
  AuthenticatedRequest & {
    body: {
      importProfileId: number;
    };
    file: Express.Multer.File;
  };

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  if (!req.file || req.file.mimetype !== MIME_TYPES.CSV) {
    res.status(400).send("CSV file is required");
    return;
  }

  const importId = req.body.importProfileId;
  const validationResult = z.coerce.number().min(0).safeParse(importId);

  if (!validationResult.success) {
    res.status(400).send(`Invalid importProfileId: "${importId}"`);
    return;
  }

  next();
}
