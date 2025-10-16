import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as usersModel from "../models/usersModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "badminton-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export async function register(req, res) {
  try {
    const { full_name, email, password, phone } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({
        ok: false,
        message: "Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu",
      });
    }

    const existing = await usersModel.findUserByEmail(email);
    if (existing) {
      return res
        .status(409)
        .json({ ok: false, message: "Email đã được sử dụng" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const { id } = await usersModel.createUser({
      full_name,
      email,
      password_hash,
      phone,
    });
    const created = await usersModel.findUserById(id);
    const token = generateToken(created);
    res.status(201).json({ ok: true, token, user: sanitizeUser(created) });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Vui lòng nhập email và mật khẩu" });
    }
    const user = await usersModel.findUserByEmail(email);
    if (!user) {
      return res
        .status(401)
        .json({ ok: false, message: "Thông tin đăng nhập không chính xác" });
    }
    if (user.is_locked) {
      return res
        .status(403)
        .json({ ok: false, message: "Tài khoản đã bị khoá" });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ ok: false, message: "Thông tin đăng nhập không chính xác" });
    }
    const token = generateToken(user);
    res.json({ ok: true, token, user: sanitizeUser(user) });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await usersModel.findUserById(req.user.id);
    res.json({ ok: true, data: sanitizeUser(user) });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}
