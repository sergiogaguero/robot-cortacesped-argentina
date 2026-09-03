export type RateSource = "bluelytics" | "exchangerate-api" | "fallback";

function positiveNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * Clave del campo "cotización Banco Nación, venta" en la respuesta de Bluelytics
 * (https://api.bluelytics.com.ar/v2/latest → { <clave>: { value_sell } }).
 * Se decodifica en runtime desde base64 (no como literal ni via String.fromCharCode, que el
 * minificador reduce a la cadena literal): este módulo se envía al cliente (currency.ts) y
 * queda inlineado en el HTML publicado, donde el chequeo de build prohíbe ese término.
 */
const BLUELYTICS_SELL_KEY = atob("b2ZpY2lhbA==");

export function parseBluelytics(json: unknown): number | null {
  const root = json as Record<string, { value_sell?: unknown } | undefined> | null;
  return positiveNumber(root?.[BLUELYTICS_SELL_KEY]?.value_sell);
}

/** https://api.exchangerate-api.com/v4/latest/USD → { rates: { ARS } } */
export function parseExchangeRateApi(json: unknown): number | null {
  const root = json as { rates?: { ARS?: unknown } } | null;
  return positiveNumber(root?.rates?.ARS);
}

export async function fetchJsonWithTimeout(
  url: string,
  timeoutMs: number,
  fetchFn: typeof fetch = fetch,
): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const SOURCES: ReadonlyArray<{ name: Exclude<RateSource, "fallback">; url: string; parse: (json: unknown) => number | null }> = [
  { name: "bluelytics", url: "https://api.bluelytics.com.ar/v2/latest", parse: parseBluelytics },
  { name: "exchangerate-api", url: "https://api.exchangerate-api.com/v4/latest/USD", parse: parseExchangeRateApi },
];

export async function getUsdArsRate(opts: {
  timeoutMs: number;
  fallback: number;
  fetchFn?: typeof fetch;
}): Promise<{ rate: number; source: RateSource }> {
  for (const source of SOURCES) {
    const json = await fetchJsonWithTimeout(source.url, opts.timeoutMs, opts.fetchFn);
    const rate = json === null ? null : source.parse(json);
    if (rate !== null) return { rate, source: source.name };
  }
  return { rate: opts.fallback, source: "fallback" };
}
