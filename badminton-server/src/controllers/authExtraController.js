import { pool } from "../db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import { sendMail } from "../utils/mailer.js";
import { ensurePasswordOtpTable } from "../utils/schema.js";
import { push as pushNotification } from "./notificationsController.js";

function makeOtp6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

export async function requestChangePasswordOtp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const { email, current_password } = req.body;
  if (!req.user?.id)
    return res.status(401).json({ ok: false, message: "Unauthorized" });

  try {
    await ensurePasswordOtpTable();

    const [[user]] = await pool.query(
      "SELECT id, email, name, password_hash FROM users WHERE id=?",
      [req.user.id]
    );

    if (!user || user.email !== email) {
      return res
        .status(400)
        .json({ ok: false, message: "Email không khớp với tài khoản" });
    }

    const validPw = await bcrypt.compare(current_password, user.password_hash);
    if (!validPw)
      return res
        .status(401)
        .json({ ok: false, message: "Mật khẩu hiện tại không đúng" });

    const otp = makeOtp6();
    const otpHash = await bcrypt.hash(otp, 10);

    await pool.query(
      "UPDATE user_password_otps SET used=1 WHERE user_id=? AND used=0",
      [user.id]
    );
    await pool.query(
      `INSERT INTO user_password_otps (user_id, otp_hash, expires_at, used)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)` ,
      [user.id, otpHash]
    );

    const html = `
      <p>Xin chào ${user.name || ""},</p>
      <p>Mã OTP để đổi mật khẩu là: <b>${otp}</b>.</p>
      <p>Mã sẽ hết hạn trong <b>10 phút</b>. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `;
    const sent = await sendMail(email, "Mã OTP đổi mật khẩu", html);

    return res.json({
      ok: true,
      message: sent.dev
        ? "Đã tạo OTP (DEV). Kiểm tra console server để xem mã."
        : "Đã gửi OTP đến email của bạn.",
      dev_otp: sent.dev ? otp : undefined,
    });
  } catch (e) {
    console.error("requestChangePasswordOtp", e?.message || e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function changePasswordWithOtp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ ok: false, errors: errors.array() });

  const { email, otp, new_password } = req.body;
  if (!req.user?.id)
    return res.status(401).json({ ok: false, message: "Unauthorized" });

  try {
    await ensurePasswordOtpTable();

    const [[user]] = await pool.query(
      "SELECT id, email, name FROM users WHERE id=?",
      [req.user.id]
    );

    if (!user || user.email !== email) {
      return res
        .status(400)
        .json({ ok: false, message: "Email không khớp với tài khoản" });
    }

    const [[otpRow]] = await pool.query(
      `SELECT id, otp_hash, expires_at, used
         FROM user_password_otps
        WHERE user_id=? AND used=0
        ORDER BY id DESC
        LIMIT 1`,
      [user.id]
    );

    if (!otpRow)
      return res
        .status(400)
        .json({ ok: false, message: "OTP không hợp lệ hoặc đã hết hạn" });

    const [[{ valid }]] = await pool.query("SELECT NOW() < ? AS valid", [
      otpRow.expires_at,
    ]);
    if (!valid)
      return res
        .status(400)
        .json({ ok: false, message: "OTP đã hết hạn" });

    const match = await bcrypt.compare(otp, otpRow.otp_hash);
    if (!match)
      return res
        .status(400)
        .json({ ok: false, message: "OTP không chính xác" });

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password_hash=? WHERE id=?", [
      newHash,
      user.id,
    ]);
    await pool.query("UPDATE user_password_otps SET used=1 WHERE id=?", [
      otpRow.id,
    ]);
    await pool.query("UPDATE user_tokens SET revoked=1 WHERE user_id=?", [
      user.id,
    ]);

    await pushNotification(
      user.id,
      "Đổi mật khẩu",
      "Bạn đã đổi mật khẩu thành công. Vui lòng đăng nhập lại."
    );

    return res.json({ ok: true, message: "Đổi mật khẩu thành công" });
  } catch (e) {
    console.error("changePasswordWithOtp", e?.message || e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
