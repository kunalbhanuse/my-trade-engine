import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;

app.get("/health", (req, res) => {
  res.json({
    message: "My app health is great ",
    server: "server is running on the port 8080",
  });
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
