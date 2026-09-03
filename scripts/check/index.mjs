import { join } from "node:path";
import { checkBudget } from "./budget.mjs";
import { checkForbidden } from "./forbidden.mjs";
import { checkLinks } from "./links.mjs";
import { checkSeo } from "./seo.mjs";

const dist = join(process.cwd(), "dist");
const suites = [
  ["Palabra prohibida", checkForbidden],
  ["Links internos", checkLinks],
  ["Reglas SEO", checkSeo],
  ["Presupuesto de peso", checkBudget],
];

let failed = 0;
for (const [name, fn] of suites) {
  const errors = fn(dist);
  if (errors.length === 0) {
    console.log(`✔ ${name}`);
  } else {
    failed += errors.length;
    console.log(`✖ ${name} — ${errors.length} problema(s):`);
    for (const e of errors) console.log(`   • ${e}`);
  }
}
if (failed > 0) {
  console.error(`\n${failed} problema(s). El build no se publica.`);
  process.exit(1);
}
console.log("\nTodos los chequeos pasaron.");
