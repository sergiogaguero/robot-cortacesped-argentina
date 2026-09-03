import { htmlFiles, isInternal, resolveInternal } from "./lib.mjs";

const SELECTORS = [
  ["a[href]", "href"],
  ["img[src]", "src"],
  ["link[rel=stylesheet][href]", "href"],
  ["script[src]", "src"],
  ["source[src]", "src"],
];

export function checkLinks(distDir) {
  const errors = [];
  for (const { rel, root } of htmlFiles(distDir)) {
    for (const [selector, attr] of SELECTORS) {
      for (const el of root.querySelectorAll(selector)) {
        const url = el.getAttribute(attr) ?? "";
        if (!isInternal(url)) continue;
        if (!resolveInternal(distDir, url)) errors.push(`${rel}: ${attr}="${url}" no existe en dist/`);
      }
    }
  }
  return errors;
}
