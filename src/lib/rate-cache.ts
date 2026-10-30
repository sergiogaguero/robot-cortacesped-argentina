import { site } from "@/config/site";
import { getUsdArsRate, type RateSource } from "@/lib/exchange-rate";

// Cotización del dólar blue guardada en el navegador por site.exchangeRate.ttlMinutes.
// La clave incluye "blue" para no reusar cotizaciones oficiales que hayan quedado guardadas.
const STORAGE_KEY = "usd-ars-rate-blue";
export type CachedRate = { rate: number; source: RateSource; at: number };

let pending: Promise<CachedRate> | null = null;

export function loadRate(): Promise<CachedRate> {
  pending ??= (async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as CachedRate;
        if (Date.now() - cached.at < site.exchangeRate.ttlMinutes * 60_000) return cached;
      }
    } catch {
      /* localStorage no disponible */
    }
    const fresh = await getUsdArsRate({ timeoutMs: site.exchangeRate.timeoutMs, fallback: site.exchangeRate.fallback });
    const cached: CachedRate = { ...fresh, at: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch {
      /* sin persistencia */
    }
    return cached;
  })();
  return pending;
}
