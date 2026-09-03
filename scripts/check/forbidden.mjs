import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { FORBIDDEN } from "./config.mjs";
import { walk } from "./lib.mjs";

export function checkForbidden(distDir) {
  const errors = [];
  for (const file of walk(distDir, [".html", ".xml"])) {
    const text = readFileSync(file, "utf8");
    const m = FORBIDDEN.exec(text);
    if (m) {
      const ctx = text.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, " ");
      errors.push(`${relative(distDir, file)}: palabra prohibida "${m[0]}" … ${ctx} …`);
    }
  }
  return errors;
}
