import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { FORBIDDEN } from "./config.mjs";
import { walk } from "./lib.mjs";

// Scripts que no son JSON-LD (analytics, currency.ts, sticky-bar.ts…) pueden contener nombres de
// campo de APIs externas (ej. "oficial" en la respuesta de Bluelytics) que no son copy del sitio:
// esa clave solo vive en JavaScript y no cuenta para la regla. El JSON-LD sí se revisa: es copy
// que Google lee (nombre, descripción, etc.).
const NON_JSONLD_SCRIPT = /<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi;

export function checkForbidden(distDir) {
  const errors = [];
  for (const file of walk(distDir, [".html", ".xml"])) {
    const text = readFileSync(file, "utf8");
    const searched = file.endsWith(".html") ? text.replace(NON_JSONLD_SCRIPT, "") : text;
    const m = FORBIDDEN.exec(searched);
    if (m) {
      const ctx = searched.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, " ");
      errors.push(`${relative(distDir, file)}: palabra prohibida "${m[0]}" … ${ctx} …`);
    }
  }
  return errors;
}
