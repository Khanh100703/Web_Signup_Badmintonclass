import { pool } from "../db.js";

export async function tryPromote(sessionId) {
  // check capacity left
  const [[cap]] = await pool.query("SELECT capacity FROM sessions WHERE id=?", [
    sessionId,
  ]);
  if (!cap) return;
  const [[cnt]] = await pool.query(
    'SELECT COUNT(*) as n FROM enrollments WHERE session_id=? AND status="ENROLLED"',
    [sessionId]
  );
  if (cnt.n >= cap.capacity) return; // still full

  const [[wl]] = await pool.query(
    "SELECT id, user_id FROM waitlist WHERE session_id=? ORDER BY created_at ASC LIMIT 1",
    [sessionId]
  );
  if (!wl) return;

  // enroll and remove waitlist row atomically
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[cnt2]] = await conn.query(
      'SELECT COUNT(*) as n FROM enrollments WHERE session_id=? AND status="ENROLLED" FOR UPDATE',
      [sessionId]
    );
    const [[cap2]] = await conn.query(
      "SELECT capacity FROM sessions WHERE id=? FOR UPDATE",
      [sessionId]
    );
    if (cnt2.n < cap2.capacity) {
      await conn.query(
        'INSERT INTO enrollments(session_id,user_id,status) VALUES (?,?,"ENROLLED")',
        [sessionId, wl.user_id]
      );
      await conn.query("DELETE FROM waitlist WHERE id=?", [wl.id]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
