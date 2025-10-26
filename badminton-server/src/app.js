import express from "express";
import cors from "cors";
import classesRoutes from "./routes/classesRoutes.js";
import sessionsRoutes from "./routes/sessionsRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import enrollmentsRoutes from "./routes/enrollmentsRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import coachesRoutes from "./routes/coachesRoutes.js";
import adminUsersRoutes from "./routes/adminUsersRoutes.js";
import authExtraRoutes from "./routes/authExtraRoutes.js";
import locationsRoutes from "./routes/locationsRoutes.js";
import sessionToolsRoutes from "./routes/sessionToolsRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import notificationsRoutes from "./routes/notificationsRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";
import levelsRoutes from "./routes/levelsRoutes.js";
import categoriesRoutes from "./routes/categoriesRoutes.js";

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
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/auth", authExtraRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api", sessionToolsRoutes);
app.use("/api", attendanceRoutes);
app.use("/api", notificationsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/levels", levelsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, // nếu bạn dùng cookie/session, để true; còn dùng Bearer thì có/không đều được
  })
);

export default app;
