import { describe, expect, it } from "vitest";
import { CONSULT_LABEL, formatARS, formatDecimal, formatNumber, formatUSD, usdToArs } from "@/lib/price";

describe("price", () => {
  it("formatNumber usa separador de miles es-AR", () => {
    expect(formatNumber(2100)).toBe("2.100");
    expect(formatNumber(2520000)).toBe("2.520.000");
    expect(formatNumber(600)).toBe("600");
  });
  it("formatUSD", () => {
    expect(formatUSD(2100)).toBe("USD 2.100");
    expect(formatUSD(null)).toBe(CONSULT_LABEL);
    expect(CONSULT_LABEL).toBe("Consultar precio");
  });
  it("formatARS", () => {
    expect(formatARS(2520000)).toBe("$ 2.520.000");
  });
  it("usdToArs redondea", () => {
    expect(usdToArs(2100, 1200)).toBe(2520000);
    expect(usdToArs(2100, 1234.567)).toBe(2592591);
  });
  it("formatDecimal usa coma decimal es-AR", () => {
    expect(formatDecimal(32.5)).toBe("32,5");
    expect(formatDecimal(18)).toBe("18");
  });
});
