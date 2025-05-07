import { createApp } from "./app";
import request from "supertest";

test.only("route: /", async () => {
  const app = createApp();

  const response = await request(app).get("/");

  expect(response.text).toBe("Hello, world!");
});

// describe("route: /register", () => {
//   const req = request(app);

//   it("should return a 400 status when either username or password is missing", async () => {
//     const response = await req.post("/register");
//     expect(response.status).toBe(400);
//   });
//   it("should return a 409 status code when username is already taken", async () => {
//     const response = await req
//       .post("/register")
//       .set("content-type", MIME_TYPES.JSON)
//       .send({ username: "username", password: "password" });
//     expect(response.status).toBe(409);
//   });
//   it("should return a 200 status when username doesn't exist", async () => {
//     const response = await req
//       .post("/register")
//       .send({ username: "username1", password: "password" });
//     expect(response.status).toBe(200);
//   });
// });

// describe("route: /login", () => {
//   const req = request(app);

//   it("should return a 200 status when username and password match entry in database", async () => {
//     const credentials = { username: "username1", password: "password" };

//     await req.post("/register").set("content-type", MIME_TYPES.JSON).send(credentials);

//     const response = await req
//       .post("/login")
//       .set("content-type", MIME_TYPES.JSON)
//       .send(credentials);

//     expect(response.status).toBe(200);
//   });
// });
