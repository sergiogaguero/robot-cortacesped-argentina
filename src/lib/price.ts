const formatter = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

export const CONSULT_LABEL = "Consultar precio";

export function formatNumber(n: number): string {
  return formatter.format(n);
}

export function formatUSD(usd: number | null): string {
  return usd === null ? CONSULT_LABEL : `USD ${formatter.format(usd)}`;
}

export function formatARS(ars: number): string {
  return `$ ${formatter.format(ars)}`;
}

export function usdToArs(usd: number, rate: number): number {
  return Math.round(usd * rate);
}
