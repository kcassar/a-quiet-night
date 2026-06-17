#!/usr/bin/env node
//
// Submits the URLs from client/public/sitemap.xml to the IndexNow protocol,
// which tells Bing, Yandex, Naver and Seznam that pages have changed.
// Google deprecated their sitemap-ping endpoint in 2023; for Google, use
// Search Console's "Request indexing" or rely on the sitemap reference in
// robots.txt.
//
// Usage:
//   node scripts/notify-search-engines.mjs
//
// Env (all optional — sensible defaults):
//   INDEXNOW_HOST       default: www.aquietnight.com
//   INDEXNOW_KEY        default: read from the *.txt file in client/public/
//   INDEXNOW_ENDPOINT   default: https://api.indexnow.org/indexnow
//
// Exit code 0 on success, 1 on failure. Safe to run repeatedly — IndexNow
// is idempotent.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "client", "public");
const sitemapPath = path.join(publicDir, "sitemap.xml");

const host = process.env.INDEXNOW_HOST || "www.aquietnight.com";
const endpoint = process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow";

function findKey() {
  if (process.env.INDEXNOW_KEY) return process.env.INDEXNOW_KEY;
  // The IndexNow protocol expects a key file named <key>.txt in the site
  // root with the key as its content. We pick the first .txt file in the
  // public folder that isn't one of our known content files.
  const ignore = new Set(["robots.txt"]);
  const candidates = fs
    .readdirSync(publicDir)
    .filter(f => f.endsWith(".txt") && !ignore.has(f));
  for (const c of candidates) {
    const content = fs.readFileSync(path.join(publicDir, c), "utf8").trim();
    // Filename (without .txt) should equal the file's contents.
    if (path.basename(c, ".txt") === content) return content;
  }
  throw new Error(
    "Couldn't find an IndexNow key. Set INDEXNOW_KEY or place <key>.txt " +
    "in client/public/ where the file's contents match the filename."
  );
}

function readSitemapUrls() {
  if (!fs.existsSync(sitemapPath)) {
    throw new Error(`Sitemap not found at ${sitemapPath}`);
  }
  const xml = fs.readFileSync(sitemapPath, "utf8");
  // Cheap regex parse — sitemap.xml is well-formed and ours, no need for a
  // full XML parser.
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
  if (!urls.length) throw new Error("Sitemap has no <loc> entries.");
  return urls;
}

async function main() {
  const key = findKey();
  const urlList = readSitemapUrls();
  const keyLocation = `https://${host}/${key}.txt`;

  console.log(`IndexNow notify`);
  console.log(`  host:        ${host}`);
  console.log(`  endpoint:    ${endpoint}`);
  console.log(`  key:         ${key.slice(0, 4)}…${key.slice(-4)}`);
  console.log(`  keyLocation: ${keyLocation}`);
  console.log(`  urls:        ${urlList.length}`);

  const body = JSON.stringify({ host, key, keyLocation, urlList });

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json",
    },
    body,
  });

  // 200 = success, 202 = accepted (most common). Anything else is a problem.
  if (res.status === 200 || res.status === 202) {
    console.log(`✓ IndexNow accepted (${res.status}).`);
    return;
  }

  let detail = "";
  try { detail = await res.text(); } catch { /* ignore */ }
  console.error(`✗ IndexNow returned ${res.status}: ${detail}`);
  process.exit(1);
}

main().catch(err => {
  console.error("notify-search-engines failed:", err.message);
  process.exit(1);
});
