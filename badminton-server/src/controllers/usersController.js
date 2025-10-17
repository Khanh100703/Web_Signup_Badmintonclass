import { pool } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

export async function registerUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const { name, email, password } = req.body;
  try {
    const [dup] = await pool.query("SELECT id FROM users WHERE email=?", [
      email,
    ]);
    if (dup.length)
      return res.status(409).json({ ok: false, message: "Email đã tồn tại" });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)",
      [name, email, hashed, "USER"]
    );
    return res.status(201).json({ ok: true, message: "Đăng ký thành công" });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function loginUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT id, password_hash, role, name, email FROM users WHERE email=?",
      [email]
    );
    if (!rows.length)
      return res
        .status(401)
        .json({ ok: false, message: "Email không tồn tại" });

    const u = rows[0];
    const match = await bcrypt.compare(password, u.password_hash);
    if (!match)
      return res.status(401).json({ ok: false, message: "Sai mật khẩu" });

    const token = jwt.sign(
      { id: u.id_users, role: u.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "2h" }
    );
    return res.json({
      ok: true,
      token,
      user: {
        id_users: u.id_users,
        name: u.name,
        email: u.email,
        role: u.role,
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getMe(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id=?",
      [req.user.id]
    );
    return res.json({ ok: true, data: rows[0] || null });
  } catch {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateMe(req, res) {
  const { name, phone } = req.body;
  try {
    await pool.query("UPDATE users SET name = COALESCE(?, name) WHERE id=?", [
      name ?? null,
      req.user.id,
    ]);
    return res.json({ ok: true, message: "Cập nhật thành công" });
  } catch {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
