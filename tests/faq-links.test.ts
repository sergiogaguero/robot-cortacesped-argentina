import { describe, expect, it } from "vitest";
import type { Faq } from "@/content/schemas";
import { withPublishedLinks } from "@/lib/faq-links";

const faq = (link?: Faq["link"]): Faq => ({ question: "¿Pregunta?", answer: "Respuesta suficientemente larga.", scope: ["home"], order: 1, link });

describe("withPublishedLinks", () => {
  it("conserva links a artículos publicados", () => {
    const out = withPublishedLinks([faq({ label: "Leer", href: "/blog/mantenimiento-robot-cortacesped" })], ["mantenimiento-robot-cortacesped"]);
    expect(out[0]!.link).toEqual({ label: "Leer", href: "/blog/mantenimiento-robot-cortacesped" });
  });
  it("quita links a artículos no publicados", () => {
    const out = withPublishedLinks([faq({ label: "Leer", href: "/blog/no-existe" })], []);
    expect(out[0]!.link).toBeUndefined();
  });
  it("conserva links que no son del blog", () => {
    const out = withPublishedLinks([faq({ label: "Comparar", href: "/productos/v600-vs-v1000" })], []);
    expect(out[0]!.link?.href).toBe("/productos/v600-vs-v1000");
  });
  it("no toca FAQ sin link ni muta la entrada", () => {
    const input = [faq()];
    const out = withPublishedLinks(input, []);
    expect(out[0]!.link).toBeUndefined();
    expect(out).not.toBe(input);
  });
});
