// Secure ZIP extraction.
//
// We deliberately do NOT use a "just unzip everything" library.
// Threats we mitigate here:
//   - zip-slip / path traversal (entries with ../ or absolute paths)
//   - executables and shell scripts hidden inside SD card dumps
//   - zip bombs (decompressed size dwarfs compressed size)
//   - nested archives that could chain into another bomb
//   - too many entries (resource exhaustion via inode pressure)
//
// We only extract files into a sandbox folder under EXTRACT_TMP_DIR/<uploadId>.
import fs from "fs";
import path from "path";
import yauzl from "yauzl";
import { config } from "../config";

// Disallowed executable extensions inside an SD-card style dump.
// CPAP cards should only contain CSV/EDF/data files.
const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".com", ".msi", ".scr",
  ".sh", ".bash", ".zsh", ".ps1", ".vbs", ".js", ".jar",
  ".dll", ".so", ".dylib", ".app", ".pkg",
]);

// Nested archive extensions — we reject them outright. CPAP exports never
// contain another archive.
const BLOCKED_NESTED_ARCHIVES = new Set([
  ".zip", ".rar", ".7z", ".tar", ".gz", ".tgz", ".bz2", ".xz",
]);

export interface ExtractionResult {
  extractDir: string;
  fileCount: number;
  totalBytes: number;
}

export class ZipValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZipValidationError";
  }
}

function isSafeRelativePath(entryName: string): boolean {
  // Reject absolute paths and any traversal segments.
  if (!entryName) return false;
  if (entryName.startsWith("/") || entryName.startsWith("\\")) return false;
  if (/^[A-Za-z]:[\\/]/.test(entryName)) return false; // Windows drive letter
  const norm = entryName.replace(/\\/g, "/");
  if (norm.split("/").some(seg => seg === "..")) return false;
  return true;
}

export async function extractZipSafely(
  zipPath: string,
  uploadId: string
): Promise<ExtractionResult> {
  const extractDir = path.join(config.extractTmpDir, uploadId);
  fs.mkdirSync(extractDir, { recursive: true });

  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        return reject(new ZipValidationError("Could not open ZIP file."));
      }

      let fileCount = 0;
      let totalBytes = 0;
      let aborted = false;

      const abort = (msg: string) => {
        if (aborted) return;
        aborted = true;
        zipfile.close();
        reject(new ZipValidationError(msg));
      };

      zipfile.on("error", (e) => abort(e.message));
      zipfile.on("end", () => {
        if (!aborted) {
          resolve({ extractDir, fileCount, totalBytes });
        }
      });

      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        if (aborted) return;

        fileCount++;
        if (fileCount > config.maxZipEntries) {
          return abort(`ZIP has too many entries (limit ${config.maxZipEntries}).`);
        }

        if (!isSafeRelativePath(entry.fileName)) {
          return abort(`Unsafe path in ZIP: ${entry.fileName}`);
        }

        const ext = path.extname(entry.fileName).toLowerCase();
        if (BLOCKED_EXTENSIONS.has(ext)) {
          return abort(`Disallowed file type in ZIP: ${entry.fileName}`);
        }
        if (BLOCKED_NESTED_ARCHIVES.has(ext)) {
          return abort(`Nested archive not allowed: ${entry.fileName}`);
        }

        // Track decompressed size up-front using the central directory header.
        totalBytes += Number(entry.uncompressedSize ?? 0);
        if (totalBytes > config.maxDecompressedBytes) {
          return abort("Decompressed size exceeds the configured limit.");
        }

        const isDir = /\/$/.test(entry.fileName);
        const destPath = path.join(extractDir, entry.fileName);

        // Final defence-in-depth: ensure destination is inside extractDir
        // even after path resolution (catches symlink/encoding tricks).
        const resolved = path.resolve(destPath);
        if (!resolved.startsWith(path.resolve(extractDir) + path.sep) &&
            resolved !== path.resolve(extractDir)) {
          return abort(`Path escapes extraction sandbox: ${entry.fileName}`);
        }

        if (isDir) {
          fs.mkdirSync(destPath, { recursive: true });
          zipfile.readEntry();
          return;
        }

        fs.mkdirSync(path.dirname(destPath), { recursive: true });

        zipfile.openReadStream(entry, (rsErr, readStream) => {
          if (rsErr || !readStream) {
            return abort(`Could not read entry ${entry.fileName}`);
          }
          const writeStream = fs.createWriteStream(destPath);
          readStream.pipe(writeStream);
          writeStream.on("finish", () => zipfile.readEntry());
          writeStream.on("error", (wErr) => abort(wErr.message));
        });
      });
    });
  });
}

// Recursively list every regular file under a directory. Used by parsers
// to discover what's inside the user's SD card dump.
export function listFilesRecursive(rootDir: string): string[] {
  const results: string[] = [];
  function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile()) results.push(full);
    }
  }
  walk(rootDir);
  return results;
}

export function safeRmRf(target: string): void {
  try {
    fs.rmSync(target, { recursive: true, force: true });
  } catch {
    // Swallow — best-effort cleanup, never fail the request because of this.
  }
}
