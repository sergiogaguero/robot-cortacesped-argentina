import { loadRate, type CachedRate } from "@/lib/rate-cache";
import { formatARS, formatUSD, usdToArs } from "@/lib/price";
import { whatsappUrl } from "@/lib/whatsapp";

const prices = Array.from(document.querySelectorAll<HTMLElement>("[data-price]"));
const usdHolder = document.querySelector<HTMLElement>("[data-price-usd]");
// El precio en USD puede cambiar si el producto tiene versiones (ver más abajo): se lee cada vez.
const currentUsd = (): number => Number(usdHolder?.dataset.priceUsd ?? "");
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-currency]"));
const note = document.getElementById("price-note");
// Arranca en pesos (dólar blue); el botón USD muestra el precio de lista en dólares.
let currency = "ARS";
let rateInfo: CachedRate | null = null;

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
            ? "Precio de referencia en pesos. El precio final se define con la cotización del dólar blue del día de la compra."
            : `Precio de referencia en pesos al dólar blue del día (USD ${new Intl.NumberFormat("es-AR").format(usd)}). El precio final se define con la cotización del día de la compra.`;
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
  void loadRate().then((r) => {
    rateInfo = r;
    render(currency);
  });
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
