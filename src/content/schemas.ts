import { z } from "astro/zod";

/** Marcas con las que trabajamos. Sumar una marca = agregarla acá y en `brands` de src/config/site.ts. */
export const brandSchema = z.enum(["TerraMow", "Hookii"]);
export type Brand = z.infer<typeof brandSchema>;

/** Slug de producto = nombre del archivo en src/content/products (y la URL /productos/<slug>). */
export const productSlugSchema = z.string().regex(/^[a-z0-9-]+$/);
export type ProductSlug = z.infer<typeof productSlugSchema>;

/** Dónde se muestra cada pregunta: "home", "comparativa" o el slug de un producto. */
export const faqScopeSchema = z.string().regex(/^[a-z0-9-]+$/);
export type FaqScope = z.infer<typeof faqScopeSchema>;

/** Versión de un mismo modelo que cambia superficie y precio (ej. Neomow X2 de 3000, 4000 y 6000 m²). */
const variantSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  coverageM2: z.number().int().positive(),
  priceUSD: z.number().positive().nullable(),
});

const specItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const productSchema = z.object({
  name: z.string().min(1),
  slug: productSlugSchema,
  brand: brandSchema,
  /** Línea o familia que se muestra arriba del nombre (ej. "V Series", "Neomow X2"). */
  series: z.string().min(1),
  /** Para quién es, en pocas palabras: se usa en tarjetas y comparativas. */
  segment: z.string().min(1),
  /** Tecnología de navegación, en pocas palabras. */
  navigation: z.string().min(1),
  model: z.string().min(1),
  /** Borrador: no se publica (ej. falta la foto o confirmar la ficha). */
  draft: z.boolean().default(false),
  tagline: z.string().min(1),
  /** Superficie máxima; con variantes, la de la versión más grande. */
  coverageM2: z.number().int().positive(),
  /** Precio; con variantes, el de la versión más barata ("desde"). */
  priceUSD: z.number().positive().nullable(),
  variants: z.array(variantSchema).min(2).optional(),
  inStock: z.boolean(),
  highlights: z.array(z.string().min(1)).min(3).max(5),
  fit: z.object({
    maxSlopeDeg: z.number().positive(),
    maxSlopePct: z.number().positive(),
    obstacles: z.boolean(),
    // null = dato todavía no confirmado por el fabricante: no se muestra.
    multiZone: z.boolean().nullable(),
    noiseDb: z.number().positive().nullable(),
    areaPerHourM2: z.string().min(1).nullable(),
    runtimeMin: z.number().int().positive().nullable(),
  }),
  specs: z
    .array(
      z.object({
        category: z.string().min(1),
        items: z.array(specItemSchema).min(1),
      }),
    )
    .min(1),
  image: z.string().regex(/^[a-z0-9-]+\.(png|jpg|webp)$/),
  imageAlt: z.string().min(10),
  ogImage: z.string().startsWith("/og/"),
  why: z.object({ title: z.string().min(1), text: z.string().min(50) }),
  /** Aclaración debajo de la ficha técnica (ej. "ficha completa a confirmar"). */
  specsNote: z.string().min(10).optional(),
  seo: z.object({
    title: z.string().min(10).max(60),
    description: z.string().min(50).max(160),
  }),
});
export type Product = z.infer<typeof productSchema>;

export const faqSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(20),
  scope: z.array(faqScopeSchema).min(1),
  order: z.number().int(),
  link: z.object({ label: z.string().min(1), href: z.string().startsWith("/") }).optional(),
});
export type Faq = z.infer<typeof faqSchema>;

export const blogSchema = z.object({
  title: z.string().min(10).max(60),
  description: z.string().min(50).max(160),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  coverAlt: z.string().min(10),
  tags: z.array(z.string().min(1)).min(1),
  relatedProducts: z.array(productSlugSchema).default([]),
  /** Puntos clave al principio del artículo: lo que más citan Google y los buscadores con IA. */
  summary: z.array(z.string().min(20)).min(2).max(6).optional(),
  draft: z.boolean().default(false),
});
export type BlogFrontmatter = z.infer<typeof blogSchema>;
