import express from "express";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/", (_, res) => {
    res.send("Hello, world!");
  });

  return app;
}
