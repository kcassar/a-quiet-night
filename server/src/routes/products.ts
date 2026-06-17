// Products are loaded from a JSON file checked into the repo. Editing the
// JSON is enough to add/remove products — no DB migration needed.
import { Router } from "express";
import path from "path";
import fs from "fs";
import { config } from "../config";

export const productsRouter = Router();

const productsFile = path.join(config.dataDir, "products.json");

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  best_for_tags: string[];
  pros: string[];
  cons: string[];
  affiliate_url: string | null;
  fallback_url: string | null;
  image_url: string | null;
  active: boolean;
}

function loadProducts(): Product[] {
  const raw = fs.readFileSync(productsFile, "utf8");
  return JSON.parse(raw) as Product[];
}

productsRouter.get("/", (req, res) => {
  let products = loadProducts().filter(p => p.active);
  const { category, tag } = req.query;
  if (typeof category === "string" && category) {
    products = products.filter(
      p => p.category.toLowerCase() === category.toLowerCase()
    );
  }
  if (typeof tag === "string" && tag) {
    const t = tag.toLowerCase();
    products = products.filter(p =>
      p.best_for_tags.map(x => x.toLowerCase()).includes(t)
    );
  }
  const categories = Array.from(new Set(loadProducts().filter(p => p.active).map(p => p.category)));
  const tags = Array.from(
    new Set(loadProducts().filter(p => p.active).flatMap(p => p.best_for_tags))
  );
  res.json({ products, categories, tags });
});
