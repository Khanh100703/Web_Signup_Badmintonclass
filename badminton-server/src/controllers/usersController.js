import { pool } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import crypto from "crypto";

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
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT id, password_hash, role, name, email, is_locked FROM users WHERE email=?",
      [email]
    );
    if (!rows.length) {
      return res
        .status(401)
        .json({ ok: false, message: "Email không tồn tại" });
    }

    const u = rows[0];

    // Không cho login nếu bị khoá
    if (u.is_locked) {
      return res
        .status(403)
        .json({ ok: false, message: "Tài khoản đã bị khoá" });
    }

    if (!u.password_hash) {
      return res.status(500).json({
        ok: false,
        message:
          "Tài khoản chưa có password_hash. Vui lòng reset mật khẩu hoặc đăng ký lại.",
      });
    }

    const match = await bcrypt.compare(password, u.password_hash);
    if (!match) {
      return res.status(401).json({ ok: false, message: "Sai mật khẩu" });
    }

    // Access token (ngắn hạn)
    const token = jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || "2h",
    });

    // Refresh token (dài hạn) -> lưu DB
    const refreshToken = crypto.randomBytes(32).toString("hex");

    // (khuyến nghị) thu hồi token cũ của user để tránh phình bảng
    await pool.query("UPDATE user_tokens SET revoked=1 WHERE user_id=?", [
      u.id,
    ]);

    await pool.query(
      "INSERT INTO user_tokens (user_id, refresh_token, revoked) VALUES (?,?,0)",
      [u.id, refreshToken]
    );

    return res.json({
      ok: true,
      token, // access token
      refresh_token: refreshToken,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
      },
    });
  } catch (e) {
    console.error("loginUser error:", e);
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
