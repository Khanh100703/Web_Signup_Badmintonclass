import { pool } from "../db.js";

export async function findCoachByUserId(userId) {
  if (!userId) return null;
  const [[row]] = await pool.query(
    `SELECT c.*
     FROM coaches c
     JOIN users u ON u.email = c.email
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );
  return row || null;
}

export async function listByIds(ids = []) {
  if (!ids.length) return [];
  const [rows] = await pool.query(
    `SELECT * FROM coaches WHERE id IN (${ids.map(() => "?").join(",")})`,
    ids
  );
  return rows;
}
