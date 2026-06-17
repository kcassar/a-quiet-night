// SQLite via better-sqlite3. Schema is created on first boot.
// We keep the schema small and use plain JSON columns where flexibility matters.
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { config } from "./config";

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  original_filename TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_status TEXT NOT NULL DEFAULT 'pending',
  parser_used TEXT,
  message TEXT,
  date_range_start TEXT,
  date_range_end TEXT,
  raw_file_deleted_at TEXT,
  retain INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS night_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_id TEXT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  usage_minutes REAL,
  ahi REAL,
  obstructive_index REAL,
  central_index REAL,
  hypopnea_index REAL,
  rera_index REAL,
  leak_median REAL,
  leak_95 REAL,
  pressure_median REAL,
  pressure_95 REAL,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_night_upload ON night_summaries(upload_id);

CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  sleep_quality INTEGER,
  mask_comfort INTEGER,
  dry_mouth INTEGER,
  headache INTEGER,
  congestion INTEGER,
  alcohol_before_bed INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);
