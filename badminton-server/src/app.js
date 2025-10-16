import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import classesRoutes from "./routes/classesRoutes.js";
import sessionsRoutes from "./routes/sessionsRoutes.js";
import coachesRoutes from "./routes/coachesRoutes.js";
import meRoutes from "./routes/meRoutes.js";
import enrollmentsRoutes from "./routes/enrollmentsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { authMiddleware, requireAdmin } from "./middlewares/authMiddleware.js";

const app = express();
app.use(cors());
app.use(express.json());

// healthcheck
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "badminton-api" });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/coaches", coachesRoutes);
app.use("/api/me", authMiddleware, meRoutes);
app.use("/api/enrollments", authMiddleware, enrollmentsRoutes);
app.use(
  "/api/admin",
  authMiddleware,
  requireAdmin,
  adminRoutes
);

export default app;
