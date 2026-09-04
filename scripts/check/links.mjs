import { htmlFiles, isInternal, resolveInternal } from "./lib.mjs";

// No se revisa img[srcset]: es un atributo multivalor (varias URLs con descriptor de ancho,
// ej. "/a.webp 400w, /b.webp 800w") y el resto de este chequeo asume un único valor por atributo.
// Queda como punto ciego conocido: un srcset roto no lo detecta este script.
const SELECTORS = [
  ["a[href]", "href"],
  ["img[src]", "src"],
  ["link[rel=stylesheet][href]", "href"],
  ["script[src]", "src"],
  ["source[src]", "src"],
  ["video[data-mp4]", "data-mp4"],
  ["video[data-webm]", "data-webm"],
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
