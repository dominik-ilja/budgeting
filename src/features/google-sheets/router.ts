import { Router } from "express";
import multer from "multer";

import { createValidateJwt } from "../../middlewares/validate-jwt";
import type { ImportProfileRepository } from "../../repositories/import-profile/repository";
import { createHandler } from "./handler";
import { validateRequest } from "./validation";

export const FILE_UPLOAD_NAME = "file";

export function createGoogleSheetsRouter(secret: string, repo: ImportProfileRepository) {
  const router = Router();
  const validateJwt = createValidateJwt(secret);
  const upload = multer({ storage: multer.memoryStorage() });
  const handler = createHandler(repo);

  router
    .route("/")
    .post(validateJwt, upload.single(FILE_UPLOAD_NAME), validateRequest, handler);

  return router;
}
