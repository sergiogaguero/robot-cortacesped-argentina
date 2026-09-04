import { site } from "@/config/site";
import type { Product } from "@/content/schemas";
import { absoluteUrl } from "@/lib/seo";

const CONTEXT = "https://schema.org";

export function ldOrganization(): object {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: absoluteUrl("/logo.png"),
    description: `${site.brandClaim}. Robots cortacésped con navegación por cámara e inteligencia artificial, sin cables perimetrales.`,
    address: { "@type": "PostalAddress", addressLocality: site.location.locality, addressCountry: site.location.country },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: site.email,
      telephone: `+${site.whatsapp.number}`,
      availableLanguage: "es",
    },
    sameAs: [site.instagram],
  };
}

export function ldWebSite(): object {
  return { "@context": CONTEXT, "@type": "WebSite", name: site.name, url: site.url, description: site.tagline, inLanguage: "es-AR" };
}

export function ldBreadcrumb(items: { name: string; url: string }[]): object {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export function ldProduct(p: Product, opts: { url: string; imageUrl: string }): object {
  const offers =
    p.priceUSD === null
      ? undefined
      : {
          "@type": "Offer",
          url: opts.url,
          price: p.priceUSD,
          priceCurrency: "USD",
          availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: site.name },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingDestination: { "@type": "DefinedRegion", addressCountry: "AR" },
          },
        };
  return {
    "@context": CONTEXT,
    "@type": "Product",
    name: `${p.name} - Robot cortacésped con IA`,
    description: p.seo.description,
    image: opts.imageUrl,
    url: opts.url,
    sku: p.slug,
    model: p.model,
    brand: { "@type": "Brand", name: "TerraMow" },
    category: "Robot cortacésped",
    additionalProperty: [
      { "@type": "PropertyValue", name: "Cobertura", value: `Hasta ${p.coverageM2} m²` },
      { "@type": "PropertyValue", name: "Navegación", value: "Cámara con IA, sin cables" },
      { "@type": "PropertyValue", name: "Control", value: "App iOS/Android" },
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

export function ldArticle(a: { title: string; description: string; url: string; imageUrl: string; pubDate: Date; updatedDate?: Date }): object {
  const org = { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") } };
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
  };
}
