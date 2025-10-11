import dotenv from "dotenv";
import app from "./src/app.js";
dotenv.config();

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`API is running on http://localhost:${port}`);
});
