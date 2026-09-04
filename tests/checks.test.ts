import { statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkBudget } from "../scripts/check/budget.mjs";
import { checkForbidden } from "../scripts/check/forbidden.mjs";
import { checkLinks } from "../scripts/check/links.mjs";
import { checkSeo } from "../scripts/check/seo.mjs";

const ok = join(process.cwd(), "tests/fixtures/dist-ok");
const bad = join(process.cwd(), "tests/fixtures/dist-bad");

describe("dist-ok pasa todos los chequeos", () => {
  it("forbidden", () => expect(checkForbidden(ok)).toEqual([]));
  it("links", () => expect(checkLinks(ok)).toEqual([]));
  it("seo", () => expect(checkSeo(ok)).toEqual([]));
  it("budget", () => expect(checkBudget(ok, 500 * 1024)).toEqual([]));
  it("budget no cuenta imágenes con loading=\"lazy\" (no viajan en la transferencia inicial)", () => {
    // tests/fixtures/dist-ok/index.html tiene <img src="/lazy.png" ... loading="lazy">: ese archivo
    // pesa ~2 KB pero no debe sumarse al total, así que el presupuesto pasa incluso con un límite
    // apenas por encima del peso real de index.html + style.css (sin contar lazy.png).
    const base = statSync(join(ok, "index.html")).size + statSync(join(ok, "style.css")).size;
    expect(checkBudget(ok, base + 100)).toEqual([]);
  });
  it("budget sigue fallando por debajo del peso real (sanity check del fixture)", () => {
    const base = statSync(join(ok, "index.html")).size + statSync(join(ok, "style.css")).size;
    expect(checkBudget(ok, base - 1).length).toBe(1);
  });
  it("un script inline (no JSON-LD) con la clave 'oficial' de una API externa no cuenta como palabra prohibida", () => {
    // tests/fixtures/dist-ok/script-inline.html contiene <script>var k={oficial:1};</script>
    // en el body: esa clave solo vive en JavaScript (no es copy del sitio) y no debe disparar el
    // chequeo. Los otros chequeos también deben seguir pasando para ese archivo.
    expect(checkForbidden(ok)).toEqual([]);
    expect(checkLinks(ok)).toEqual([]);
    expect(checkSeo(ok)).toEqual([]);
  });
});

describe("dist-bad reporta cada problema", () => {
  it("forbidden encuentra la palabra en html y xml", () => {
    const errs = checkForbidden(bad);
    expect(errs.some((e) => e.includes("index.html"))).toBe(true);
    expect(errs.some((e) => e.includes("sitemap-0.xml"))).toBe(true);
  });
  it("forbidden sigue revisando el contenido de los scripts JSON-LD", () => {
    // tests/fixtures/dist-bad/jsonld.html tiene la palabra prohibida únicamente dentro de un
    // <script type="application/ld+json">, sin aparecer en el texto visible de la página: el
    // chequeo debe encontrarla igual, porque ese JSON-LD es copy que Google lee.
    const errs = checkForbidden(bad);
    expect(errs.some((e) => e.includes("jsonld.html"))).toBe(true);
  });
  it("links detecta href e img rotos", () => {
    const errs = checkLinks(bad);
    expect(errs.some((e) => e.includes("/no-existe"))).toBe(true);
    expect(errs.some((e) => e.includes("/img/nada.png"))).toBe(true);
  });
  it("seo detecta lang, título, descripción, canónica, og:image, h1 y JSON-LD", () => {
    const errs = checkSeo(bad).join("\n");
    for (const needle of ["lang", "title", "description", "canonical", "og:image", "h1", "JSON-LD"]) {
      expect(errs, `falta error de ${needle}`).toContain(needle);
    }
  });
  it("budget falla con un límite muy bajo", () => {
    expect(checkBudget(ok, 10).length).toBe(1);
  });
});
