import pool from "../db.js";
import jwt from "jsonwebtoken";

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "2h",
  });
}

export async function refresh(req, res) {
  const { refresh_token } = req.body;
  if (!refresh_token)
    return res
      .status(400)
      .json({ ok: false, message: "Missing refresh_token" });
  const [rows] = await pool.query(
    "SELECT user_id FROM user_tokens WHERE refresh_token=? AND revoked=0",
    [refresh_token]
  );
  if (!rows.length)
    return res
      .status(401)
      .json({ ok: false, message: "Invalid refresh token" });
  const { user_id } = rows[0];
  const [[u]] = await pool.query(
    "SELECT id, role, is_locked FROM users WHERE id=?",
    [user_id]
  );
  if (!u || u.is_locked)
    return res.status(403).json({ ok: false, message: "User locked" });
  const access = signAccess({ id: u.id, role: u.role });
  res.json({ ok: true, access_token: access });
}

export async function logout(req, res) {
  // optional: revoke all tokens for this user or only the provided one
  const { refresh_token } = req.body;
  if (refresh_token) {
    await pool.query("UPDATE user_tokens SET revoked=1 WHERE refresh_token=?", [
      refresh_token,
    ]);
  } else {
    await pool.query("UPDATE user_tokens SET revoked=1 WHERE user_id=?", [
      req.user.id,
    ]);
  }
  res.json({ ok: true });
}
