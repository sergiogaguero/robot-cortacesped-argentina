import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { blogSchema, faqSchema, productSchema } from "./content/schemas";

const products = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/products" }),
  schema: productSchema,
});

const faq = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/faq" }),
  schema: faqSchema,
});

const blog = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/blog" }),
  schema: ({ image }) => blogSchema.extend({ cover: image() }),
});

export const collections = { products, faq, blog };
