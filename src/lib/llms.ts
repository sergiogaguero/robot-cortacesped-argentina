import { getCollection } from "astro:content";
import { site } from "@/config/site";
import { howItWorks } from "@/data/how-it-works";

/**
 * Textos para /llms.txt y /llms-full.txt (formato de llmstxt.org): un resumen del sitio en Markdown
 * que los buscadores y asistentes con IA leen para entender qué ofrecemos y citarlo bien.
 * Se arma con los mismos datos que las páginas, así nunca queda desactualizado.
 */
const url = (path: string) => `${site.url}${path}`;

async function datos() {
  const products = (await getCollection("products")).map((p) => p.data).sort((a, b) => a.coverageM2 - b.coverageM2);
  const faqs = (await getCollection("faq")).map((f) => f.data).sort((a, b) => a.order - b.order);
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  return { products, faqs, posts };
}

function encabezado(): string {
  return [
    `# ${site.name}`,
    "",
    `> ${site.brandClaim} en Argentina. Vendemos robots cortacésped TerraMow que se guían con cámaras e inteligencia artificial, sin cable perimetral ni antenas RTK. Envíos a todo el país, garantía del fabricante y soporte técnico local. La venta y las consultas se hacen por WhatsApp.`,
    "",
    `- Sitio: ${site.url}`,
    `- WhatsApp: ${site.whatsapp.display} (https://wa.me/${site.whatsapp.number})`,
    `- Email: ${site.email}`,
    `- Instagram: ${site.instagram}`,
    `- Ubicación: ${site.location.locality}, Argentina. Envíos a todo el país.`,
  ].join("\n");
}

function precio(p: { priceUSD: number | null; inStock: boolean }): string {
  if (p.priceUSD === null) return "precio a consultar";
  return `precio de referencia USD ${p.priceUSD.toLocaleString("es-AR")} (el precio del día en pesos se confirma por WhatsApp)${p.inStock ? "" : ", sin stock por ahora"}`;
}

export async function llmsTxt(): Promise<string> {
  const { products, posts } = await datos();
  return [
    encabezado(),
    "",
    "## Productos",
    "",
    ...products.map((p) => `- [${p.name}](${url(`/productos/${p.slug}`)}): ${p.tagline}. Hasta ${p.coverageM2} m², ${p.fit.runtimeMin} minutos por carga, pendientes de hasta ${p.fit.maxSlopeDeg}°; ${precio(p)}.`),
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
  const out: string[] = [encabezado(), ""];
  out.push("## Productos", "");
  for (const p of products) {
    out.push(`### ${p.name}`, "", `${url(`/productos/${p.slug}`)}`, "", `${p.tagline}. ${p.why.text}`, "", `Precio: ${precio(p)}.`, "");
    for (const c of p.specs) {
      out.push(`**${c.category}**`, "", ...c.items.map((it) => `- ${it.label}: ${it.value}`), "");
    }
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
