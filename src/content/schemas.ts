import { z } from "astro/zod";

export const productSlugSchema = z.enum(["v600", "v1000"]);
export type ProductSlug = z.infer<typeof productSlugSchema>;

export const faqScopeSchema = z.enum(["home", "v600", "v1000", "comparativa"]);
export type FaqScope = z.infer<typeof faqScopeSchema>;

const specItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const productSchema = z.object({
  name: z.string().min(1),
  slug: productSlugSchema,
  model: z.string().min(1),
  tagline: z.string().min(1),
  coverageM2: z.number().int().positive(),
  priceUSD: z.number().positive().nullable(),
  inStock: z.boolean(),
  highlights: z.array(z.string().min(1)).min(3).max(5),
  fit: z.object({
    maxSlopeDeg: z.number().positive(),
    maxSlopePct: z.number().positive(),
    obstacles: z.boolean(),
    multiZone: z.boolean(),
    noiseDb: z.number().positive(),
    areaPerHourM2: z.string().min(1),
    runtimeMin: z.number().int().positive(),
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
  draft: z.boolean().default(false),
});
export type BlogFrontmatter = z.infer<typeof blogSchema>;
