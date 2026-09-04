import { WHATSAPP_NUMBER } from "./config.mjs";
import { htmlFiles } from "./lib.mjs";

/**
 * Todos los links de WhatsApp del sitio deben usar el número único de `site.ts` y llevar
 * `data-wa` (lo lee analytics.ts para el evento `contact_whatsapp`). Un número viejo o un botón
 * sin `data-wa` no rompe la build de Astro, así que se revisa acá.
 */
export function checkWhatsapp(distDir) {
  const errors = [];
  for (const { rel, root } of htmlFiles(distDir)) {
    for (const el of root.querySelectorAll('a[href^="https://wa.me/"]')) {
      const href = el.getAttribute("href") ?? "";
      const number = href.slice("https://wa.me/".length).split(/[?#]/)[0];
      if (number !== WHATSAPP_NUMBER) {
        errors.push(`${rel}: href="${href}" usa el número "${number}" (debe ser "${WHATSAPP_NUMBER}")`);
        continue;
      }

      const dataWa = el.getAttribute("data-wa");
      if (!dataWa) errors.push(`${rel}: href="${href}" no tiene data-wa`);
    }
  }
  return errors;
}
