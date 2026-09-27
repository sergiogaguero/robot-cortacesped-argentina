import { getCollection, type CollectionEntry } from "astro:content";

/** Productos publicados (sin borradores), de menor a mayor superficie. */
export async function getProducts(): Promise<CollectionEntry<"products">[]> {
  return (await getCollection("products", ({ data }) => !data.draft)).sort((a, b) => a.data.coverageM2 - b.data.coverageM2);
}

/** Rango de superficie para mostrar: "Hasta 1200 m²" o "3000 a 6000 m²" si tiene variantes. */
export function coverageRange(p: CollectionEntry<"products">["data"], fmt: (n: number) => string): string {
  if (!p.variants) return `Hasta ${fmt(p.coverageM2)} m²`;
  const areas = p.variants.map((v) => v.coverageM2);
  return `${fmt(Math.min(...areas))} a ${fmt(Math.max(...areas))} m²`;
}

/** Marcas con productos publicados, en orden de aparición por superficie (ej. ["TerraMow", "Hookii"]). */
export async function getBrands(): Promise<string[]> {
  return [...new Set((await getProducts()).map((p) => p.data.brand))];
}

/** "TerraMow" · "TerraMow y Hookii" · "A, B y C". */
export function joinBrands(brands: string[]): string {
  return brands.length < 2 ? (brands[0] ?? "") : `${brands.slice(0, -1).join(", ")} y ${brands.at(-1)}`;
}
