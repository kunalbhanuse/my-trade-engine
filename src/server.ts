import app from "./app.js";
import { config } from "./config.js";
const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
