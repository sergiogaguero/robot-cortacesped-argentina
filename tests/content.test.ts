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
  it("hay exactamente v600 y v1000", () => {
    expect(products.map((p) => p.id).sort()).toEqual(["v1000", "v600"]);
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
  it.each(["v600", "v1000"] as const)("%s tiene al menos 3 FAQ cuyo scope lo incluye", (slug) => {
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
    expect(value("Nivel de ruido")).toContain(`${p.fit.noiseDb}`);
    expect(value("Autonomía por carga")).toContain(`${p.fit.runtimeMin}`);
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
