import { join } from "node:path";
import { SITE_URL } from "./config.mjs";
import { exists, htmlFiles } from "./lib.mjs";

function expectedCanonical(rel) {
  if (rel === "index.html") return `${SITE_URL}/`;
  return `${SITE_URL}/${rel.replace(/\/index\.html$/, "").replace(/\.html$/, "")}`;
}

export function checkSeo(distDir) {
  const errors = [];
  for (const { rel, root } of htmlFiles(distDir)) {
    const err = (msg) => errors.push(`${rel}: ${msg}`);
    const html = root.querySelector("html");
    if (html?.getAttribute("lang") !== "es-AR") err('html lang debe ser "es-AR"');

    const title = root.querySelector("title")?.text.trim() ?? "";
    if (title.length < 10 || title.length > 60) err(`title de ${title.length} caracteres (debe ser 10-60): "${title}"`);

    const desc = root.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";
    if (desc.length < 50 || desc.length > 160) err(`description de ${desc.length} caracteres (debe ser 50-160)`);

    const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "";
    if (canonical !== expectedCanonical(rel)) err(`canonical "${canonical}" ≠ esperada "${expectedCanonical(rel)}"`);

    const og = root.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "";
    if (!og.startsWith(SITE_URL)) err(`og:image ausente o no absoluta: "${og}"`);
    else if (!exists(join(distDir, og.slice(SITE_URL.length)))) err(`og:image apunta a un archivo inexistente: ${og}`);

    const h1s = root.querySelectorAll("h1").length;
    if (h1s !== 1) err(`hay ${h1s} <h1> (debe haber exactamente 1)`);

    for (const s of root.querySelectorAll('script[type="application/ld+json"]')) {
      try { JSON.parse(s.text); } catch { err("JSON-LD inválido"); }
    }
  }
  return errors;
}
