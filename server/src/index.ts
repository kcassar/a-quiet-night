// Entry point. In production the same Node process serves the API at /api/*
// and the built React app from client/dist. In development the React dev
// server runs on a different port and proxies /api requests here.

import express from "express";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { config } from "./config";
import "./db"; // ensure schema is initialised on boot
import { uploadRouter } from "./routes/upload";
import { journalRouter } from "./routes/journal";
import { productsRouter } from "./routes/products";
import { retailersRouter } from "./routes/retailers";
import { glossaryRouter } from "./routes/glossary";

const app = express();

// Security headers. We allow inline styles because Vite injects a few during
// build, but we keep frame-ancestors locked down.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "img-src": ["'self'", "data:", "https:"],
        // Allow inline styles (Vite injects a few) and Google Fonts CSS.
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "script-src": ["'self'"],
        "connect-src": ["'self'"],
        "frame-ancestors": ["'none'"],
      },
    },
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// CSRF protection: validate Origin header on state-changing requests.
// This prevents cross-site request forgery attacks on the upload endpoint.
app.use((req, res, next) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    const origin = req.get("Origin");
    const host = req.get("Host");
    // Allow requests with no Origin (same-origin form submissions, curl, etc.)
    // or where Origin matches the Host.
    if (origin) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return res.status(403).json({ error: "Invalid request origin." });
      }
    }
  }
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/upload", uploadRouter);
app.use("/api/journal", journalRouter);
app.use("/api/products", productsRouter);
app.use("/api/retailers", retailersRouter);
app.use("/api/glossary", glossaryRouter);

// Known frontend routes. We send `index.html` with a 200 for these (so the
// SPA can render them) and a 404 for anything else. That way crawlers see
// the correct HTTP status for non-existent URLs, instead of every typo
// turning into an indexable "soft 404".
const KNOWN_ROUTES: (string | RegExp)[] = [
  "/",
  "/learn",
  "/cpap-therapy",
  "/cpap-guide", // legacy redirect
  "/upload", // legacy redirect
  "/dashboard", // legacy redirect
  /^\/dashboard\/[A-Za-z0-9_-]+$/, // legacy redirect
  "/journal", // legacy redirect
  "/sleep-apnea-guide", // legacy redirect
  "/my-data",
  "/my-data/upload",
  "/my-data/dashboard",
  /^\/my-data\/dashboard\/[A-Za-z0-9_-]+$/,
  "/my-data/export",
  "/articles",
  /^\/articles\/[A-Za-z0-9_-]+$/,
  "/products",
  "/resources",
  "/about",
  "/privacy",
];

function isKnownRoute(pathname: string): boolean {
  return KNOWN_ROUTES.some(route =>
    typeof route === "string" ? route === pathname : route.test(pathname)
  );
}

// Serve the built React app (production). If the build doesn't exist yet
// (e.g. in dev) we just respond with a friendly hint.
if (fs.existsSync(config.clientDist)) {
  app.use(express.static(config.clientDist));
  app.get("*", (req, res) => {
    const status = isKnownRoute(req.path) ? 200 : 404;
    res.status(status).sendFile(path.join(config.clientDist, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res
      .status(200)
      .type("text/plain")
      .send(
        "A Quiet Night API is running. Build the React client (npm run build) " +
          "or run the Vite dev server (npm run dev) to see the app."
      );
  });
}

app.listen(config.port, () => {
  // Concise, no PHI — never log uploaded data or filenames.
  console.log(`A Quiet Night listening on http://localhost:${config.port}`);
});
