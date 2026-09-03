import type { ImageMetadata } from "astro";

const images = import.meta.glob<{ default: ImageMetadata }>("/src/assets/products/*.{png,jpg,webp}", { eager: true });

/** Devuelve la imagen de `src/assets/products/<file>` para usar con <Image>. */
export function productImage(file: string): ImageMetadata {
  const hit = images[`/src/assets/products/${file}`];
  if (!hit) throw new Error(`Imagen de producto no encontrada: src/assets/products/${file}`);
  return hit.default;
}
