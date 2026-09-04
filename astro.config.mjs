// @ts-check
import { readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

/** Extrae updatedDate o pubDate (AAAA-MM-DD) del frontmatter de un artículo; prefiere updatedDate. */
function frontmatterLastmod(markdown) {
  const re = /^(updatedDate|pubDate):\s*(\d{4}-\d{2}-\d{2})/gm;
  let updated;
  let pub;
  for (const m of markdown.matchAll(re)) {
    if (m[1] === "updatedDate") updated = m[2];
    else pub = m[2];
  }
  return updated ?? pub;
}

/** lastmod real para /blog/<slug>: fecha del frontmatter del artículo (updatedDate si existe, si no pubDate). */
function blogLastmod(pathname) {
  const match = pathname.match(/^\/blog\/([^/]+)\/?$/);
  if (!match) return undefined;
  try {
    const markdown = readFileSync(new URL(`./src/content/blog/${match[1]}.md`, import.meta.url), "utf8");
    return frontmatterLastmod(markdown);
  } catch {
    return undefined;
  }
}

const buildDate = new Date().toISOString();

export default defineConfig({
  site: "https://www.robotscortacesped.com.ar",
  output: "static",
  trailingSlash: "never",
  build: { format: "directory" },
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith("/404"),
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        return { ...item, lastmod: blogLastmod(pathname) ?? buildDate };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
