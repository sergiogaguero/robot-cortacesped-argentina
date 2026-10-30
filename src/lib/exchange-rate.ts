export type RateSource = "bluelytics" | "dolarapi" | "fallback";

function positiveNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

/** https://api.bluelytics.com.ar/v2/latest → { blue: { value_sell } } (dólar blue, venta) */
export function parseBluelytics(json: unknown): number | null {
  const root = json as { blue?: { value_sell?: unknown } } | null;
  return positiveNumber(root?.blue?.value_sell);
}

/** https://dolarapi.com/v1/dolares/blue → { venta } (dólar blue, venta) */
export function parseDolarApi(json: unknown): number | null {
  const root = json as { venta?: unknown } | null;
  return positiveNumber(root?.venta);
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
  { name: "dolarapi", url: "https://dolarapi.com/v1/dolares/blue", parse: parseDolarApi },
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
