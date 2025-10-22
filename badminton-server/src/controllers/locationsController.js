import pool from "../db.js";

export async function list(req, res) {
  const [rows] = await pool.query(
    "SELECT id, name, address, capacity, notes FROM locations ORDER BY name"
  );
  res.json({ ok: true, data: rows });
}
export async function detail(req, res) {
  const { id } = req.params;
  const [[row]] = await pool.query("SELECT * FROM locations WHERE id=?", [id]);
  if (!row) return res.status(404).json({ ok: false, message: "Not found" });
  res.json({ ok: true, data: row });
}
export async function create(req, res) {
  const { name, address, capacity, notes } = req.body;
  const [r] = await pool.query(
    "INSERT INTO locations(name,address,capacity,notes) VALUES(?,?,?,?)",
    [name, address, capacity || 0, notes || null]
  );
  res.json({ ok: true, id: r.insertId });
}
export async function update(req, res) {
  const { id } = req.params;
  const { name, address, capacity, notes } = req.body;
  await pool.query(
    "UPDATE locations SET name=?, address=?, capacity=?, notes=? WHERE id=?",
    [name, address, capacity || 0, notes || null, id]
  );
  res.json({ ok: true });
}
export async function remove(req, res) {
  const { id } = req.params;
  await pool.query("DELETE FROM locations WHERE id=?", [id]);
  res.json({ ok: true });
}
