// Precios sueltos (tarjetas, tablas, listados): el HTML trae el precio en USD y acá se pasa a pesos
// con el dólar blue. Cada uno se marca con <span data-usd="1234">USD 1.234</span>.
import { loadRate } from "@/lib/rate-cache";
import { formatARS, usdToArs } from "@/lib/price";

const els = Array.from(document.querySelectorAll<HTMLElement>("[data-usd]"));
if (els.length > 0) {
  void loadRate().then(({ rate }) => {
    for (const el of els) {
      const usd = Number(el.dataset.usd);
      if (usd > 0) {
        el.textContent = formatARS(usdToArs(usd, rate));
        el.title = `USD ${new Intl.NumberFormat("es-AR").format(usd)} · referencia en pesos al dólar blue del día`;
      }
    }
  });
}
