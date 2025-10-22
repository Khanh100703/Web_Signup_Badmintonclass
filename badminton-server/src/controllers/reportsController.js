import pool from "../db.js";

function pickSql(by) {
  if (by === "coach")
    return `SELECT c.id, c.name, COUNT(e.id) as enrolls
FROM enrollments e JOIN sessions s ON s.id=e.session_id
JOIN classes cl ON cl.id=s.class_id JOIN coaches c ON c.id=cl.coach_id
WHERE s.start_time BETWEEN ? AND ? AND e.status='ENROLLED'
GROUP BY c.id, c.name ORDER BY enrolls DESC`;
  if (by === "location")
    return `SELECT l.id, l.name, COUNT(e.id) as enrolls
FROM enrollments e JOIN sessions s ON s.id=e.session_id
JOIN classes cl ON cl.id=s.class_id JOIN locations l ON l.id=cl.location_id
WHERE s.start_time BETWEEN ? AND ? AND e.status='ENROLLED'
GROUP BY l.id, l.name ORDER BY enrolls DESC`;
  // default by class
  return `SELECT cl.id, cl.title, COUNT(e.id) as enrolls
FROM enrollments e JOIN sessions s ON s.id=e.session_id
JOIN classes cl ON cl.id=s.class_id
WHERE s.start_time BETWEEN ? AND ? AND e.status='ENROLLED'
GROUP BY cl.id, cl.title ORDER BY enrolls DESC`;
}

export async function summary(req, res) {
  const { by = "class", from, to } = req.query;
  const [rows] = await pool.query(pickSql(by), [from, to]);
  res.json({ ok: true, data: rows });
}

export async function exportCsv(req, res) {
  const { by = "class", from, to } = req.query;
  const [rows] = await pool.query(pickSql(by), [from, to]);
  const header = Object.keys(rows[0] || {}).join(",");
  const body = rows.map((r) => Object.values(r).join(",")).join("\n");
  const csv = [header, body].filter(Boolean).join("\n");
  res.set("Content-Type", "text/csv");
  res.send(csv);
}
