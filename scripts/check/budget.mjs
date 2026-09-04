import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "node-html-parser";
import { BUDGET_BYTES } from "./config.mjs";
import { exists, isInternal } from "./lib.mjs";

const ASSETS = [
  ["link[rel=stylesheet][href]", "href"],
  ["script[src]", "src"],
  ["img[src]", "src"],
  ["link[rel=preload][href]", "href"],
];

/**
 * Peso de la transferencia inicial de index.html: el propio HTML + CSS + JS + imágenes
 * referenciadas (sin video). Las imágenes con loading="lazy" no cuentan: no viajan en la carga
 * inicial, así que quedan fuera del presupuesto (product cards, covers de artículos, pasos, etc).
 */
export function checkBudget(distDir, limit = BUDGET_BYTES) {
  const index = join(distDir, "index.html");
  const html = readFileSync(index, "utf8");
  const root = parse(html);
  let total = statSync(index).size;
  const seen = new Set();
  for (const [selector, attr] of ASSETS) {
    for (const el of root.querySelectorAll(selector)) {
      if (selector === "img[src]" && (el.getAttribute("loading") ?? "").toLowerCase() === "lazy") continue;
      const url = (el.getAttribute(attr) ?? "").split("?")[0];
      if (!isInternal(url) || seen.has(url)) continue;
      seen.add(url);
      const file = join(distDir, url);
      if (exists(file)) total += statSync(file).size;
    }
  }
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  return total > limit ? [`index.html carga ${kb(total)} (límite ${kb(limit)})`] : [];
}
