import { pool } from "../db.js";

export async function createUser({
  full_name,
  email,
  password_hash,
  phone = null,
  role = "USER",
}) {
  const [result] = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, phone, role)
     VALUES (?, ?, ?, ?, ?)`,
    [full_name, email, password_hash, phone, role]
  );
  return { id: result.insertId };
}

export async function findUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT id, full_name, email, password_hash, phone, role, is_locked, created_at, updated_at
     FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0];
}

export async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT id, full_name, email, password_hash, phone, role, is_locked, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0];
}

export async function updateUserProfile(id, { full_name, phone }) {
  const fields = [];
  const params = [];
  if (typeof full_name === "string") {
    fields.push("full_name = ?");
    params.push(full_name);
  }
  if (typeof phone === "string") {
    fields.push("phone = ?");
    params.push(phone);
  }
  if (!fields.length) return { affectedRows: 0 };
  params.push(id);
  const [result] = await pool.query(
    `UPDATE users SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`,
    params
  );
  return result;
}

export async function listUsers({ page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;
  const [countRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM users"
  );
  const total = countRows[0]?.total ?? 0;
  const [rows] = await pool.query(
    `SELECT id, full_name, email, phone, role, is_locked, created_at, updated_at
     FROM users
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return { total, rows };
}

export async function updateUserRole(id, role) {
  const [result] = await pool.query(
    `UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?`,
    [role, id]
  );
  return result;
}

export async function updateUserLock(id, locked) {
  const [result] = await pool.query(
    `UPDATE users SET is_locked = ?, updated_at = NOW() WHERE id = ?`,
    [locked ? 1 : 0, id]
  );
  return result;
}
