import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { productSchema } from "@/content/schemas";
import {
  ldArticle, ldBreadcrumb, ldFaq, ldHowTo, ldItemList, ldOrganization, ldProduct, ldWebSite,
} from "@/lib/schema";

const v1000 = productSchema.parse(JSON.parse(readFileSync("src/content/products/v1000.json", "utf8")));
const v600 = productSchema.parse(JSON.parse(readFileSync("src/content/products/v600.json", "utf8")));
const asRecord = (o: object) => o as Record<string, any>;

describe("JSON-LD", () => {
  it("Organization tiene logo, teléfono nuevo y sameAs", () => {
    const o = asRecord(ldOrganization());
    expect(o["@type"]).toBe("Organization");
    expect(o.logo).toBe("https://www.robotscortacesped.com.ar/logo.png");
    expect(o.contactPoint.telephone).toBe("+5492494318185");
    expect(o.sameAs).toContain("https://www.instagram.com/robotscortacesped_argentina/");
    expect(JSON.stringify(o).toLowerCase()).not.toContain("oficial");
  });
  it("WebSite", () => expect(asRecord(ldWebSite())["@type"]).toBe("WebSite"));
  it("Breadcrumb numera posiciones", () => {
    const b = asRecord(ldBreadcrumb([{ name: "Inicio", url: "https://x/" }, { name: "Productos", url: "https://x/p" }]));
    expect(b.itemListElement[1]).toEqual({ "@type": "ListItem", position: 2, name: "Productos", item: "https://x/p" });
  });
  it("Product con precio: Offer en USD, InStock", () => {
    const p = asRecord(ldProduct(v1000, { url: "https://x/productos/v1000", imageUrl: "https://x/i.webp" }));
    expect(p["@type"]).toBe("Product");
    expect(p.brand).toEqual({ "@type": "Brand", name: "TerraMow" });
    expect(p.offers.price).toBe(2100);
    expect(p.offers.priceCurrency).toBe("USD");
    expect(p.offers.availability).toBe("https://schema.org/InStock");
    expect(p.offers.url).toBe("https://x/productos/v1000");
  });
  it("Product sin precio: sin Offer; sin stock → OutOfStock no aplica porque no hay oferta", () => {
    const p = asRecord(ldProduct(v600, { url: "https://x/productos/v600", imageUrl: "https://x/i.webp" }));
    expect(p.offers).toBeUndefined();
  });
  it("Product sin stock pero con precio → OutOfStock", () => {
    const p = asRecord(ldProduct({ ...v600, priceUSD: 1500 }, { url: "https://x", imageUrl: "https://x/i" }));
    expect(p.offers.availability).toBe("https://schema.org/OutOfStock");
  });
  it("FAQPage", () => {
    const f = asRecord(ldFaq([{ question: "¿A?", answer: "B." }]));
    expect(f["@type"]).toBe("FAQPage");
    expect(f.mainEntity[0]).toEqual({ "@type": "Question", name: "¿A?", acceptedAnswer: { "@type": "Answer", text: "B." } });
  });
  it("ItemList", () => {
    const l = asRecord(ldItemList([{ name: "A", url: "https://x/a" }]));
    expect(l.itemListElement[0]).toEqual({ "@type": "ListItem", position: 1, name: "A", url: "https://x/a" });
  });
  it("HowTo", () => {
    const h = asRecord(ldHowTo({ name: "N", description: "D", steps: [{ name: "S1", text: "T1" }] }));
    expect(h.step[0]).toEqual({ "@type": "HowToStep", position: 1, name: "S1", text: "T1" });
  });
  it("BlogPosting con fechas ISO y publisher", () => {
    const a = asRecord(ldArticle({ title: "T", description: "D", url: "https://x/blog/t", imageUrl: "https://x/c.webp", pubDate: new Date("2026-09-10T00:00:00Z") }));
    expect(a["@type"]).toBe("BlogPosting");
    expect(a.datePublished).toBe("2026-09-10T00:00:00.000Z");
    expect(a.dateModified).toBe("2026-09-10T00:00:00.000Z");
    expect(a.publisher["@type"]).toBe("Organization");
    expect(a.mainEntityOfPage).toEqual({ "@type": "WebPage", "@id": "https://x/blog/t" });
  });
});
