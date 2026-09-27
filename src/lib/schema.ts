import { site } from "@/config/site";
import type { Product } from "@/content/schemas";
import { absoluteUrl } from "@/lib/seo";

const CONTEXT = "https://schema.org";
/** Identificadores estables: permiten que Google y los buscadores con IA unan las entidades entre páginas. */
export const ORG_ID = `${site.url}/#organizacion`;
export const WEBSITE_ID = `${site.url}/#sitio`;

export function ldOrganization(brands: string[] = ["TerraMow"]): object {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": ORG_ID,
    name: site.name,
    alternateName: "Robots Cortacésped Argentina",
    url: site.url,
    logo: absoluteUrl("/logo.png"),
    slogan: site.tagline,
    description: `${site.brandClaim}. Robots cortacésped con navegación por cámara e inteligencia artificial, sin cables perimetrales. Venta con envío a todo el país, garantía del fabricante y soporte técnico local.`,
    areaServed: { "@type": "Country", name: "Argentina" },
    brand: brands.map((name) => ({ "@type": "Brand", name })),
    knowsAbout: ["Robots cortacésped", "Cortadoras de césped robóticas", "Navegación por cámara con inteligencia artificial", "Navegación 3D LiDAR", "Mantenimiento de césped", "Mulching"],
    address: { "@type": "PostalAddress", addressLocality: site.location.locality, addressCountry: site.location.country },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      areaServed: "AR",
      email: site.email,
      telephone: `+${site.whatsapp.number}`,
      availableLanguage: "es",
    },
    sameAs: [site.instagram],
  };
}

export function ldWebSite(): object {
  return { "@context": CONTEXT, "@type": "WebSite", "@id": WEBSITE_ID, name: site.name, url: site.url, description: site.tagline, inLanguage: "es-AR", publisher: { "@id": ORG_ID } };
}

export function ldBreadcrumb(items: { name: string; url: string }[]): object {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export function ldProduct(p: Product, opts: { url: string; imageUrl: string }): object {
  const offer = (price: number, name?: string) => ({
    "@type": "Offer",
    ...(name ? { name } : {}),
    url: opts.url,
    price,
    priceCurrency: "USD",
    availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@type": "Organization", "@id": ORG_ID, name: site.name },
    // El precio en dólares se revisa seguido: vale por 30 días desde cada publicación del sitio.
    priceValidUntil: new Date(Date.now() + 30 * 86400e3).toISOString().slice(0, 10),
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "AR" },
    },
  });
  // Con versiones: rango de precios (AggregateOffer) con una oferta por versión.
  const priced = (p.variants ?? []).filter((v) => v.priceUSD !== null) as { label: string; priceUSD: number }[];
  const offers = priced.length
    ? {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: Math.min(...priced.map((v) => v.priceUSD)),
        highPrice: Math.max(...priced.map((v) => v.priceUSD)),
        offerCount: priced.length,
        offers: priced.map((v) => offer(v.priceUSD, `${p.name} de ${v.label}`)),
      }
    : p.priceUSD === null
      ? undefined
      : offer(p.priceUSD);
  return {
    "@context": CONTEXT,
    "@type": "Product",
    name: `${p.name} - Robot cortacésped con IA`,
    description: p.seo.description,
    image: opts.imageUrl,
    url: opts.url,
    sku: p.slug,
    model: p.model,
    brand: { "@type": "Brand", name: p.brand },
    category: "Robot cortacésped",
    additionalProperty: [
      { "@type": "PropertyValue", name: "Cobertura", value: p.variants ? p.variants.map((v) => v.label).join(", ") : `Hasta ${p.coverageM2} m²` },
      { "@type": "PropertyValue", name: "Navegación", value: `${p.navigation}, sin cable perimetral` },
      { "@type": "PropertyValue", name: "Control", value: "App iOS/Android" },
      // Todas las especificaciones de la ficha: los buscadores con IA responden con estos datos.
      ...p.specs.flatMap((c) => c.items.map((it) => ({ "@type": "PropertyValue", name: it.label, value: it.value }))),
    ],
    ...(offers ? { offers } : {}),
  };
}

export function ldFaq(items: { question: string; answer: string }[]): object {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
}

export function ldItemList(items: { name: string; url: string }[]): object {
  return {
    "@context": CONTEXT,
    "@type": "ItemList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: it.url })),
  };
}

export function ldHowTo(opts: { name: string; description: string; steps: { name: string; text: string }[] }): object {
  return {
    "@context": CONTEXT,
    "@type": "HowTo",
    name: opts.name,
    description: opts.description,
    step: opts.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })),
  };
}

export function ldArticle(a: { title: string; description: string; url: string; imageUrl: string; pubDate: Date; updatedDate?: Date; summary?: string[]; tags?: string[] }): object {
  const org = { "@type": "Organization", "@id": ORG_ID, name: site.name, url: site.url, logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") } };
  return {
    "@context": CONTEXT,
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description,
    image: a.imageUrl,
    url: a.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": a.url },
    datePublished: a.pubDate.toISOString(),
    dateModified: (a.updatedDate ?? a.pubDate).toISOString(),
    author: org,
    publisher: org,
    inLanguage: "es-AR",
    isPartOf: { "@id": WEBSITE_ID },
    ...(a.summary?.length ? { abstract: a.summary.join(" ") } : {}),
    ...(a.tags?.length ? { keywords: a.tags.join(", ") } : {}),
  };
}

export function ldAboutPage(opts: { url: string; description: string }): object {
  return { "@context": CONTEXT, "@type": "AboutPage", url: opts.url, description: opts.description, inLanguage: "es-AR", about: { "@id": ORG_ID }, isPartOf: { "@id": WEBSITE_ID } };
}
