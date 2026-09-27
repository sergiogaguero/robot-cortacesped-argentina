import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { faqSchema, productSchema } from "@/content/schemas";

const root = join(process.cwd(), "src/content");
const readJsonDir = (dir: string) =>
  readdirSync(join(root, dir))
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ id: f.replace(/\.json$/, ""), data: JSON.parse(readFileSync(join(root, dir, f), "utf8")) as unknown }));

const products = readJsonDir("products");
const faqs = readJsonDir("faq");

describe("productos", () => {
  it("están el V600, el V1000 y el Neomow X2", () => {
    expect(products.map((p) => p.id)).toEqual(expect.arrayContaining(["v600", "v1000", "neomow-x2"]));
  });
  it.each(products)("$id cumple el esquema", ({ data }) => {
    const r = productSchema.safeParse(data);
    expect(r.success, JSON.stringify(r.success ? null : r.error.issues, null, 2)).toBe(true);
  });
  it("el slug coincide con el nombre de archivo", () => {
    for (const p of products) expect(productSchema.parse(p.data).slug).toBe(p.id);
  });
  it("V1000 cubre 1200 m² y V600 600 m²", () => {
    const byId = Object.fromEntries(products.map((p) => [p.id, productSchema.parse(p.data)]));
    expect(byId.v1000!.coverageM2).toBe(1200);
    expect(byId.v600!.coverageM2).toBe(600);
  });
  it.each(products.map((p) => p.id))("%s tiene al menos 3 FAQ cuyo scope lo incluye", (slug) => {
    const matches = faqs.filter((f) => faqSchema.parse(f.data).scope.includes(slug));
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });
  it.each(products)("$id: coverageM2 aparece en seo.title y en algún highlight", ({ data }) => {
    const p = productSchema.parse(data);
    const m2 = String(p.coverageM2);
    expect(p.seo.title).toContain(m2);
    expect(p.highlights.some((h) => h.includes(m2))).toBe(true);
  });
  it.each(products)("$id: los specs de pendiente, ruido y autonomía coinciden con fit", ({ data }) => {
    const p = productSchema.parse(data);
    const items = p.specs.flatMap((g) => g.items);
    const value = (label: string) => items.find((i) => i.label === label)?.value ?? "";
    expect(value("Pendiente máxima")).toContain(`${p.fit.maxSlopeDeg}°`);
    // null = dato sin confirmar: entonces tampoco puede figurar en la ficha.
    if (p.fit.noiseDb === null) expect(value("Nivel de ruido")).toBe("");
    else expect(value("Nivel de ruido")).toContain(`${p.fit.noiseDb}`);
    if (p.fit.runtimeMin === null) expect(value("Autonomía por carga")).toBe("");
    else expect(value("Autonomía por carga")).toContain(`${p.fit.runtimeMin}`);
  });
  it.each(products)("$id: con versiones, el precio es el más bajo y la superficie la más grande", ({ data }) => {
    const p = productSchema.parse(data);
    if (!p.variants) return;
    const prices = p.variants.map((v) => v.priceUSD).filter((x): x is number => x !== null);
    expect(p.priceUSD).toBe(Math.min(...prices));
    expect(p.coverageM2).toBe(Math.max(...p.variants.map((v) => v.coverageM2)));
    expect(new Set(p.variants.map((v) => v.id)).size).toBe(p.variants.length);
  });
  it("los precios del Neomow X2 son los acordados", () => {
    const p = productSchema.parse(products.find((x) => x.id === "neomow-x2")!.data);
    expect(p.variants!.map((v) => [v.coverageM2, v.priceUSD])).toEqual([[3000, 3166], [4000, 3520], [6000, 3800]]);
  });
});

describe("faq", () => {
  it.each(faqs)("$id cumple el esquema", ({ data }) => {
    const r = faqSchema.safeParse(data);
    expect(r.success, JSON.stringify(r.success ? null : r.error.issues, null, 2)).toBe(true);
  });
  it("hay al menos 9 preguntas y las 3 más frecuentes están en home, v600 y v1000", () => {
    expect(faqs.length).toBeGreaterThanOrEqual(9);
    for (const id of ["recoger-cesped", "cuanto-tarda", "mantenimiento"]) {
      const f = faqs.find((x) => x.id === id);
      expect(f, `falta ${id}`).toBeDefined();
      expect(faqSchema.parse(f!.data).scope).toEqual(expect.arrayContaining(["home", "v600", "v1000"]));
    }
  });
});

describe("palabra prohibida", () => {
  it('ningún JSON de contenido contiene "oficial"', () => {
    for (const { id, data } of [...products, ...faqs]) {
      expect(JSON.stringify(data).toLowerCase(), id).not.toContain("oficial");
    }
  });
});
