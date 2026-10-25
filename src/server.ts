import express from "express";
import { config } from "./config.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();
const PORT = config.PORT;

app.get("/health", (req, res) => {
  res.json({
    message: "My app health is great ",
    server: `Server is running on ${PORT}`,
  });
});
app.get("/boom", () => {
  throw new Error("test");
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
