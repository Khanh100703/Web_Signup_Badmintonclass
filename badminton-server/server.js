// badminton-server/src/server.js
import "dotenv/config.js";
import app from "./src/app.js";
import { pool } from "./src/db.js";

const port = Number(process.env.PORT || 5000);

async function start() {
  try {
    await pool.query("SELECT 1"); // ping DB
    console.log("[DB] Connected");
  } catch (e) {
    console.error("[DB] Connection error:", e?.code || e?.message);
  }

  app.listen(port, () => {
    console.log(`[HTTP] Server listening on http://localhost:${port}`);
  });
}

start();
