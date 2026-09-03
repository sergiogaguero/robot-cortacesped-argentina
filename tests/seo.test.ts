import { describe, expect, it } from "vitest";
import { absoluteUrl, canonicalUrl } from "@/lib/seo";

describe("canonicalUrl", () => {
  it("home", () => expect(canonicalUrl("/")).toBe("https://www.robotscortacesped.com.ar/"));
  it("quita barra final e index.html", () => {
    expect(canonicalUrl("/tecnologia/")).toBe("https://www.robotscortacesped.com.ar/tecnologia");
    expect(canonicalUrl("/tecnologia/index.html")).toBe("https://www.robotscortacesped.com.ar/tecnologia");
    expect(canonicalUrl("/productos/v1000")).toBe("https://www.robotscortacesped.com.ar/productos/v1000");
  });
});

describe("absoluteUrl", () => {
  it("antepone el dominio", () => expect(absoluteUrl("/og/v1000.jpg")).toBe("https://www.robotscortacesped.com.ar/og/v1000.jpg"));
  it("respeta URLs ya absolutas", () => expect(absoluteUrl("https://x.com/a.jpg")).toBe("https://x.com/a.jpg"));
});
