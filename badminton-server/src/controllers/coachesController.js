import pool from "../db.js";

// ===== COACHES CRUD (không dùng note) =====
export async function list(req, res) {
  const [rows] = await pool.query(
    "SELECT id, name, phone, email FROM coaches ORDER BY name"
  );
  res.json({ ok: true, data: rows });
}

export async function detail(req, res) {
  const { id } = req.params;
  const [[row]] = await pool.query(
    "SELECT id, name, phone, email FROM coaches WHERE id=?",
    [id]
  );
  if (!row) return res.status(404).json({ ok: false, message: "Not found" });
  res.json({ ok: true, data: row });
}

export async function create(req, res) {
  const { name, phone, email } = req.body;
  const [r] = await pool.query(
    "INSERT INTO coaches(name, phone, email) VALUES(?,?,?)",
    [name, phone || null, email || null]
  );
  res.json({ ok: true, id: r.insertId });
}

export async function update(req, res) {
  const { id } = req.params;
  const { name, phone, email } = req.body;
  await pool.query("UPDATE coaches SET name=?, phone=?, email=? WHERE id=?", [
    name,
    phone || null,
    email || null,
    id,
  ]);
  res.json({ ok: true });
}

export async function remove(req, res) {
  const { id } = req.params;
  await pool.query("DELETE FROM coaches WHERE id=?", [id]);
  res.json({ ok: true });
}

// ===== AVAILABILITIES =====
// Table: coach_availabilities(coach_id, weekday TINYINT, start_time TIME, end_time TIME)
export async function listAvailabilities(req, res) {
  const { id } = req.params; // coach id
  const [rows] = await pool.query(
    "SELECT id, coach_id, weekday, start_time, end_time FROM coach_availabilities WHERE coach_id=? ORDER BY weekday, start_time",
    [id]
  );
  res.json({ ok: true, data: rows });
}

export async function addAvailability(req, res) {
  const { id } = req.params; // coach id
  const { weekday, start_time, end_time } = req.body;
  const [r] = await pool.query(
    "INSERT INTO coach_availabilities(coach_id, weekday, start_time, end_time) VALUES(?,?,?,?)",
    [id, weekday, start_time, end_time]
  );
  res.json({ ok: true, id: r.insertId });
}

export async function removeAvailability(req, res) {
  const { availId } = req.params; // chú ý: route phải đặt :availId
  await pool.query("DELETE FROM coach_availabilities WHERE id=?", [availId]);
  res.json({ ok: true });
}

// ===== BLACKOUT DATES =====
// Table: blackout_dates(id, coach_id, date [, ...])
export async function listBlackouts(req, res) {
  const { id } = req.params; // coach id
  const [rows] = await pool.query(
    "SELECT id, coach_id, date FROM blackout_dates WHERE coach_id=? ORDER BY date",
    [id]
  );
  res.json({ ok: true, data: rows });
}

export async function addBlackout(req, res) {
  const { id } = req.params; // coach id
  const { date } = req.body; // không dùng note vì schema của bạn không có
  const [r] = await pool.query(
    "INSERT INTO blackout_dates(coach_id, date) VALUES(?,?)",
    [id, date]
  );
  res.json({ ok: true, id: r.insertId });
}

export async function removeBlackout(req, res) {
  const { bid } = req.params; // chú ý: route phải đặt :bid
  await pool.query("DELETE FROM blackout_dates WHERE id=?", [bid]);
  res.json({ ok: true });
}
