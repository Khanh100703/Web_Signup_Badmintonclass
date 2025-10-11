import express from "express";
import cors from "cors";
import classesRoutes from "./routes/classesRoutes.js";
import sessionsRoutes from "./routes/sessionsRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// healthcheck
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "badminton-api" });
});

// routes
app.use("/api/classes", classesRoutes);
app.use("/api/sessions", sessionsRoutes);

export default app;
