import { getCollection } from "astro:content";
import { site } from "@/config/site";
import { howItWorks } from "@/data/how-it-works";
import { getProducts, joinBrands } from "@/lib/products";

/**
 * Textos para /llms.txt y /llms-full.txt (formato de llmstxt.org): un resumen del sitio en Markdown
 * que los buscadores y asistentes con IA leen para entender qué ofrecemos y citarlo bien.
 * Se arma con los mismos datos que las páginas, así nunca queda desactualizado.
 */
const url = (path: string) => `${site.url}${path}`;

async function datos() {
  const products = (await getProducts()).map((p) => p.data);
  const visibleScopes = new Set(["home", "comparativa", ...products.map((p) => p.slug)]);
  const faqs = (await getCollection("faq", ({ data }) => data.scope.some((s) => visibleScopes.has(s)))).map((f) => f.data).sort((a, b) => a.order - b.order);
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  return { products, faqs, posts };
}

function encabezado(brands: string[]): string {
  const lineas = brands.includes("Hookii")
    ? "TerraMow para jardines residenciales (navegación por cámaras con IA) y Hookii para trabajo pesado en quintas, campos y parques (3D LiDAR + visión con IA). Ninguno necesita cable perimetral ni antenas RTK."
    : "Se guían con cámaras e inteligencia artificial, sin cable perimetral ni antenas RTK.";
  return [
    `# ${site.name}`,
    "",
    `> Vendemos robots cortacésped ${joinBrands(brands)} en Argentina. ${lineas} Envíos a todo el país y soporte técnico local. La venta y las consultas se hacen por WhatsApp.`,
    "",
    `- Sitio: ${site.url}`,
    `- WhatsApp: ${site.whatsapp.display} (https://wa.me/${site.whatsapp.number})`,
    `- Email: ${site.email}`,
    `- Instagram: ${site.instagram}`,
    `- Ubicación: ${site.location.locality}, Argentina. Envíos a todo el país.`,
  ].join("\n");
}

function precio(p: { priceUSD: number | null; inStock: boolean; variants?: { label: string; priceUSD: number | null }[] }): string {
  if (p.variants) return `versiones de ${p.variants.map((v) => `${v.label} (USD ${v.priceUSD?.toLocaleString("es-AR") ?? "a consultar"})`).join(", ")}; precios de referencia, el precio del día en pesos se confirma por WhatsApp`;
  if (p.priceUSD === null) return "precio a consultar";
  return `precio de referencia USD ${p.priceUSD.toLocaleString("es-AR")} (el precio del día en pesos se confirma por WhatsApp)${p.inStock ? "" : ", sin stock por ahora"}`;
}

export async function llmsTxt(): Promise<string> {
  const { products, posts } = await datos();
  return [
    encabezado([...new Set(products.map((p) => p.brand))]),
    "",
    "## Productos",
    "",
    ...products.map((p) => `- [${p.name}](${url(`/productos/${p.slug}`)}): ${p.tagline}. ${p.navigation}; hasta ${p.coverageM2} m²${p.fit.runtimeMin ? `, ${p.fit.runtimeMin} minutos por carga` : ""}, pendientes de hasta ${p.fit.maxSlopeDeg}°; ${precio(p)}.`),
    `- [Todos los modelos y precios](${url("/productos")}): comparativa de superficie, tecnología, pendiente y precio.`,
    `- [TerraMow V600 vs V1000](${url("/productos/v600-vs-v1000")}): cuál elegir según el tamaño del jardín.`,
    "",
    "## Guías",
    "",
    `- [Cómo funciona un robot cortacésped con IA](${url("/tecnologia")}): mapeo, planificación de ruta, corte autónomo y control desde la app.`,
    ...posts.map((p) => `- [${p.data.title}](${url(`/blog/${p.id}`)}): ${p.data.description}`),
    "",
    "## Ayuda",
    "",
    `- [Preguntas frecuentes](${url("/preguntas-frecuentes")}): cables, pasto cortado, seguridad, mantenimiento, envíos y garantía.`,
    `- [Quiénes somos](${url("/nosotros")}): cómo trabajamos y cómo contactarnos.`,
    "",
    "## Optional",
    "",
    `- [Versión completa de este resumen](${url("/llms-full.txt")}): fichas técnicas, preguntas frecuentes y guías completas.`,
    "",
  ].join("\n");
}

export async function llmsFullTxt(): Promise<string> {
  const { products, faqs, posts } = await datos();
  const out: string[] = [encabezado([...new Set(products.map((p) => p.brand))]), ""];
  out.push("## Productos", "");
  for (const p of products) {
    out.push(`### ${p.name}`, "", `${url(`/productos/${p.slug}`)}`, "", `Marca: ${p.brand}. ${p.tagline}. ${p.why.text}`, "", `Precio: ${precio(p)}.`, "");
    for (const c of p.specs) {
      out.push(`**${c.category}**`, "", ...c.items.map((it) => `- ${it.label}: ${it.value}`), "");
    }
    if (p.specsNote) out.push(p.specsNote, "");
  }
  out.push("## Cómo funciona", "");
  for (const s of howItWorks) out.push(`${s.step}. **${s.title}.** ${s.description} ${s.detail}`);
  out.push("", "## Preguntas frecuentes", "");
  for (const f of faqs) out.push(`### ${f.question}`, "", f.answer, "");
  out.push("## Guías", "");
  for (const p of posts) {
    out.push(`### ${p.data.title}`, "", `${url(`/blog/${p.id}`)} (actualizado el ${(p.data.updatedDate ?? p.data.pubDate).toISOString().slice(0, 10)})`, "");
    if (p.data.summary) out.push("En resumen:", "", ...p.data.summary.map((s) => `- ${s}`), "");
    // Links internos del artículo, absolutos para que sirvan fuera del sitio.
    out.push((p.body ?? "").replace(/\]\(\//g, `](${site.url}/`).trim(), "");
  }
  return out.join("\n");
}
