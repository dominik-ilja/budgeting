import { Router } from "express";

import type { UserRepository } from "../../repositories/user/interface";
import { SignInController } from "./controller";

type Config = {
  repository: UserRepository;
  secret: string;
};

export function createSignInRouter({ repository, secret }: Config) {
  const router = Router();
  const controller = new SignInController(repository, secret);

  router.route("/").post(controller.signIn);

  return router;
}
