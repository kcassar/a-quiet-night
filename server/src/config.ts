// Centralised runtime config. All values come from env vars with sensible defaults
// so the app boots out-of-the-box on Replit without any setup.
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const projectRoot = path.resolve(__dirname, "..", "..");

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function abs(p: string): string {
  return path.isAbsolute(p) ? p : path.resolve(projectRoot, p);
}

export const config = {
  port: num("PORT", 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  uploadTmpDir: abs(process.env.UPLOAD_TMP_DIR ?? "./data/uploads"),
  extractTmpDir: abs(process.env.EXTRACT_TMP_DIR ?? "./data/extracted"),
  dbPath: abs(process.env.DB_PATH ?? "./data/app.db"),
  maxUploadBytes: num("MAX_UPLOAD_BYTES", 250 * 1024 * 1024),
  maxDecompressedBytes: num("MAX_DECOMPRESSED_BYTES", 1024 * 1024 * 1024),
  maxZipEntries: num("MAX_ZIP_ENTRIES", 20_000),
  uploadRateWindowMs: num("UPLOAD_RATE_WINDOW_MS", 15 * 60 * 1000),
  uploadRateMax: num("UPLOAD_RATE_MAX", 10),
  clientDist: path.resolve(projectRoot, "client", "dist"),
  // JSON data files (products, glossary) live with the source so they can be
  // hand-edited without rebuilding. We resolve to the source folder regardless
  // of whether the server runs via tsx (src) or compiled (dist).
  dataDir: path.resolve(projectRoot, "server", "src", "data"),
};
