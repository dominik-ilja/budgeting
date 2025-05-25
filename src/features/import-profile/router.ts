import { type RequestHandler, Router } from "express";

import type { ImportProfileRepository } from "../../repositories/import-profile/interface";
import { CreateImportProfileController } from "./create-import-profile/controller";
import { GetImportProfileController } from "./get-import-profile/controller";

type Config = {
  repository: ImportProfileRepository;
  validateJwt: RequestHandler;
};

export function createImportProfileRouter({ repository, validateJwt }: Config) {
  const router = Router();
  const getController = new GetImportProfileController(repository);
  const postController = new CreateImportProfileController(repository);

  router
    .route("/")
    .get(validateJwt, getController.getByUserId)
    .post(validateJwt, postController.create);
  router.route("/:id").get(validateJwt, getController.getById);

  return router;
}
