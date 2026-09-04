import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "node-html-parser";

export function walk(dir, exts) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

export function htmlFiles(distDir) {
  return walk(distDir, [".html"]).map((file) => ({
    file,
    rel: relative(distDir, file).replaceAll("\\", "/"),
    root: parse(readFileSync(file, "utf8")),
  }));
}

/** ¿Existe en dist el recurso al que apunta una URL interna (/a, /a/, /a.html, /img.png)? */
export function resolveInternal(distDir, href) {
  const path = decodeURIComponent(href.split("#")[0].split("?")[0]);
  if (path === "" || path === "/") return exists(join(distDir, "index.html"));
  const clean = path.replace(/\/+$/, "");
  return [clean, `${clean}/index.html`, `${clean}.html`].some((p) => exists(join(distDir, p)));
}

export function exists(p) {
  try { return statSync(p).isFile(); } catch { return false; }
}

export function isInternal(url) {
  return url.startsWith("/") && !url.startsWith("//");
}
