import type { Faq } from "@/content/schemas";

/** Quita el link de las FAQ que apuntan a /blog/<id> cuando ese artículo no está publicado. */
export function withPublishedLinks(faqs: Faq[], publishedBlogIds: string[]): Faq[] {
  const published = new Set(publishedBlogIds);
  return faqs.map((f) => {
    const copy: Faq = { ...f };
    const match = copy.link?.href.match(/^\/blog\/([^/#?]+)/);
    if (match && !published.has(match[1]!)) delete copy.link;
    return copy;
  });
}
