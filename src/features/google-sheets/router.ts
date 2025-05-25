import { type RequestHandler, Router } from "express";
import multer from "multer";

import type { ImportProfileRepository } from "../../repositories/import-profile/interface";
import { PostGoogleSheetsController } from "./controller";
import { validateRequest } from "./validation";

export const FILE_UPLOAD_NAME = "file";

type Config = {
  validateJwt: RequestHandler;
  repository: ImportProfileRepository;
  upload: multer.Multer;
};

export function createGoogleSheetsRouter({ repository, upload, validateJwt }: Config) {
  const router = Router();
  const controller = new PostGoogleSheetsController(repository);

  router
    .route("/")
    .post(
      validateJwt,
      upload.single(FILE_UPLOAD_NAME),
      validateRequest,
      controller.convertCsvToTsv
    );

  return router;
}
