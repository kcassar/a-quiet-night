// Journal endpoints. Anonymous-friendly: if no user is logged in we accept
// rows with user_id = NULL (the MVP doesn't ship account flow yet).
import { Router } from "express";
import { db } from "../db";

export const journalRouter = Router();

interface JournalBody {
  date?: string;
  sleep_quality?: number;
  mask_comfort?: number;
  dry_mouth?: boolean;
  headache?: boolean;
  congestion?: boolean;
  alcohol_before_bed?: boolean;
  notes?: string;
}

function bool(v: unknown): 0 | 1 | null {
  if (v === true || v === "true" || v === 1) return 1;
  if (v === false || v === "false" || v === 0) return 0;
  return null;
}

function clampInt(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

journalRouter.post("/", (req, res) => {
  const body = req.body as JournalBody;
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return res.status(400).json({ error: "A valid date (YYYY-MM-DD) is required." });
  }
  const stmt = db.prepare(`
    INSERT INTO journal_entries
      (date, sleep_quality, mask_comfort, dry_mouth, headache,
       congestion, alcohol_before_bed, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    body.date,
    clampInt(body.sleep_quality, 1, 5),
    clampInt(body.mask_comfort, 1, 5),
    bool(body.dry_mouth),
    bool(body.headache),
    bool(body.congestion),
    bool(body.alcohol_before_bed),
    typeof body.notes === "string" ? body.notes.slice(0, 4000) : null
  );
  // lastInsertRowid can be number or bigint; JSON can't serialise bigint.
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

journalRouter.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, date, sleep_quality, mask_comfort, dry_mouth, headache,
              congestion, alcohol_before_bed, notes, created_at
         FROM journal_entries
         ORDER BY date DESC
         LIMIT 365`
    )
    .all();
  res.json({ entries: rows });
});
