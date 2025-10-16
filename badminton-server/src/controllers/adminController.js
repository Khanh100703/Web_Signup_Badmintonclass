import * as usersModel from "../models/usersModel.js";
import { sanitizeUser } from "./authController.js";

const ALLOWED_ROLES = new Set(["USER", "COACH", "ADMIN"]);

export async function listUsers(req, res) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const { total, rows } = await usersModel.listUsers({ page, limit });
    res.json({
      ok: true,
      data: rows.map((row) => sanitizeUser(row)),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("listUsers error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateUserRole(req, res) {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;
    if (!userId || !ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ ok: false, message: "Role không hợp lệ" });
    }
    await usersModel.updateUserRole(userId, role);
    const updated = await usersModel.findUserById(userId);
    res.json({ ok: true, data: sanitizeUser(updated) });
  } catch (err) {
    console.error("updateUserRole error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateUserLock(req, res) {
  try {
    const userId = Number(req.params.id);
    const { locked } = req.body;
    if (!userId || typeof locked !== "boolean") {
      return res.status(400).json({ ok: false, message: "locked phải là boolean" });
    }
    await usersModel.updateUserLock(userId, locked);
    const updated = await usersModel.findUserById(userId);
    res.json({ ok: true, data: sanitizeUser(updated) });
  } catch (err) {
    console.error("updateUserLock error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}
