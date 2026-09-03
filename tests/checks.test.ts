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
});

describe("dist-bad reporta cada problema", () => {
  it("forbidden encuentra la palabra en html y xml", () => {
    const errs = checkForbidden(bad);
    expect(errs.some((e) => e.includes("index.html"))).toBe(true);
    expect(errs.some((e) => e.includes("sitemap-0.xml"))).toBe(true);
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
