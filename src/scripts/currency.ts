import { site } from "@/config/site";
import { getUsdArsRate, type RateSource } from "@/lib/exchange-rate";
import { formatARS, formatUSD, usdToArs } from "@/lib/price";
import { whatsappUrl } from "@/lib/whatsapp";

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
const usdHolder = document.querySelector<HTMLElement>("[data-price-usd]");
// El precio en USD puede cambiar si el producto tiene versiones (ver más abajo): se lee cada vez.
const currentUsd = (): number => Number(usdHolder?.dataset.priceUsd ?? "");
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-currency]"));
const note = document.getElementById("price-note");
let currency = "USD";
let rateInfo: Cached | null = null;

if (currentUsd() > 0 && buttons.length > 0) {
  const render = (next: string): void => {
    currency = next;
    const usd = currentUsd();
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
      const next = b.dataset.currency ?? "USD";
      if (next === "ARS" && !rateInfo) {
        for (const btn of buttons) btn.disabled = true;
        rateInfo = await loadRate();
        for (const btn of buttons) btn.disabled = false;
      }
      render(next);
    });
  }
  document.addEventListener("variant-change", () => render(currency));
}

// Versiones del mismo modelo (ej. Neomow X2 de 3000, 4000 y 6000 m²): cambian precio y consulta.
const variantButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-variant]"));
const productName = document.querySelector("#price-block h1")?.textContent?.trim() ?? "";
for (const b of variantButtons) {
  b.addEventListener("click", () => {
    for (const other of variantButtons) other.setAttribute("aria-pressed", String(other === b));
    const label = b.dataset.variantLabel ?? "";
    if (usdHolder) usdHolder.dataset.priceUsd = b.dataset.variantUsd ?? "";
    for (const el of document.querySelectorAll("[data-variant-name]")) el.textContent = label;
    // Los botones de WhatsApp de la ficha consultan por la versión elegida.
    for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me/"][data-product]')) {
      a.href = whatsappUrl("product", `${productName} de ${label}`);
    }
    if (buttons.length === 0) for (const el of prices) el.textContent = formatUSD(currentUsd() || null);
    document.dispatchEvent(new Event("variant-change"));
  });
}
