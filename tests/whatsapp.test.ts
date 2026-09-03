import { describe, expect, it } from "vitest";
import { whatsappMessage, whatsappUrl } from "@/lib/whatsapp";

describe("whatsappMessage", () => {
  it("general", () => {
    expect(whatsappMessage("general")).toBe("Hola, quiero consultar por los robots cortacésped TerraMow.");
  });
  it("product usa el nombre del modelo", () => {
    expect(whatsappMessage("product", "TerraMow V1000")).toBe("Hola, quiero consultar por el TerraMow V1000.");
  });
  it("priceARS", () => {
    expect(whatsappMessage("priceARS", "TerraMow V1000")).toBe("Hola, quiero saber el precio en pesos del TerraMow V1000.");
  });
  it("article cita el título", () => {
    expect(whatsappMessage("article", "Mantenimiento")).toBe('Hola, leí la guía "Mantenimiento" y tengo una consulta.');
  });
  it("compare", () => {
    expect(whatsappMessage("compare")).toBe("Hola, no sé si me conviene el V600 o el V1000. ¿Me ayudan a elegir?");
  });
});

describe("whatsappUrl", () => {
  it("usa el número del sitio y codifica el mensaje", () => {
    const url = whatsappUrl("product", "TerraMow V600");
    expect(url.startsWith("https://wa.me/5492494318185?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1]!)).toBe("Hola, quiero consultar por el TerraMow V600.");
    expect(url).not.toContain(" ");
  });
});
