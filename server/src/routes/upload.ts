// POST /api/upload  -> accepts a single .zip file
// GET  /api/upload/:id/status
// GET  /api/upload/:id/summary
// GET  /api/upload/:id/nights
// GET  /api/upload/:id/export/csv
// GET  /api/upload/:id/export/pdf
//
// The flow:
//   1. Multer writes the upload to UPLOAD_TMP_DIR with a random name.
//   2. We validate the file (type, size, MIME) and create an `uploads` row.
//   3. We safely extract the ZIP into EXTRACT_TMP_DIR/<id>/.
//   4. The parser runner identifies the data and writes night_summaries rows.
//   5. We delete the original ZIP and the extracted folder unless the user
//      asked us to keep it. Either way we record raw_file_deleted_at.

import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { config } from "../config";
import { db } from "../db";
import {
  extractZipSafely,
  safeRmRf,
  ZipValidationError,
} from "../lib/zipExtractor";
import { runParsers } from "../parsers";
import { summarise, NightRow } from "../lib/analysis";
import { exportNightsToCsv, streamSummaryPdf } from "../lib/exporters";

fs.mkdirSync(config.uploadTmpDir, { recursive: true });
fs.mkdirSync(config.extractTmpDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadTmpDir,
    filename: (_req, file, cb) => {
      const id = crypto.randomBytes(16).toString("hex");
      // Always end with .zip — we will only allow that extension below.
      cb(null, `${id}.zip`);
    },
  }),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    const isZipExt = path.extname(file.originalname).toLowerCase() === ".zip";
    const isZipMime =
      file.mimetype === "application/zip" ||
      file.mimetype === "application/x-zip-compressed" ||
      file.mimetype === "application/octet-stream"; // some browsers send this
    if (!isZipExt) return cb(new Error("Only .zip files are accepted."));
    if (!isZipMime) return cb(new Error("Unexpected MIME type for ZIP."));
    cb(null, true);
  },
});

// IP-based rate limit so a hostile client can't hammer the upload endpoint.
const uploadLimiter = rateLimit({
  windowMs: config.uploadRateWindowMs,
  max: config.uploadRateMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads. Please try again later." },
});

export const uploadRouter = Router();

uploadRouter.post(
  "/",
  uploadLimiter,
  upload.single("file"),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const consent = req.body?.consent === "true" || req.body?.consent === true;
    if (!consent) {
      safeRmRf(file.path);
      return res.status(400).json({
        error:
          "You must confirm the disclaimer before uploading. This site is not " +
          "medical advice — please discuss any therapy changes with your clinician.",
      });
    }

    const retain = req.body?.retain === "true" || req.body?.retain === true;
    const uploadId = path.basename(file.filename, ".zip");

    db.prepare(
      `INSERT INTO uploads (id, original_filename, processed_status, retain)
       VALUES (?, ?, 'pending', ?)`
    ).run(uploadId, file.originalname, retain ? 1 : 0);

    let extractDir: string | null = null;
    try {
      const extraction = await extractZipSafely(file.path, uploadId);
      extractDir = extraction.extractDir;

      const result = await runParsers(extraction.extractDir);

      if (result.nights.length > 0) {
        const insert = db.prepare(`
          INSERT INTO night_summaries (
            upload_id, date, usage_minutes, ahi,
            obstructive_index, central_index, hypopnea_index, rera_index,
            leak_median, leak_95, pressure_median, pressure_95
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const trx = db.transaction((rows: typeof result.nights) => {
          for (const r of rows) {
            insert.run(
              uploadId,
              r.date,
              r.usageMinutes ?? null,
              r.ahi ?? null,
              r.obstructiveIndex ?? null,
              r.centralIndex ?? null,
              r.hypopneaIndex ?? null,
              r.reraIndex ?? null,
              r.leakMedian ?? null,
              r.leak95 ?? null,
              r.pressureMedian ?? null,
              r.pressure95 ?? null,
            );
          }
        });
        trx(result.nights);
      }

      const dates = result.nights.map(n => n.date).sort();
      const dateRangeStart = dates[0] ?? null;
      const dateRangeEnd = dates[dates.length - 1] ?? null;

      db.prepare(
        `UPDATE uploads
            SET processed_status = ?,
                parser_used = ?,
                message = ?,
                date_range_start = ?,
                date_range_end = ?
          WHERE id = ?`
      ).run(
        result.nights.length > 0 ? "ready" : "unsupported",
        result.parserName,
        result.message ?? null,
        dateRangeStart,
        dateRangeEnd,
        uploadId
      );

      // Always delete the raw ZIP. We only keep the extracted directory if
      // the user opted in.
      safeRmRf(file.path);
      if (!retain) safeRmRf(extraction.extractDir);
      db.prepare(
        `UPDATE uploads SET raw_file_deleted_at = datetime('now') WHERE id = ?`
      ).run(uploadId);

      return res.json({ uploadId, status: result.nights.length > 0 ? "ready" : "unsupported", message: result.message });
    } catch (err) {
      safeRmRf(file.path);
      if (extractDir) safeRmRf(extractDir);
      const message =
        err instanceof ZipValidationError
          ? err.message
          : "We couldn't process this file. Please make sure it's a valid CPAP ZIP export.";
      db.prepare(
        `UPDATE uploads SET processed_status = 'failed', message = ?, raw_file_deleted_at = datetime('now') WHERE id = ?`
      ).run(message, uploadId);
      return res.status(400).json({ error: message, uploadId });
    }
  }
);

// Express-friendly error handler for multer-specific errors. Multer rejects
// e.g. "file too large" before our route handler ever runs.
uploadRouter.use((
  err: Error & { code?: string },
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: (err?: unknown) => void
) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: `Upload too large. Limit is ${Math.round(config.maxUploadBytes / (1024 * 1024))} MB.`,
    });
  }
  return res.status(400).json({ error: err.message });
});

// ---- read endpoints ------------------------------------------------------

function loadUpload(id: string) {
  return db
    .prepare(`SELECT * FROM uploads WHERE id = ?`)
    .get(id) as
    | undefined
    | {
        id: string;
        original_filename: string;
        uploaded_at: string;
        processed_status: string;
        parser_used: string | null;
        message: string | null;
        date_range_start: string | null;
        date_range_end: string | null;
      };
}

function loadNights(id: string): NightRow[] {
  return db
    .prepare(
      `SELECT date, usage_minutes, ahi, obstructive_index, central_index,
              hypopnea_index, rera_index, leak_median, leak_95,
              pressure_median, pressure_95
         FROM night_summaries
        WHERE upload_id = ?
        ORDER BY date ASC`
    )
    .all(id) as NightRow[];
}

uploadRouter.get("/:id/status", (req, res) => {
  const u = loadUpload(req.params.id);
  if (!u) return res.status(404).json({ error: "Upload not found." });
  res.json({
    uploadId: u.id,
    status: u.processed_status,
    parserUsed: u.parser_used,
    message: u.message,
    dateRangeStart: u.date_range_start,
    dateRangeEnd: u.date_range_end,
  });
});

uploadRouter.get("/:id/summary", (req, res) => {
  const u = loadUpload(req.params.id);
  if (!u) return res.status(404).json({ error: "Upload not found." });
  const nights = loadNights(req.params.id);
  res.json({
    uploadId: u.id,
    status: u.processed_status,
    parserUsed: u.parser_used,
    message: u.message,
    summary: summarise(nights),
  });
});

uploadRouter.get("/:id/nights", (req, res) => {
  const u = loadUpload(req.params.id);
  if (!u) return res.status(404).json({ error: "Upload not found." });
  res.json({ nights: loadNights(req.params.id) });
});

uploadRouter.get("/:id/export/csv", (req, res) => {
  const u = loadUpload(req.params.id);
  if (!u) return res.status(404).json({ error: "Upload not found." });
  const nights = loadNights(req.params.id);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="cpap-summary-${u.id}.csv"`
  );
  res.send(exportNightsToCsv(nights));
});

uploadRouter.get("/:id/export/pdf", (req, res) => {
  const u = loadUpload(req.params.id);
  if (!u) return res.status(404).json({ error: "Upload not found." });
  const nights = loadNights(req.params.id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="cpap-summary-${u.id}.pdf"`
  );
  streamSummaryPdf(res, {
    uploadId: u.id,
    originalFilename: u.original_filename,
    parserUsed: u.parser_used,
    summary: summarise(nights),
    nights,
  });
});
