import { describe, expect, it } from "vitest";
import {
  fetchJsonWithTimeout,
  getUsdArsRate,
  parseBluelytics,
  parseDolarApi,
} from "@/lib/exchange-rate";

const jsonResponse = (body: unknown, ok = true) =>
  ({ ok, json: async () => body }) as unknown as Response;

describe("parsers", () => {
  it("bluelytics lee blue.value_sell (dólar blue, venta)", () => {
    expect(parseBluelytics({ oficial: { value_sell: 1100 }, blue: { value_sell: 1250.5 } })).toBe(1250.5);
  });
  it("bluelytics devuelve null si falta o no es número positivo", () => {
    expect(parseBluelytics({})).toBeNull();
    expect(parseBluelytics({ oficial: { value_sell: 1250 } })).toBeNull();
    expect(parseBluelytics({ blue: { value_sell: "1250" } })).toBeNull();
    expect(parseBluelytics({ blue: { value_sell: 0 } })).toBeNull();
    expect(parseBluelytics(null)).toBeNull();
  });
  it("dolarapi lee venta", () => {
    expect(parseDolarApi({ casa: "blue", compra: 1280, venta: 1300 })).toBe(1300);
    expect(parseDolarApi({})).toBeNull();
  });
});

describe("fetchJsonWithTimeout", () => {
  it("devuelve el JSON si la respuesta es ok", async () => {
    const fetchFn = (async () => jsonResponse({ a: 1 })) as unknown as typeof fetch;
    expect(await fetchJsonWithTimeout("http://x", 100, fetchFn)).toEqual({ a: 1 });
  });
  it("devuelve null si la respuesta no es ok o falla", async () => {
    const notOk = (async () => jsonResponse({}, false)) as unknown as typeof fetch;
    expect(await fetchJsonWithTimeout("http://x", 100, notOk)).toBeNull();
    const throws = (async () => { throw new Error("red"); }) as unknown as typeof fetch;
    expect(await fetchJsonWithTimeout("http://x", 100, throws)).toBeNull();
  });
  it("aborta por timeout", async () => {
    const slow = ((_: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      })) as unknown as typeof fetch;
    expect(await fetchJsonWithTimeout("http://x", 20, slow)).toBeNull();
  });
});

describe("getUsdArsRate", () => {
  it("usa bluelytics si responde", async () => {
    const fetchFn = (async (url: string) =>
      url.includes("bluelytics") ? jsonResponse({ blue: { value_sell: 1250 } }) : jsonResponse({ venta: 1300 })) as unknown as typeof fetch;
    expect(await getUsdArsRate({ timeoutMs: 100, fallback: 1200, fetchFn })).toEqual({ rate: 1250, source: "bluelytics" });
  });
  it("cae a dolarapi si bluelytics falla", async () => {
    const fetchFn = (async (url: string) =>
      url.includes("bluelytics") ? jsonResponse({}, false) : jsonResponse({ venta: 1300 })) as unknown as typeof fetch;
    expect(await getUsdArsRate({ timeoutMs: 100, fallback: 1200, fetchFn })).toEqual({ rate: 1300, source: "dolarapi" });
  });
  it("cae al fallback si las dos fallan", async () => {
    const fetchFn = (async () => { throw new Error("sin red"); }) as unknown as typeof fetch;
    expect(await getUsdArsRate({ timeoutMs: 100, fallback: 1200, fetchFn })).toEqual({ rate: 1200, source: "fallback" });
  });
});
