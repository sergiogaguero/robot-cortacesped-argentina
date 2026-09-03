import { site } from "@/config/site";
import { getUsdArsRate, type RateSource } from "@/lib/exchange-rate";
import { formatARS, formatUSD, usdToArs } from "@/lib/price";

const STORAGE_KEY = "usd-ars-rate";
type Cached = { rate: number; source: RateSource; at: number };

async function loadRate(): Promise<Cached> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as Cached;
      if (Date.now() - cached.at < site.exchangeRate.ttlMinutes * 60_000) return cached;
    }
  } catch {
    /* localStorage no disponible */
  }
  const fresh = await getUsdArsRate({ timeoutMs: site.exchangeRate.timeoutMs, fallback: site.exchangeRate.fallback });
  const cached: Cached = { ...fresh, at: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    /* sin persistencia */
  }
  return cached;
}

const prices = Array.from(document.querySelectorAll<HTMLElement>("[data-price]"));
const usdAttr = document.querySelector<HTMLElement>("[data-price-usd]")?.dataset.priceUsd ?? "";
const usd = Number(usdAttr);
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-currency]"));
const note = document.getElementById("price-note");

if (usd > 0 && buttons.length > 0) {
  let rateInfo: Cached | null = null;

  const render = (currency: string): void => {
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.currency === currency));
    if (currency === "ARS" && rateInfo) {
      const text = formatARS(usdToArs(usd, rateInfo.rate));
      for (const el of prices) el.textContent = text;
      if (note) {
        note.textContent =
          rateInfo.source === "fallback"
            ? "Cotización de referencia. El precio final se define con la cotización del Banco Nación del día de la compra."
            : "Precio de referencia según la cotización del Banco Nación. El precio final se define con la cotización del día de la compra.";
        note.hidden = false;
      }
    } else {
      const text = formatUSD(usd);
      for (const el of prices) el.textContent = text;
      if (note) note.hidden = true;
    }
  };

  for (const b of buttons) {
    b.addEventListener("click", async () => {
      const currency = b.dataset.currency ?? "USD";
      if (currency === "ARS" && !rateInfo) {
        b.disabled = true;
        rateInfo = await loadRate();
        b.disabled = false;
      }
      render(currency);
    });
  }
}
