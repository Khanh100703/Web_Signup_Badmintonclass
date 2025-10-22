import pool from "../db.js";
import dayjs from "dayjs";

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export async function generateSessions(req, res) {
  const { classId } = req.params;
  const { from, to, byWeekday, startTime, endTime } = req.body; // byWeekday: [1,3,5]
  const [[cls]] = await pool.query(
    "SELECT id, coach_id, location_id, capacity FROM classes WHERE id=?",
    [classId]
  );
  if (!cls)
    return res.status(404).json({ ok: false, message: "Class not found" });

  const dates = [];
  let cur = dayjs(from);
  const end = dayjs(to);
  while (cur.isBefore(end) || cur.isSame(end, "day")) {
    if (byWeekday.includes(cur.day())) dates.push(cur.format("YYYY-MM-DD"));
    cur = cur.add(1, "day");
  }

  // fetch coach blackouts
  const [blackouts] = await pool.query(
    "SELECT date FROM blackout_dates WHERE coach_id=?",
    [cls.coach_id]
  );
  const blackoutSet = new Set(
    blackouts.map((b) => dayjs(b.date).format("YYYY-MM-DD"))
  );

  // fetch existing sessions of coach & location in range
  const [exists] = await pool.query(
    `SELECT s.id, s.start_time, s.end_time, c.location_id, c.coach_id
FROM sessions s JOIN classes c ON c.id=s.class_id
WHERE (s.start_time BETWEEN ? AND ?) OR (s.end_time BETWEEN ? AND ?)`,
    [from + " 00:00:00", to + " 23:59:59", from + " 00:00:00", to + " 23:59:59"]
  );

  const toInsert = [];
  for (const d of dates) {
    if (blackoutSet.has(d)) continue;
    const sStart = dayjs(`${d} ${startTime}`);
    const sEnd = dayjs(`${d} ${endTime}`);
    // no-overlap for the same coach/location
    const conflict = exists.some(
      (e) =>
        (e.coach_id === cls.coach_id || e.location_id === cls.location_id) &&
        overlaps(dayjs(e.start_time), dayjs(e.end_time), sStart, sEnd)
    );
    if (conflict) continue;
    toInsert.push([
      classId,
      sStart.format("YYYY-MM-DD HH:mm:ss"),
      sEnd.format("YYYY-MM-DD HH:mm:ss"),
      cls.capacity,
    ]);
  }

  if (!toInsert.length) return res.json({ ok: true, inserted: 0 });
  await pool.query(
    "INSERT INTO sessions(class_id,start_time,end_time,capacity) VALUES ?",
    [toInsert]
  );
  res.json({ ok: true, inserted: toInsert.length });
}
