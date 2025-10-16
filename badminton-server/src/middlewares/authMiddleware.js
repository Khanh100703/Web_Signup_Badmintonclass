import jwt from "jsonwebtoken";
import * as usersModel from "../models/usersModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "badminton-secret";

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  if (!token) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await usersModel.findUserById(payload.sub);
    if (!user || user.is_locked) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
    req.user = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err) {
    console.error("authMiddleware error:", err);
    res.status(401).json({ ok: false, message: "Unauthorized" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ ok: false, message: "Forbidden" });
  }
  next();
}
