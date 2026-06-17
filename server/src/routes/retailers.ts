// Retailer affiliate cards. Backed by retailers.json so non-developers can
// edit the list without a deploy. Mirrors the products route.
import { Router } from "express";
import path from "path";
import fs from "fs";
import { config } from "../config";

export const retailersRouter = Router();

const retailersFile = path.join(config.dataDir, "retailers.json");

interface Retailer {
  id: string;
  rank: number;
  name: string;
  tagline: string;
  url: string;
  affiliateUrl: string;
  logoUrl: string | null;
  accentColour: string;
  score: { value: number; outOf: number } | null;
  badge: string | null;
  highlight: string;
  terms: { label: string; value: string }[];
  whyWeLikeThem: string[];
  verifyBeforeLaunch?: string;
  active: boolean;
}

function loadRetailers(): Retailer[] {
  const raw = fs.readFileSync(retailersFile, "utf8");
  return JSON.parse(raw) as Retailer[];
}

retailersRouter.get("/", (_req, res) => {
  const list = loadRetailers()
    .filter(r => r.active)
    .sort((a, b) => a.rank - b.rank)
    // Don't ship the editorial "verify before launch" reminder to clients —
    // it's a private note for whoever is curating the JSON.
    .map(({ verifyBeforeLaunch: _v, ...pub }) => pub);
  res.json({ retailers: list });
});
