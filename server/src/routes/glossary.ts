import { Router } from "express";
import path from "path";
import fs from "fs";
import { config } from "../config";

export const glossaryRouter = Router();

const glossaryFile = path.join(config.dataDir, "glossary.json");

glossaryRouter.get("/", (_req, res) => {
  const raw = fs.readFileSync(glossaryFile, "utf8");
  res.json({ entries: JSON.parse(raw) });
});
