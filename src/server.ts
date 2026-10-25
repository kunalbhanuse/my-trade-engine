import express from "express";
import { config } from "./config.js";

const app = express();
const PORT = config.PORT;

app.get("/health", (req, res) => {
  res.json({
    message: "My app health is great ",
    server: `Server is running on ${PORT}`,
  });
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
