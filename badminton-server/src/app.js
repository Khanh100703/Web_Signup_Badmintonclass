import express from "express";
import cors from "cors";
import classesRoutes from "./routes/classesRoutes.js";
import sessionsRoutes from "./routes/sessionsRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import enrollmentsRoutes from "./routes/enrollmentsRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import coachesRoutes from "./routes/coachesRoutes.js";

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
app.use("/api/users", usersRoutes);
app.use("/api/enrollments", enrollmentsRoutes);
app.use("/api", scheduleRoutes);
app.use("/api/coaches", coachesRoutes);

export default app;
