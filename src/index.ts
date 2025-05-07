import { createApp } from "./app/app.js";

const app = createApp();
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
