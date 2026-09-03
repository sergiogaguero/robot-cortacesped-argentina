import { describe, expect, it } from "vitest";

describe("entorno de tests", () => {
  it("resuelve el alias @/ y corre TypeScript", async () => {
    const mod = await import("@/styles/global.css?raw");
    expect(mod.default).toContain("@theme");
  });
});
