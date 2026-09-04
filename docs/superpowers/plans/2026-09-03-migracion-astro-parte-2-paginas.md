# Migración a Astro + SEO — Plan de implementación · Parte 2: páginas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la home (layout persuasivo), las dos fichas de producto (con toggle USD/ARS y barra fija móvil), la comparativa V600 vs V1000 y la página de tecnología, sobre la base de la Parte 1.

**Architecture:** Cada página es un archivo en `src/pages/` que usa `BaseLayout` y compone componentes de `src/components/`. Los datos salen de las colecciones (`products`, `faq`, `blog`) y de `src/data/` (contenido editorial de tecnología). El JSON-LD de cada página se arma en el frontmatter con los builders `ld*()` y se pasa a `BaseLayout`. Solo tres scripts nuevos: `hero.ts`, `currency.ts`, `sticky-bar.ts`.

**Tech Stack:** el de la Parte 1. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-09-03-migracion-astro-seo-design.md` — implementa §6.2 a §6.5, §7.2, §7.5, §7.6, §9.1 (scripts `hero`, `currency`, `sticky-bar`). Requiere la Parte 1 terminada (`docs/superpowers/plans/2026-09-03-migracion-astro-parte-1-base.md`).

## Global Constraints

Las mismas de la Parte 1, y además:

- **Textos:** todos los copys de esta parte están en el plan; no inventar otros. Nunca la palabra `oficial`. Voseo.
- **Un solo `<h1>` por página.** Los componentes de sección usan `<h2>`; solo `Hero` (home) y `PriceBlock` (ficha) renderizan `<h1>`.
- **Links internos sin barra final:** `/tecnologia`, `/productos/v1000`, `/blog`, `/#productos`.
- **Imágenes:** siempre `<Image>` o `<Picture>` de `astro:assets` con `alt`, `width`/`height` y `loading` (`eager` solo para la imagen LCP del hero y la principal de la ficha).
- **Todo botón de WhatsApp** pasa por `WhatsAppButton` (o `WhatsAppFloat`) con un `wa` único por ubicación: `home-hero`, `home-cta`, `ficha-v1000-hero`, `ficha-v1000-sticky`, `ficha-v1000-cta`, `comparativa-v600`, `comparativa-v1000`, `comparativa-ayuda`, `tecnologia-cta`.
- Después de cada tarea: `npm run build` verde (incluye los 4 chequeos) y `npm test` verde. Cada tarea termina con commit + push (Vercel actualiza el preview).

---

## Estructura de archivos de esta parte

| Archivo | Responsabilidad |
|---|---|
| `src/data/how-it-works.ts` | Los 4 pasos (texto + imagen), usados en home y tecnología |
| `src/data/tecnologia.ts` | Tablas de la página de tecnología |
| `src/components/SectionHeader.astro` | Eyebrow + título + texto, reutilizado en todas las secciones |
| `src/components/Hero.astro` + `src/scripts/hero.ts` | Hero de la home con video desktop / imagen móvil |
| `src/components/TrustStrip.astro` | Franja de confianza |
| `src/components/WhyRobot.astro` | 3 stats |
| `src/components/ProductCard.astro`, `ProductGrid.astro` | Tarjetas de producto |
| `src/components/WhichOne.astro` | Mini tabla V600 vs V1000 |
| `src/components/HowItWorks.astro` | 4 pasos (compacto en home, detallado en tecnología) |
| `src/components/ArticleCard.astro`, `ArticlesBlock.astro` | Guías (bloque condicional ≥ 3) |
| `src/components/FAQ.astro` | Acordeón nativo `<details>` |
| `src/components/CTAFinal.astro` | Cierre con WhatsApp |
| `src/components/Breadcrumbs.astro` | Migas |
| `src/components/PriceBlock.astro`, `FitCheck.astro`, `SpecsTable.astro`, `StickyBar.astro` | Ficha de producto |
| `src/scripts/currency.ts`, `sticky-bar.ts` | Interactividad de la ficha |
| `src/pages/index.astro`, `productos/[slug].astro`, `productos/v600-vs-v1000.astro`, `tecnologia.astro` | Páginas |

---

### Task 8: Home

**Files:**
- Create: `src/data/how-it-works.ts`, `src/lib/faq-links.ts`, `src/components/SectionHeader.astro`, `Hero.astro`, `TrustStrip.astro`, `WhyRobot.astro`, `ProductCard.astro`, `ProductGrid.astro`, `WhichOne.astro`, `HowItWorks.astro`, `ArticleCard.astro`, `ArticlesBlock.astro`, `FAQ.astro`, `CTAFinal.astro`, `src/scripts/hero.ts`
- Modify: `src/pages/index.astro` (reemplazo completo)
- Test: `tests/faq-links.test.ts`

**Interfaces:**
- Consumes: `BaseLayout`, `WhatsAppButton`, iconos, `site`, `formatNumber`, `formatUSD`, `productImage`, `ldBreadcrumb`, `ldFaq`, colecciones `products`, `faq`, `blog`.
- Produces:
  - `SectionHeader` props `{ eyebrow?: string; title: string; text?: string; align?: "center" | "left"; id?: string }` (renderiza `<h2 id={id}>`).
  - `withPublishedLinks(faqs: Faq[], publishedBlogIds: string[]): Faq[]` — devuelve las FAQ quitando el `link` cuando apunta a `/blog/<id>` y ese `id` no está publicado (así ningún artículo en borrador genera un link roto).
  - `HowItWorks` props `{ detailed?: boolean; showLink?: boolean }`.
  - `FAQ` props `{ items: { question: string; answer: string; link?: { label: string; href: string } }[]; title?: string; eyebrow?: string; id?: string; }`.
  - `CTAFinal` props `{ title?: string; text?: string; wa: string; context?: WaContext; subject?: string; product?: string; label?: string }`.
  - `ArticleCard` props `{ post: CollectionEntry<"blog"> }`.
  - `ProductCard` props `{ product: CollectionEntry<"products"> }`.
  - `WhichOne` props `{ products: CollectionEntry<"products">[] }`.
  - `TrustStrip` sin props.
  - `howItWorks: Step[]` con `Step = { step: number; title: string; description: string; detail: string; image: ImageMetadata; alt: string }`.

- [ ] **Step 1: `src/data/how-it-works.ts`**

```ts
import type { ImageMetadata } from "astro";
import stepCutting from "@/assets/step-cutting.jpg";
import stepMapping from "@/assets/step-mapping.jpg";
import stepMonitoring from "@/assets/step-monitoring.jpg";
import stepPlanning from "@/assets/step-planning.jpg";

export interface Step {
  step: number;
  title: string;
  description: string;
  detail: string;
  image: ImageMetadata;
  alt: string;
}

export const howItWorks: Step[] = [
  {
    step: 1,
    title: "Mapeo inteligente",
    description:
      "La primera vez que lo encendés, el robot recorre el jardín con sus cámaras y arma un mapa preciso del terreno: identifica dónde hay césped, dónde hay canteros, árboles, bordes y pendientes.",
    detail: "La visión con IA captura miles de puntos de referencia y genera un plano de tu espacio verde sin enterrar un solo cable.",
    image: stepMapping,
    alt: "Robot cortacésped recorriendo un jardín para mapearlo",
  },
  {
    step: 2,
    title: "Planificación de ruta",
    description:
      "Con el mapa listo, el algoritmo planifica la ruta de corte más eficiente: cubre cada rincón sin pasar dos veces por el mismo lugar y esquiva las zonas que le marcaste como prohibidas.",
    detail: "Patrones de corte adaptativos que se ajustan a la forma del terreno y optimizan el consumo de batería.",
    image: stepPlanning,
    alt: "Vista del mapa del jardín con la ruta de corte planificada en la app",
  },
  {
    step: 3,
    title: "Corte autónomo",
    description:
      "El robot corta solo. Detecta obstáculos en tiempo real, ajusta la velocidad en las pendientes y, cuando la batería baja, vuelve a la base a cargar y después sigue donde estaba.",
    detail: "Cuchillas flotantes que se adaptan a las irregularidades del terreno para un corte parejo incluso en superficies desniveladas.",
    image: stepCutting,
    alt: "Robot cortacésped cortando el pasto de forma autónoma",
  },
  {
    step: 4,
    title: "Monitoreo y control",
    description:
      "Desde la app TerraMow manejás todo: horarios, zonas, altura de corte e historial. Recibís avisos en tiempo real sobre el estado del robot, estés donde estés.",
    detail: "Mapa en vivo, estadísticas de corte y alertas de mantenimiento en tu celular.",
    image: stepMonitoring,
    alt: "Persona controlando el robot cortacésped desde la app en el celular",
  },
];
```

- [ ] **Step 2: `SectionHeader.astro`, `TrustStrip.astro`, `WhyRobot.astro`**

`src/components/SectionHeader.astro`:
```astro
---
interface Props {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "center" | "left";
  id?: string;
}
const { eyebrow, title, text, align = "center", id } = Astro.props;
---
<div class:list={["mb-12 lg:mb-16", align === "center" ? "text-center" : "text-left"]}>
  {eyebrow && <p class="mb-4 text-xs font-semibold tracking-widest text-primary uppercase">{eyebrow}</p>}
  <h2 id={id} class="mb-4 text-3xl font-bold md:text-5xl">{title}</h2>
  {text && <p class:list={["max-w-2xl text-lg text-muted-foreground", align === "center" && "mx-auto"]}>{text}</p>}
</div>
```

`src/components/TrustStrip.astro`:
```astro
---
import IconCheck from "@/components/icons/IconCheck.astro";
import { site } from "@/config/site";

const items = [site.brandClaim, "Garantía del fabricante", "Envíos a todo el país", "Soporte técnico local"];
---
<section class="border-y border-border bg-card" aria-label="Por qué comprarnos">
  <ul class="wrap grid grid-cols-2 gap-x-6 gap-y-4 py-6 md:grid-cols-4">
    {items.map((item) => (
      <li class="flex items-center gap-2 text-sm text-muted-foreground">
        <IconCheck class="shrink-0 text-primary" size={18} />
        <span>{item}</span>
      </li>
    ))}
  </ul>
</section>
```

`src/components/WhyRobot.astro`:
```astro
---
import SectionHeader from "@/components/SectionHeader.astro";

const stats = [
  { value: "+168 hs", label: "libres por año", text: "Es lo que lleva cortar 500 m² todas las semanas, más limpiar y guardar la máquina. El robot lo hace mientras vos hacés otra cosa." },
  { value: "< 54 dB", label: "de ruido", text: "Menos que una conversación normal. Puede trabajar de noche o mientras dormís la siesta sin molestar a nadie." },
  { value: "0 cables", label: "para instalar", text: "Sin cable perimetral enterrado ni antena RTK. Ponés la base, hacés el mapeo automático y ya está trabajando." },
];
---
<section class="py-24 lg:py-32">
  <div class="wrap">
    <SectionHeader eyebrow="¿Por qué un robot?" title="Tu tiempo vale más que cortar el pasto" text="Un robot cortacésped no es un lujo: es la diferencia entre ocuparte del jardín y disfrutarlo." />
    <div class="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
      {stats.map((s) => (
        <div class="rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary/30">
          <p class="text-4xl font-bold text-primary lg:text-5xl">{s.value}</p>
          <p class="mb-4 text-sm tracking-wide text-muted-foreground uppercase">{s.label}</p>
          <p class="text-sm leading-relaxed text-muted-foreground">{s.text}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 3: `Hero.astro` y `src/scripts/hero.ts`**

`src/components/Hero.astro`:
```astro
---
import { Picture } from "astro:assets";
import heroImage from "@/assets/hero-mower.jpg";
import WhatsAppButton from "@/components/WhatsAppButton.astro";
import { site } from "@/config/site";
---
<section class="relative flex min-h-[92svh] items-center overflow-hidden" aria-label="Robot cortacésped TerraMow con inteligencia artificial">
  <div class="absolute inset-0" aria-hidden="true">
    <Picture
      src={heroImage}
      formats={["avif", "webp"]}
      widths={[640, 1024, 1600]}
      sizes="100vw"
      alt=""
      loading="eager"
      fetchpriority="high"
      class="h-full w-full object-cover"
    />
    <video
      id="hero-video"
      class="absolute inset-0 hidden h-full w-full object-cover"
      muted
      loop
      playsinline
      preload="none"
      data-webm="/videos/hero.webm"
      data-mp4="/videos/hero.mp4"
    ></video>
    <div class="absolute inset-0 bg-linear-to-r from-background via-background/80 to-background/40"></div>
    <div class="absolute inset-0 bg-linear-to-t from-background via-transparent to-background/60"></div>
  </div>

  <div class="wrap relative z-10 pt-24 pb-16">
    <div class="max-w-2xl">
      <p class="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 backdrop-blur-sm animate-fade-up">
        <span class="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
        <span class="text-xs font-medium tracking-wider text-muted-foreground uppercase">{site.brandClaim}</span>
      </p>
      <h1 class="mb-6 text-4xl leading-tight font-bold animate-fade-up md:text-6xl lg:text-7xl" style="animation-delay: 0.1s">
        El futuro del<br /><span class="text-gradient">corte inteligente</span>
      </h1>
      <p class="mb-8 max-w-lg text-lg text-muted-foreground animate-fade-up md:text-xl" style="animation-delay: 0.2s">
        Robots cortacésped TerraMow con navegación por cámara e inteligencia artificial. Sin cables, sin antenas. Tu jardín perfecto sin mover un dedo.
      </p>
      <div class="flex flex-col gap-4 animate-fade-up sm:flex-row" style="animation-delay: 0.3s">
        <WhatsAppButton context="general" wa="home-hero" label="Consultar por WhatsApp" />
        <a href="#productos" class="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3.5 font-semibold text-foreground transition-colors hover:bg-secondary">Ver modelos</a>
      </div>
    </div>
  </div>
</section>

<script>
  import "@/scripts/hero.ts";
</script>
```

`src/scripts/hero.ts`:
```ts
// Carga y reproduce el video del hero solo en desktop y sin "reducir movimiento".
// En móvil no se descarga ni un byte: el <video> no tiene <source> hasta acá.
const video = document.getElementById("hero-video") as HTMLVideoElement | null;
const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (video && isDesktop && !reduceMotion) {
  const sources: Array<[string, string | undefined]> = [
    ["video/webm", video.dataset.webm],
    ["video/mp4", video.dataset.mp4],
  ];
  for (const [type, src] of sources) {
    if (!src) continue;
    const source = document.createElement("source");
    source.type = type;
    source.src = src;
    video.appendChild(source);
  }
  video.addEventListener("canplay", () => video.classList.remove("hidden"), { once: true });
  video.load();
  video.play().catch(() => {
    /* autoplay bloqueado: queda la imagen */
  });
}
```

- [ ] **Step 4: `ProductCard.astro`, `ProductGrid.astro`, `WhichOne.astro`**

`src/components/ProductCard.astro`:
```astro
---
import { Image } from "astro:assets";
import type { CollectionEntry } from "astro:content";
import IconArrowRight from "@/components/icons/IconArrowRight.astro";
import { formatNumber, formatUSD } from "@/lib/price";
import { productImage } from "@/lib/product-images";

interface Props { product: CollectionEntry<"products"> }
const { product } = Astro.props;
const p = product.data;
const href = `/productos/${p.slug}`;
---
<article>
  <a href={href} class="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 glow-border hover:border-primary/50 hover:animate-pulse-glow">
    <div class="aspect-square overflow-hidden bg-secondary/30">
      <Image src={productImage(p.image)} alt={p.imageAlt} width={800} height={800} format="webp" loading="lazy" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
    </div>
    <div class="p-6 lg:p-8">
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-2xl font-bold">{p.name}</h3>
        <IconArrowRight class="text-primary opacity-0 transition-all duration-300 group-hover:opacity-100" size={20} />
      </div>
      <p class="mb-1 font-medium text-primary">Hasta {formatNumber(p.coverageM2)} m²</p>
      <p class="mb-4 text-sm text-muted-foreground">{p.tagline}</p>
      <ul class="flex flex-wrap gap-2" aria-label={`Características del ${p.name}`}>
        {p.highlights.map((h) => <li class="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">{h}</li>)}
      </ul>
      {p.inStock ? (
        <p class="mt-6 rounded-lg bg-primary py-3 text-center font-semibold text-primary-foreground transition-opacity group-hover:opacity-90">{formatUSD(p.priceUSD)} · Ver ficha</p>
      ) : (
        <p class="mt-6 rounded-lg bg-muted py-3 text-center font-semibold text-muted-foreground">Sin stock · Consultá disponibilidad</p>
      )}
    </div>
  </a>
</article>
```

`src/components/ProductGrid.astro`:
```astro
---
import type { CollectionEntry } from "astro:content";
import ProductCard from "@/components/ProductCard.astro";
import SectionHeader from "@/components/SectionHeader.astro";

interface Props { products: CollectionEntry<"products">[] }
const { products } = Astro.props;
---
<section id="productos" class="scroll-mt-20 py-24 lg:py-32" aria-labelledby="productos-titulo">
  <div class="wrap">
    <SectionHeader id="productos-titulo" eyebrow="V Series" title="Elegí tu robot cortacésped" text="Visión artificial de triple cámara. Sin cables, sin antenas RTK. Configuración en minutos." />
    <div class="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
      {products.map((product) => <ProductCard product={product} />)}
    </div>
  </div>
</section>
```

`src/components/WhichOne.astro`:
```astro
---
import type { CollectionEntry } from "astro:content";
import IconArrowRight from "@/components/icons/IconArrowRight.astro";
import SectionHeader from "@/components/SectionHeader.astro";
import { formatNumber, formatUSD } from "@/lib/price";

interface Props { products: CollectionEntry<"products">[] }
const { products } = Astro.props;
const rows = [
  { label: "Superficie", value: (p: (typeof products)[number]) => `Hasta ${formatNumber(p.data.coverageM2)} m²` },
  { label: "Autonomía por carga", value: (p: (typeof products)[number]) => `${p.data.fit.runtimeMin} min` },
  { label: "Precio", value: (p: (typeof products)[number]) => formatUSD(p.data.priceUSD) },
  { label: "Disponibilidad", value: (p: (typeof products)[number]) => (p.data.inStock ? "En stock" : "Sin stock") },
];
---
<section class="bg-card py-24 lg:py-32">
  <div class="wrap">
    <SectionHeader eyebrow="¿Cuál me conviene?" title="V600 o V1000, en 10 segundos" text="La diferencia es la superficie y la autonomía. Todo lo demás —cámaras, IA, app, mulching— es igual." />
    <div class="mx-auto max-w-3xl overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border text-left">
            <th scope="col" class="py-3 pr-4 font-semibold">Característica</th>
            {products.map((p) => <th scope="col" class="py-3 pr-4 font-semibold text-primary">{p.data.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr class="border-b border-border">
              <th scope="row" class="py-3 pr-4 text-left font-medium">{r.label}</th>
              {products.map((p) => <td class="py-3 pr-4 text-muted-foreground">{r.value(p)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div class="mt-8 text-center">
      <a href="/productos/v600-vs-v1000" class="inline-flex items-center gap-2 rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10">
        Ver la comparativa completa <IconArrowRight size={16} />
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 5: `HowItWorks.astro`, `ArticleCard.astro`, `ArticlesBlock.astro`, `FAQ.astro`, `CTAFinal.astro`**

`src/components/HowItWorks.astro`:
```astro
---
import { Image } from "astro:assets";
import IconArrowRight from "@/components/icons/IconArrowRight.astro";
import SectionHeader from "@/components/SectionHeader.astro";
import { howItWorks } from "@/data/how-it-works";

interface Props { detailed?: boolean; showLink?: boolean }
const { detailed = false, showLink = true } = Astro.props;
---
<section class="py-24 lg:py-32">
  <div class="wrap">
    <SectionHeader eyebrow="Cómo funciona" title="Así trabaja el robot, paso a paso" text="Desde que lo encendés hasta que tu jardín está perfecto, sin que hagas nada." />
    <div class:list={["mx-auto max-w-5xl", detailed ? "space-y-8" : "grid gap-6 sm:grid-cols-2 lg:grid-cols-4"]}>
      {howItWorks.map((s) => (
        <article class:list={["rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30", detailed && "flex flex-col gap-6 lg:flex-row lg:p-8"]}>
          <div class:list={[detailed && "lg:w-1/3"]}>
            <p class="mb-2 text-xs font-bold tracking-wider text-primary uppercase">Paso {s.step}</p>
            <h3 class="mb-4 text-xl font-bold">{s.title}</h3>
            <Image src={s.image} alt={s.alt} width={640} height={640} format="webp" loading="lazy" class="aspect-square w-full rounded-xl object-cover" />
          </div>
          <div class:list={["mt-4 space-y-3", detailed && "lg:mt-0 lg:w-2/3"]}>
            <p class="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            {detailed && (
              <p class="rounded-xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
                <span class="font-semibold text-primary">Detalle técnico:</span> {s.detail}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
    {showLink && (
      <div class="mt-12 text-center">
        <a href="/tecnologia" class="inline-flex items-center gap-2 rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10">
          Ver la guía tecnológica completa <IconArrowRight size={16} />
        </a>
      </div>
    )}
  </div>
</section>
```

`src/components/ArticleCard.astro`:
```astro
---
import { Image } from "astro:assets";
import type { CollectionEntry } from "astro:content";

interface Props { post: CollectionEntry<"blog"> }
const { post } = Astro.props;
const d = post.data;
const date = d.pubDate.toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
---
<article class="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/30">
  <a href={`/blog/${post.id}`} class="block">
    <Image src={d.cover} alt={d.coverAlt} width={800} height={450} format="webp" loading="lazy" class="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105" />
    <div class="p-6">
      <p class="mb-2 text-xs text-muted-foreground"><time datetime={d.pubDate.toISOString()}>{date}</time> · {d.tags.join(" · ")}</p>
      <h3 class="mb-2 text-lg font-semibold leading-snug group-hover:text-primary">{d.title}</h3>
      <p class="text-sm leading-relaxed text-muted-foreground">{d.description}</p>
    </div>
  </a>
</article>
```

`src/components/ArticlesBlock.astro`:
```astro
---
import { getCollection } from "astro:content";
import ArticleCard from "@/components/ArticleCard.astro";
import IconArrowRight from "@/components/icons/IconArrowRight.astro";
import SectionHeader from "@/components/SectionHeader.astro";

const posts = (await getCollection("blog", ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
  .slice(0, 3);
const show = posts.length >= 3;
---
{show && (
  <section class="bg-card py-24 lg:py-32">
    <div class="wrap">
      <SectionHeader eyebrow="Guías" title="Antes de decidir, informate" text="Costos reales, tecnologías de navegación, mantenimiento: lo que conviene saber antes de comprar un robot cortacésped." />
      <div class="grid gap-6 md:grid-cols-3">
        {posts.map((post) => <ArticleCard post={post} />)}
      </div>
      <div class="mt-12 text-center">
        <a href="/blog" class="inline-flex items-center gap-2 rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10">
          Todas las guías <IconArrowRight size={16} />
        </a>
      </div>
    </div>
  </section>
)}
```

`src/components/FAQ.astro`:
```astro
---
import IconChevronDown from "@/components/icons/IconChevronDown.astro";
import SectionHeader from "@/components/SectionHeader.astro";

interface Props {
  items: { question: string; answer: string; link?: { label: string; href: string } }[];
  title?: string;
  eyebrow?: string;
  id?: string;
}
const { items, title = "¿Tenés dudas?", eyebrow = "Preguntas frecuentes", id = "faq" } = Astro.props;
---
<section id={id} class="scroll-mt-20 py-24 lg:py-32">
  <div class="wrap">
    <div class="mx-auto max-w-3xl">
      <SectionHeader eyebrow={eyebrow} title={title} />
      <div class="space-y-3">
        {items.map((f) => (
          <details class="group rounded-xl border border-border bg-card px-6 open:border-primary/30">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium [&::-webkit-details-marker]:hidden">
              <span>{f.question}</span>
              <IconChevronDown class="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" size={20} />
            </summary>
            <div class="pb-5 text-muted-foreground">
              <p>{f.answer}</p>
              {f.link && <a href={f.link.href} class="mt-3 inline-block text-sm font-medium text-primary hover:underline">{f.link.label} →</a>}
            </div>
          </details>
        ))}
      </div>
    </div>
  </div>
</section>
```

`src/components/CTAFinal.astro`:
```astro
---
import WhatsAppButton from "@/components/WhatsAppButton.astro";
import type { WaContext } from "@/lib/whatsapp";

interface Props {
  title?: string;
  text?: string;
  wa: string;
  context?: WaContext;
  subject?: string;
  product?: string;
  label?: string;
}
const {
  title = "¿Hablamos de tu jardín?",
  text = "Contanos cuántos metros tenés, si hay árboles o pendientes, y te decimos qué modelo te conviene. Sin compromiso.",
  wa, context = "general", subject, product, label = "Escribinos por WhatsApp",
} = Astro.props;
---
<section class="py-24 lg:py-32">
  <div class="wrap text-center">
    <div class="mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-primary/5 px-6 py-16 glow-border">
      <h2 class="mb-4 text-3xl font-bold md:text-4xl">{title}</h2>
      <p class="mx-auto mb-8 max-w-xl text-muted-foreground">{text}</p>
      <WhatsAppButton context={context} subject={subject} wa={wa} product={product} label={label} />
    </div>
  </div>
</section>
```

- [ ] **Step 6: `src/lib/faq-links.ts` con test**

Las FAQ de la Task 4 linkean a artículos del blog que recién existen en la Parte 3. Para que el chequeo de links no falle mientras tanto (y para que un artículo en borrador nunca genere un link roto), los links a `/blog/<id>` se muestran solo si ese artículo está publicado.

`tests/faq-links.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Faq } from "@/content/schemas";
import { withPublishedLinks } from "@/lib/faq-links";

const faq = (link?: Faq["link"]): Faq => ({ question: "¿Pregunta?", answer: "Respuesta suficientemente larga.", scope: ["home"], order: 1, link });

describe("withPublishedLinks", () => {
  it("conserva links a artículos publicados", () => {
    const out = withPublishedLinks([faq({ label: "Leer", href: "/blog/mantenimiento-robot-cortacesped" })], ["mantenimiento-robot-cortacesped"]);
    expect(out[0]!.link).toEqual({ label: "Leer", href: "/blog/mantenimiento-robot-cortacesped" });
  });
  it("quita links a artículos no publicados", () => {
    const out = withPublishedLinks([faq({ label: "Leer", href: "/blog/no-existe" })], []);
    expect(out[0]!.link).toBeUndefined();
  });
  it("conserva links que no son del blog", () => {
    const out = withPublishedLinks([faq({ label: "Comparar", href: "/productos/v600-vs-v1000" })], []);
    expect(out[0]!.link?.href).toBe("/productos/v600-vs-v1000");
  });
  it("no toca FAQ sin link ni muta la entrada", () => {
    const input = [faq()];
    const out = withPublishedLinks(input, []);
    expect(out[0]!.link).toBeUndefined();
    expect(out).not.toBe(input);
  });
});
```

Run: `npm test -- tests/faq-links.test.ts 2>&1 | tail -4` → Expected: FAIL (módulo inexistente).

`src/lib/faq-links.ts`:

```ts
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
```

Run: `npm test 2>&1 | tail -4` → Expected: `9 passed`.

- [ ] **Step 7: `src/pages/index.astro` (reemplazo completo)**

```astro
---
import { getCollection } from "astro:content";
import ArticlesBlock from "@/components/ArticlesBlock.astro";
import CTAFinal from "@/components/CTAFinal.astro";
import FAQ from "@/components/FAQ.astro";
import Hero from "@/components/Hero.astro";
import HowItWorks from "@/components/HowItWorks.astro";
import ProductGrid from "@/components/ProductGrid.astro";
import TrustStrip from "@/components/TrustStrip.astro";
import WhichOne from "@/components/WhichOne.astro";
import WhyRobot from "@/components/WhyRobot.astro";
import { site } from "@/config/site";
import BaseLayout from "@/layouts/BaseLayout.astro";
import { withPublishedLinks } from "@/lib/faq-links";
import { ldBreadcrumb, ldFaq } from "@/lib/schema";

const products = (await getCollection("products")).sort((a, b) => a.data.coverageM2 - b.data.coverageM2);
const publishedIds = (await getCollection("blog", ({ data }) => !data.draft)).map((post) => post.id);
const faqs = withPublishedLinks(
  (await getCollection("faq", ({ data }) => data.scope.includes("home"))).sort((a, b) => a.data.order - b.data.order).map((f) => f.data),
  publishedIds,
);

const title = "Robot Cortacésped con IA en Argentina | TerraMow";
const description = "Robots cortacésped con navegación por cámara e IA, sin cables perimetrales. Modelos TerraMow V600 y V1000, garantía y soporte local. Consultá por WhatsApp.";
const jsonLd = [ldBreadcrumb([{ name: "Inicio", url: `${site.url}/` }]), ldFaq(faqs)];
---
<BaseLayout title={title} description={description} jsonLd={jsonLd}>
  <Hero />
  <TrustStrip />
  <WhyRobot />
  <ProductGrid products={products} />
  <WhichOne products={products} />
  <HowItWorks />
  <ArticlesBlock />
  <FAQ items={faqs} />
  <CTAFinal wa="home-cta" />
</BaseLayout>
```

- [ ] **Step 8: Build, chequeos y revisión visual**

Run: `npm run build 2>&1 | tail -10`
Expected: `Complete!`, cuatro ✔ (los links del FAQ a `/blog/*` no se renderizan porque todavía no hay artículos publicados). Si `Presupuesto de peso` falla: revisar que `Picture` del hero use `widths={[640, 1024, 1600]}` (el chequeo solo suma el `src` del `<img>`, que es el más chico) y que las fotos de producto tengan `loading="lazy"`.

Run: `grep -o 'data-wa="[^"]*"' dist/index.html | sort -u`
Expected: `float`, `home-cta`, `home-hero`, `nav`, `nav-mobile`.

Run: `grep -c '<h1' dist/index.html && grep -o '<video[^>]*>' dist/index.html | grep -c 'preload="none"' && grep -c '<source' dist/index.html`
Expected: `1`, `1`, `0` (el video no tiene `<source>` en el HTML).

Run: `npx astro preview --port 4321 &` y abrir http://localhost:4321 en el navegador: recorrer la home en ancho móvil (375 px) y desktop. Verificar: menú móvil abre/cierra y cambia `aria-expanded`; el video aparece solo en desktop; el FAQ despliega; todos los botones de WhatsApp abren `wa.me/5492494318185`. Cerrar el preview.

- [ ] **Step 9: Commit y push**

```bash
git add src tests
git commit -m "feat: home con layout persuasivo, hero video/imagen, productos, FAQ y CTA

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
```

---

### Task 9: Fichas de producto

**Files:**
- Create: `src/components/Breadcrumbs.astro`, `PriceBlock.astro`, `FitCheck.astro`, `SpecsTable.astro`, `StickyBar.astro`, `src/scripts/currency.ts`, `src/scripts/sticky-bar.ts`, `src/pages/productos/[slug].astro`

**Interfaces:**
- Consumes: `Product`, `productImage`, `formatUSD`, `formatARS`, `formatNumber`, `usdToArs`, `getUsdArsRate`, `site`, `ldBreadcrumb`, `ldProduct`, `ldFaq`, `FAQ`, `CTAFinal`, `TrustStrip`, `WhatsAppButton`, iconos.
- Produces:
  - `Breadcrumbs` props `{ items: { name: string; href: string }[] }`.
  - `PriceBlock` props `{ product: Product }` — renderiza `<h1>`, `#price-block`, `[data-price][data-price-usd]`, `[data-currency]`, `#price-note`.
  - `FitCheck` props `{ product: Product; other: Product }`.
  - `SpecsTable` props `{ specs: Product["specs"] }`.
  - `StickyBar` props `{ product: Product }` — `#sticky-bar`, contiene `[data-price]`.
  - Elementos DOM que usan los scripts: `#price-block`, `[data-price]`, `[data-currency]`, `#price-note`, `#sticky-bar`, `#wa-float`.

- [ ] **Step 1: `Breadcrumbs.astro`, `SpecsTable.astro`, `FitCheck.astro`**

`src/components/Breadcrumbs.astro`:
```astro
---
interface Props { items: { name: string; href: string }[] }
const { items } = Astro.props;
---
<nav aria-label="Ubicación" class="mb-8 text-sm text-muted-foreground">
  <ol class="flex flex-wrap items-center gap-2">
    {items.map((it, i) => (
      <li class="flex items-center gap-2">
        {i > 0 && <span aria-hidden="true">›</span>}
        {i < items.length - 1 ? <a href={it.href} class="transition-colors hover:text-primary">{it.name}</a> : <span aria-current="page" class="text-foreground">{it.name}</span>}
      </li>
    ))}
  </ol>
</nav>
```

`src/components/SpecsTable.astro`:
```astro
---
import type { Product } from "@/content/schemas";
import IconCheck from "@/components/icons/IconCheck.astro";

interface Props { specs: Product["specs"] }
const { specs } = Astro.props;
---
<section class="mt-24" aria-labelledby="specs-titulo">
  <h2 id="specs-titulo" class="mb-12 text-3xl font-bold">Especificaciones técnicas</h2>
  <div class="space-y-12">
    {specs.map((group) => (
      <div class="border-t border-border pt-8">
        <h3 class="mb-6 text-2xl font-semibold">{group.category}</h3>
        <table class="w-full text-sm">
          <caption class="sr-only">{group.category}</caption>
          <tbody class="grid gap-x-8 md:grid-cols-2">
            {group.items.map((item) => (
              <tr class="flex flex-col border-b border-border py-3">
                <th scope="row" class="text-left text-sm font-medium text-muted-foreground">{item.label}</th>
                <td class="flex items-center gap-2 text-base text-foreground">
                  {item.value === "Sí" && <IconCheck class="text-primary" size={18} />}
                  {item.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ))}
  </div>
</section>
```

`src/components/FitCheck.astro`:
```astro
---
import type { Product } from "@/content/schemas";
import IconArrowRight from "@/components/icons/IconArrowRight.astro";
import { formatNumber } from "@/lib/price";

interface Props { product: Product; other: Product }
const { product: p, other } = Astro.props;
const bigger = other.coverageM2 > p.coverageM2;
const cells = [
  { value: `${formatNumber(p.coverageM2)} m²`, label: "superficie máxima" },
  { value: `${p.fit.maxSlopeDeg}°`, label: `pendiente máxima (${p.fit.maxSlopePct} %)` },
  { value: p.fit.obstacles ? "Sí" : "No", label: "árboles, canteros, macetas" },
  { value: p.fit.multiZone ? "Sí" : "No", label: "varias zonas separadas" },
  { value: `${p.fit.runtimeMin} min`, label: "autonomía por carga" },
  { value: `< ${p.fit.noiseDb} dB`, label: "nivel de ruido" },
];
---
<section class="mt-16 rounded-2xl border border-border bg-card p-6 lg:p-8" aria-labelledby="fit-titulo">
  <h2 id="fit-titulo" class="mb-2 text-2xl font-bold">¿Es para tu jardín?</h2>
  <p class="mb-6 text-sm text-muted-foreground">Chequeá estos seis datos contra tu terreno. Si dudás, escribinos y lo vemos juntos.</p>
  <dl class="grid grid-cols-2 gap-4 md:grid-cols-3">
    {cells.map((c) => (
      <div class="rounded-xl border border-border bg-background p-4">
        <dt class="order-2 text-xs text-muted-foreground">{c.label}</dt>
        <dd class="text-2xl font-bold text-primary">{c.value}</dd>
      </div>
    ))}
  </dl>
  <p class="mt-6 text-sm text-muted-foreground">
    {bigger
      ? <>¿Tu jardín supera los {formatNumber(p.coverageM2)} m²? Mirá el <a href={`/productos/${other.slug}`} class="inline-flex items-center gap-1 font-medium text-primary hover:underline">{other.name} <IconArrowRight size={14} /></a>, que cubre hasta {formatNumber(other.coverageM2)} m².</>
      : <>¿Tu jardín es más chico? El <a href={`/productos/${other.slug}`} class="inline-flex items-center gap-1 font-medium text-primary hover:underline">{other.name} <IconArrowRight size={14} /></a> cubre hasta {formatNumber(other.coverageM2)} m² con la misma tecnología.</>}
  </p>
</section>
```

- [ ] **Step 2: `PriceBlock.astro` y `StickyBar.astro`**

`src/components/PriceBlock.astro`:
```astro
---
import type { Product } from "@/content/schemas";
import IconCheck from "@/components/icons/IconCheck.astro";
import WhatsAppButton from "@/components/WhatsAppButton.astro";
import { formatUSD } from "@/lib/price";

interface Props { product: Product }
const { product: p } = Astro.props;
const btn = "rounded-full px-3 py-1 text-xs font-semibold transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground bg-secondary text-muted-foreground hover:text-primary";
---
<div id="price-block" class="flex flex-col justify-center">
  <p class="mb-2 text-xs font-semibold tracking-widest text-primary uppercase">V Series</p>
  <h1 class="mb-2 text-4xl font-bold md:text-5xl">{p.name}</h1>
  <p class="mb-6 text-lg text-muted-foreground">{p.tagline}</p>

  <div class="mb-8">
    <div class="mb-2 flex items-center justify-between">
      <p class="text-sm text-muted-foreground">Precio</p>
      {p.priceUSD !== null && (
        <div class="flex gap-2" role="group" aria-label="Moneda">
          <button type="button" data-currency="USD" aria-pressed="true" class={btn}>USD</button>
          <button type="button" data-currency="ARS" aria-pressed="false" class={btn}>ARS</button>
        </div>
      )}
    </div>
    <p class="text-4xl font-bold text-primary" data-price data-price-usd={p.priceUSD ?? ""}>{formatUSD(p.priceUSD)}</p>
    <p id="price-note" class="mt-3 text-xs text-muted-foreground" hidden></p>
    {!p.inStock && <p class="mt-3 inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Sin stock por el momento</p>}
  </div>

  <ul class="mb-8 space-y-2" aria-label="Características principales">
    {p.highlights.map((h) => (
      <li class="flex items-start gap-3"><IconCheck class="mt-0.5 shrink-0 text-primary" size={20} /><span>{h}</span></li>
    ))}
  </ul>

  <WhatsAppButton
    context="product"
    subject={p.name}
    wa={`ficha-${p.slug}-hero`}
    product={p.slug}
    label={p.inStock ? "Comprar por WhatsApp" : "Consultar disponibilidad"}
    class="w-full text-lg"
  />
</div>
```

`src/components/StickyBar.astro`:
```astro
---
import type { Product } from "@/content/schemas";
import WhatsAppButton from "@/components/WhatsAppButton.astro";
import { formatUSD } from "@/lib/price";

interface Props { product: Product }
const { product: p } = Astro.props;
---
<div id="sticky-bar" class="fixed inset-x-0 bottom-0 z-40 translate-y-full border-t border-border bg-background/95 backdrop-blur-xl transition-transform duration-300 lg:hidden" aria-hidden="true">
  <div class="wrap flex items-center justify-between gap-3 py-3">
    <div>
      <p class="text-xs text-muted-foreground">{p.name}</p>
      <p class="text-lg font-bold text-primary" data-price>{formatUSD(p.priceUSD)}</p>
    </div>
    <WhatsAppButton context="product" subject={p.name} wa={`ficha-${p.slug}-sticky`} product={p.slug} label={p.inStock ? "Comprar" : "Consultar"} variant="bar" />
  </div>
</div>
```

- [ ] **Step 3: `src/scripts/currency.ts` y `src/scripts/sticky-bar.ts`**

`currency.ts`:
```ts
import { site } from "@/config/site";
import { getUsdArsRate, type RateSource } from "@/lib/exchange-rate";
import { formatARS, formatUSD, usdToArs } from "@/lib/price";

const STORAGE_KEY = "usd-ars-rate";
type Cached = { rate: number; source: RateSource; at: number };

async function loadRate(): Promise<Cached> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as Cached;
      if (Date.now() - cached.at < site.exchangeRate.ttlMinutes * 60_000) return cached;
    }
  } catch {
    /* localStorage no disponible */
  }
  const fresh = await getUsdArsRate({ timeoutMs: site.exchangeRate.timeoutMs, fallback: site.exchangeRate.fallback });
  const cached: Cached = { ...fresh, at: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    /* sin persistencia */
  }
  return cached;
}

const prices = Array.from(document.querySelectorAll<HTMLElement>("[data-price]"));
const usdAttr = document.querySelector<HTMLElement>("[data-price-usd]")?.dataset.priceUsd ?? "";
const usd = Number(usdAttr);
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-currency]"));
const note = document.getElementById("price-note");

if (usd > 0 && buttons.length > 0) {
  let rateInfo: Cached | null = null;

  const render = (currency: string): void => {
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.currency === currency));
    if (currency === "ARS" && rateInfo) {
      const text = formatARS(usdToArs(usd, rateInfo.rate));
      for (const el of prices) el.textContent = text;
      if (note) {
        note.textContent =
          rateInfo.source === "fallback"
            ? "Cotización de referencia. El precio final se define con la cotización del Banco Nación del día de la compra."
            : "Precio de referencia según la cotización del Banco Nación. El precio final se define con la cotización del día de la compra.";
        note.hidden = false;
      }
    } else {
      const text = formatUSD(usd);
      for (const el of prices) el.textContent = text;
      if (note) note.hidden = true;
    }
  };

  for (const b of buttons) {
    b.addEventListener("click", async () => {
      const currency = b.dataset.currency ?? "USD";
      if (currency === "ARS" && !rateInfo) {
        b.disabled = true;
        rateInfo = await loadRate();
        b.disabled = false;
      }
      render(currency);
    });
  }
}
```

`sticky-bar.ts`:
```ts
const bar = document.getElementById("sticky-bar");
const priceBlock = document.getElementById("price-block");
const float = document.getElementById("wa-float");

if (bar && priceBlock) {
  let lastY = window.scrollY;
  let passedPrice = false;

  const update = (): void => {
    const goingUp = window.scrollY < lastY - 4;
    lastY = window.scrollY;
    const show = passedPrice && !goingUp;
    bar.classList.toggle("translate-y-full", !show);
    bar.setAttribute("aria-hidden", String(!show));
    float?.classList.toggle("hidden", show);
  };

  new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      passedPrice = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      update();
    },
    { threshold: 0 },
  ).observe(priceBlock);

  window.addEventListener("scroll", update, { passive: true });
}
```

- [ ] **Step 4: `src/pages/productos/[slug].astro`**

```astro
---
import { getImage, Image } from "astro:assets";
import { getCollection } from "astro:content";
import type { InferGetStaticPropsType } from "astro";
import Breadcrumbs from "@/components/Breadcrumbs.astro";
import CTAFinal from "@/components/CTAFinal.astro";
import FAQ from "@/components/FAQ.astro";
import FitCheck from "@/components/FitCheck.astro";
import IconArrowRight from "@/components/icons/IconArrowRight.astro";
import PriceBlock from "@/components/PriceBlock.astro";
import SpecsTable from "@/components/SpecsTable.astro";
import StickyBar from "@/components/StickyBar.astro";
import TrustStrip from "@/components/TrustStrip.astro";
import BaseLayout from "@/layouts/BaseLayout.astro";
import { withPublishedLinks } from "@/lib/faq-links";
import { productImage } from "@/lib/product-images";
import { ldBreadcrumb, ldFaq, ldProduct } from "@/lib/schema";
import { absoluteUrl } from "@/lib/seo";

export async function getStaticPaths() {
  const products = await getCollection("products");
  return products.map((entry) => ({ params: { slug: entry.data.slug }, props: { entry } }));
}
type Props = InferGetStaticPropsType<typeof getStaticPaths>;

const { entry } = Astro.props as Props;
const p = entry.data;
const other = (await getCollection("products")).find((o) => o.data.slug !== p.slug)!.data;
const publishedIds = (await getCollection("blog", ({ data }) => !data.draft)).map((post) => post.id);
const faqs = withPublishedLinks(
  (await getCollection("faq", ({ id }) => p.faq.includes(id))).sort((a, b) => a.data.order - b.data.order).map((f) => f.data),
  publishedIds,
);

const image = productImage(p.image);
const optimized = await getImage({ src: image, width: 800, height: 800, format: "webp" });
const url = absoluteUrl(`/productos/${p.slug}`);
const crumbs = [
  { name: "Inicio", href: "/" },
  { name: "Productos", href: "/#productos" },
  { name: p.name, href: `/productos/${p.slug}` },
];
const jsonLd = [
  ldBreadcrumb(crumbs.map((c) => ({ name: c.name, url: absoluteUrl(c.href === "/" ? "/" : c.href) }))),
  ldProduct(p, { url, imageUrl: absoluteUrl(optimized.src) }),
  ldFaq(faqs),
];
---
<BaseLayout title={p.seo.title} description={p.seo.description} ogImage={p.ogImage} ogType="product" jsonLd={jsonLd}>
  <div class="wrap pt-24 pb-24 lg:pt-32">
    <Breadcrumbs items={crumbs} />

    <div class="grid gap-12 md:grid-cols-2">
      <div class="flex items-center justify-center">
        <div class="aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-secondary/30">
          <Image src={image} alt={p.imageAlt} width={800} height={800} format="webp" loading="eager" fetchpriority="high" class="h-full w-full object-cover" />
        </div>
      </div>
      <PriceBlock product={p} />
    </div>
  </div>

  <TrustStrip />

  <div class="wrap pb-24">
    <FitCheck product={p} other={other} />
    <SpecsTable specs={p.specs} />

    <section class="mt-24 rounded-2xl border border-border bg-card p-8 md:p-12" aria-labelledby="why-titulo">
      <h2 id="why-titulo" class="mb-4 text-2xl font-bold">{p.why.title}</h2>
      <p class="mb-6 leading-relaxed text-muted-foreground">{p.why.text}</p>
      <a href="/productos/v600-vs-v1000" class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">¿Dudás entre los dos? Mirá la comparativa <IconArrowRight size={16} /></a>
    </section>
  </div>

  <FAQ items={faqs} title={`Preguntas sobre el ${p.name}`} id="faq-producto" />
  <CTAFinal wa={`ficha-${p.slug}-cta`} context="product" subject={p.name} product={p.slug} title={`¿Te interesa el ${p.name}?`} text={`Escribinos y te confirmamos ${p.inStock ? "precio del día, envío y forma de pago" : "cuándo vuelve a haber stock y qué alternativa te conviene mientras tanto"}.`} />
  <StickyBar product={p} />
</BaseLayout>

<script>
  import "@/scripts/currency.ts";
  import "@/scripts/sticky-bar.ts";
</script>
```

- [ ] **Step 5: Build, chequeos y prueba manual**

Run: `npm run build 2>&1 | tail -10`
Expected: `Complete!`, cuatro ✔; existen `dist/productos/v600/index.html` y `dist/productos/v1000/index.html`.

Run: `grep -o '"availability":"[^"]*"' dist/productos/v1000/index.html; grep -c '"@type":"Offer"' dist/productos/v600/index.html; grep -o '<title>[^<]*' dist/productos/v600/index.html`
Expected: `https://schema.org/InStock`; `0` (V600 sin precio → sin Offer); `<title>TerraMow V600: robot cortacésped hasta 600 m² | Ficha`.

Run: `grep -o 'data-wa="[^"]*"' dist/productos/v1000/index.html | sort -u`
Expected: `ficha-v1000-cta`, `ficha-v1000-hero`, `ficha-v1000-sticky`, `float`, `nav`, `nav-mobile`.

Manual (`npx astro preview`): en http://localhost:4321/productos/v1000 con ancho 375 px: al pasar el bloque de precio aparece la barra fija y se esconde el botón flotante; al scrollear hacia arriba la barra se oculta; el toggle ARS muestra un precio en pesos con nota (con red) o "Cotización de referencia" (sin red — probar con el DevTools en modo offline); el V600 no muestra toggle y dice "Consultar precio".

- [ ] **Step 6: Commit y push**

```bash
git add src
git commit -m "feat: fichas de producto con precio USD/ARS, barra fija móvil y '¿es para tu jardín?'

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
```

---

### Task 10: Comparativa V600 vs V1000

**Files:**
- Create: `src/pages/productos/v600-vs-v1000.astro`

**Interfaces:**
- Consumes: colecciones `products` y `faq` (scope `comparativa`), `Breadcrumbs`, `SectionHeader`, `FAQ`, `WhatsAppButton`, `CTAFinal`, `ldBreadcrumb`, `ldItemList`, `ldFaq`, `formatNumber`, `formatUSD`.

- [ ] **Step 1: Página**

```astro
---
import { Image } from "astro:assets";
import { getCollection } from "astro:content";
import Breadcrumbs from "@/components/Breadcrumbs.astro";
import CTAFinal from "@/components/CTAFinal.astro";
import FAQ from "@/components/FAQ.astro";
import IconCheck from "@/components/icons/IconCheck.astro";
import WhatsAppButton from "@/components/WhatsAppButton.astro";
import type { Product } from "@/content/schemas";
import BaseLayout from "@/layouts/BaseLayout.astro";
import { withPublishedLinks } from "@/lib/faq-links";
import { formatNumber, formatUSD } from "@/lib/price";
import { productImage } from "@/lib/product-images";
import { ldBreadcrumb, ldFaq, ldItemList } from "@/lib/schema";
import { absoluteUrl } from "@/lib/seo";

const products = (await getCollection("products")).sort((a, b) => a.data.coverageM2 - b.data.coverageM2).map((e) => e.data);
const [v600, v1000] = products as [Product, Product];
const publishedIds = (await getCollection("blog", ({ data }) => !data.draft)).map((post) => post.id);
const faqs = withPublishedLinks(
  (await getCollection("faq", ({ data }) => data.scope.includes("comparativa"))).sort((a, b) => a.data.order - b.data.order).map((f) => f.data),
  publishedIds,
);

const spec = (p: Product, label: string): string =>
  p.specs.flatMap((g) => g.items).find((i) => i.label === label)?.value ?? "—";

const rows: { label: string; value: (p: Product) => string }[] = [
  { label: "Superficie recomendada", value: (p) => `Hasta ${formatNumber(p.coverageM2)} m²` },
  { label: "Autonomía por carga", value: (p) => `${p.fit.runtimeMin} min` },
  { label: "Área por carga completa", value: (p) => spec(p, "Área de corte por carga completa") },
  { label: "Tiempo de carga", value: (p) => spec(p, "Tiempo de carga") },
  { label: "Batería", value: (p) => spec(p, "Capacidad") },
  { label: "Área de corte por hora", value: (p) => p.fit.areaPerHourM2 },
  { label: "Navegación", value: (p) => spec(p, "Tecnología de navegación") },
  { label: "Pendiente máxima", value: (p) => `${p.fit.maxSlopeDeg}° (${p.fit.maxSlopePct} %)` },
  { label: "Nivel de ruido", value: (p) => `< ${p.fit.noiseDb} dB` },
  { label: "Impermeabilidad", value: (p) => spec(p, "Impermeabilidad") },
  { label: "Peso", value: (p) => spec(p, "Peso") },
  { label: "Precio", value: (p) => formatUSD(p.priceUSD) },
  { label: "Disponibilidad", value: (p) => (p.inStock ? "En stock" : "Sin stock — consultar") },
];

const pick600 = [
  "Tu jardín tiene hasta 600 m² y es una sola zona o dos muy cercanas.",
  "Querés la misma navegación por cámara e IA con una inversión menor.",
  "No tenés pendientes fuertes ni muchos sectores separados por caminos.",
];
const pick1000 = [
  "Tu jardín supera los 600 m² o tiene varias zonas separadas.",
  "Querés que termine en menos sesiones: 150 minutos de autonomía por carga.",
  "Tenés árboles, canteros o pendientes de hasta 18° y necesitás más batería para recorrerlos.",
];

const crumbs = [
  { name: "Inicio", href: "/" },
  { name: "Productos", href: "/#productos" },
  { name: "V600 vs V1000", href: "/productos/v600-vs-v1000" },
];
const jsonLd = [
  ldBreadcrumb(crumbs.map((c) => ({ name: c.name, url: absoluteUrl(c.href) }))),
  ldItemList(products.map((p) => ({ name: p.name, url: absoluteUrl(`/productos/${p.slug}`) }))),
  ldFaq(faqs),
];
---
<BaseLayout
  title="TerraMow V600 vs V1000: ¿cuál robot cortacésped elegir?"
  description="Comparativa completa entre el TerraMow V600 y el V1000: superficie, batería, ruido, precio y para qué jardín conviene cada uno."
  jsonLd={jsonLd}
>
  <div class="wrap pt-24 pb-16 lg:pt-32">
    <Breadcrumbs items={crumbs} />
    <p class="mb-4 text-xs font-semibold tracking-widest text-primary uppercase">Comparativa</p>
    <h1 class="mb-6 text-4xl font-bold md:text-6xl">TerraMow V600 vs V1000: ¿cuál elegir?</h1>
    <p class="max-w-3xl text-lg text-muted-foreground">Los dos usan la misma navegación por cámara con IA, el mismo ancho de corte y la misma app. La diferencia está en cuánto jardín cubren por carga. Acá tenés todo lado a lado.</p>
  </div>

  <div class="wrap pb-24">
    <div class="grid gap-8 md:grid-cols-2">
      {products.map((p) => (
        <a href={`/productos/${p.slug}`} class="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
          <Image src={productImage(p.image)} alt={p.imageAlt} width={160} height={160} format="webp" loading="eager" class="h-20 w-20 rounded-xl object-cover" />
          <div>
            <p class="text-xl font-bold">{p.name}</p>
            <p class="text-sm text-primary">Hasta {formatNumber(p.coverageM2)} m² · {formatUSD(p.priceUSD)}</p>
          </div>
        </a>
      ))}
    </div>

    <div class="mt-12 overflow-x-auto rounded-2xl border border-border">
      <table class="w-full text-sm">
        <caption class="sr-only">Comparación de especificaciones entre TerraMow V600 y V1000</caption>
        <thead class="bg-primary/10 text-left">
          <tr>
            <th scope="col" class="p-4 font-semibold">Característica</th>
            <th scope="col" class="p-4 font-semibold text-primary">{v600.name}</th>
            <th scope="col" class="p-4 font-semibold text-primary">{v1000.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr class:list={["border-t border-border", i % 2 === 1 && "bg-secondary/30"]}>
              <th scope="row" class="p-4 text-left font-medium">{r.label}</th>
              <td class="p-4 text-muted-foreground">{r.value(v600)}</td>
              <td class="p-4 text-muted-foreground">{r.value(v1000)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div class="mt-16 grid gap-8 md:grid-cols-2">
      {[{ p: v600, items: pick600, wa: "comparativa-v600" }, { p: v1000, items: pick1000, wa: "comparativa-v1000" }].map(({ p, items, wa }) => (
        <section class="rounded-2xl border border-border bg-card p-8" aria-labelledby={`elegi-${p.slug}`}>
          <h2 id={`elegi-${p.slug}`} class="mb-6 text-2xl font-bold">Elegí el {p.model} si…</h2>
          <ul class="mb-8 space-y-3">
            {items.map((t) => <li class="flex items-start gap-3 text-muted-foreground"><IconCheck class="mt-0.5 shrink-0 text-primary" size={20} /><span>{t}</span></li>)}
          </ul>
          <WhatsAppButton context="product" subject={p.name} wa={wa} product={p.slug} label={p.inStock ? `Consultar por el ${p.model}` : `Consultar stock del ${p.model}`} class="w-full" />
        </section>
      ))}
    </div>
  </div>

  <FAQ items={faqs} title="Dudas al elegir" id="faq-comparativa" />
  <CTAFinal wa="comparativa-ayuda" context="compare" title="¿Todavía no sabés cuál?" text="Mandanos una foto o un plano de tu jardín con los metros aproximados y te decimos cuál conviene. Es gratis y sin compromiso." label="Pedir ayuda para elegir" />
</BaseLayout>
```

- [ ] **Step 2: Build y verificación**

Run: `npm run build 2>&1 | tail -8 && grep -o '<title>[^<]*' dist/productos/v600-vs-v1000/index.html && grep -c '"@type":"ItemList"' dist/productos/v600-vs-v1000/index.html`
Expected: cuatro ✔; el título de la spec; `1`.

- [ ] **Step 3: Commit y push**

```bash
git add src/pages/productos/v600-vs-v1000.astro
git commit -m "feat: comparativa V600 vs V1000

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
```

---

### Task 11: Página de tecnología

**Files:**
- Create: `src/data/tecnologia.ts`, `src/pages/tecnologia.astro`

**Interfaces:**
- Consumes: `howItWorks`, `HowItWorks` (detailed), `Breadcrumbs`, `SectionHeader`, `CTAFinal`, `ldBreadcrumb`, `ldHowTo`, iconos.
- Produces: `timeComparison`, `manualVsRobot`, `techAdvantages`, `workCycle` en `src/data/tecnologia.ts`.

- [ ] **Step 1: `src/data/tecnologia.ts`**

```ts
export const timeComparison = [
  { task: "Corte semanal (500 m²)", manual: "2,5 hs", robot: "0 hs (automático)", savings: "2,5 hs" },
  { task: "Corte mensual", manual: "10 hs", robot: "0 hs", savings: "10 hs" },
  { task: "Corte anual", manual: "120 hs", robot: "0 hs", savings: "120 hs" },
  { task: "Mantenimiento del equipo", manual: "12 hs/año", robot: "2 hs/año", savings: "10 hs" },
  { task: "Limpieza después de cortar", manual: "30 min por corte", robot: "0 min", savings: "26 hs/año" },
];

export const manualVsRobot = [
  { feature: "Requiere que alguien lo opere", manual: true, robot: false },
  { feature: "Funciona bajo lluvia liviana", manual: false, robot: true },
  { feature: "Corte silencioso (< 54 dB)", manual: false, robot: true },
  { feature: "Mulching automático (no hay que recoger el césped)", manual: false, robot: true },
  { feature: "Programable desde el celular", manual: false, robot: true },
  { feature: "Sin cables ni obra para instalar", manual: true, robot: true },
  { feature: "Detección de obstáculos con IA", manual: false, robot: true },
  { feature: "Cero emisiones", manual: false, robot: true },
];

export const techAdvantages = [
  {
    title: "Visión por cámara con IA, sin cables perimetrales",
    description: "Los robots tradicionales necesitan un cable enterrado para saber dónde cortar. La V Series usa tres cámaras e inteligencia artificial para reconocer el césped, los bordes y los obstáculos. Cero obra, instalación en minutos, y si cambiás el diseño del jardín no hay nada que desenterrar.",
    stat: "0 cables",
    statLabel: "para instalar",
  },
  {
    title: "Mulching: el césped se fertiliza solo",
    description: "Como corta un poco cada día, los recortes son finísimos y caen entre las hojas, donde se descomponen en uno o dos días. No hay que rastrillar ni embolsar, y el suelo recibe nutrientes de forma continua.",
    stat: "0 bolsas",
    statLabel: "de césped",
  },
  {
    title: "Consumo mínimo",
    description: "Una carga completa consume poco más que cargar un celular. Comparado con una cortadora a combustión, el ahorro de energía es del orden del 95 % y no hay emisiones ni olor a nafta.",
    stat: "95 %",
    statLabel: "menos energía",
  },
  {
    title: "Seguridad en capas",
    description: "Sensores de impacto, elevación e inclinación detienen las cuchillas al instante ante cualquier situación anormal. Además: bloqueo por PIN, alarma antirrobo y aviso en la app si alguien lo mueve.",
    stat: "< 0,1 s",
    statLabel: "de reacción",
  },
];

export const workCycle = [
  { label: "Carga en la base", time: "~100-120 min" },
  { label: "Analiza el mapa", time: "~30 seg" },
  { label: "Corta el césped", time: "~120-150 min" },
  { label: "Vuelve a la base", time: "Automático" },
];
```

- [ ] **Step 2: `src/pages/tecnologia.astro`**

```astro
---
import { getEntry } from "astro:content";
import Breadcrumbs from "@/components/Breadcrumbs.astro";
import CTAFinal from "@/components/CTAFinal.astro";
import HowItWorks from "@/components/HowItWorks.astro";
import IconArrowRight from "@/components/icons/IconArrowRight.astro";
import IconCheck from "@/components/icons/IconCheck.astro";
import IconClose from "@/components/icons/IconClose.astro";
import SectionHeader from "@/components/SectionHeader.astro";
import { howItWorks } from "@/data/how-it-works";
import { manualVsRobot, techAdvantages, timeComparison, workCycle } from "@/data/tecnologia";
import BaseLayout from "@/layouts/BaseLayout.astro";
import { ldBreadcrumb, ldHowTo } from "@/lib/schema";
import { absoluteUrl } from "@/lib/seo";

// El link a la guía comparativa solo se muestra cuando el artículo está publicado (Parte 3, Task 13).
const guiaCamara = await getEntry("blog", "camara-ia-vs-rtk-vs-lidar-robot-cortacesped");
const showGuia = guiaCamara !== undefined && !guiaCamara.data.draft;

const crumbs = [
  { name: "Inicio", href: "/" },
  { name: "Tecnología", href: "/tecnologia" },
];
const jsonLd = [
  ldBreadcrumb(crumbs.map((c) => ({ name: c.name, url: absoluteUrl(c.href) }))),
  ldHowTo({
    name: "Cómo funciona un robot cortacésped con IA",
    description: "Guía paso a paso del funcionamiento de un robot cortacésped autónomo con navegación por cámara e inteligencia artificial.",
    steps: howItWorks.map((s) => ({ name: s.title, text: s.description })),
  }),
];
const headCell = "p-4 text-sm font-semibold";
---
<BaseLayout
  title="Cómo funciona un robot cortacésped con IA | Guía"
  description="Guía paso a paso: mapeo, planificación, corte autónomo y control por app. Ahorro de tiempo real y comparativa contra el corte manual."
  jsonLd={jsonLd}
>
  <div class="wrap pt-24 pb-8 text-center lg:pt-32">
    <Breadcrumbs items={crumbs} />
    <p class="mb-4 text-xs font-semibold tracking-widest text-primary uppercase">Guía tecnológica</p>
    <h1 class="mb-6 text-4xl font-bold md:text-6xl">¿Cómo funciona un <span class="text-gradient">robot cortacésped</span>?</h1>
    <p class="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">Descubrí en detalle la tecnología detrás de la V Series de TerraMow: inteligencia artificial, navegación autónoma y ahorro real de tiempo y dinero.</p>
  </div>

  <HowItWorks detailed showLink={false} />

  <section class="bg-card py-16 lg:py-24">
    <div class="wrap">
      <SectionHeader title="Ventajas tecnológicas clave" text="Cada característica está pensada para darte el mejor resultado con el menor esfuerzo." />
      <div class="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
        {techAdvantages.map((adv) => (
          <article class="rounded-2xl border border-border bg-background p-6 transition-colors hover:border-primary/30 lg:p-8">
            <div class="mb-4 text-right">
              <p class="text-3xl font-bold text-primary">{adv.stat}</p>
              <p class="text-xs text-muted-foreground">{adv.statLabel}</p>
            </div>
            <h3 class="mb-2 text-lg font-semibold">{adv.title}</h3>
            <p class="text-sm leading-relaxed text-muted-foreground">{adv.description}</p>
          </article>
        ))}
      </div>
      {showGuia && (
        <p class="mt-10 text-center text-sm text-muted-foreground">
          ¿Querés entender por qué la cámara le gana al cable, al RTK y al LiDAR?
          <a href="/blog/camara-ia-vs-rtk-vs-lidar-robot-cortacesped" class="inline-flex items-center gap-1 font-medium text-primary hover:underline">Leé la guía comparativa <IconArrowRight size={14} /></a>
        </p>
      )}
    </div>
  </section>

  <section class="py-16 lg:py-24">
    <div class="wrap">
      <SectionHeader title="Ahorro real de tiempo" text="Mirá cuántas horas recuperás al año dejando que el robot haga el trabajo pesado." />
      <div class="mx-auto max-w-4xl overflow-x-auto rounded-2xl border border-border">
        <table class="w-full">
          <caption class="sr-only">Horas de trabajo: corte manual contra robot</caption>
          <thead class="bg-primary/10 text-left">
            <tr>
              <th scope="col" class={headCell}>Tarea</th>
              <th scope="col" class:list={[headCell, "text-center"]}>Manual</th>
              <th scope="col" class:list={[headCell, "text-center"]}>Robot</th>
              <th scope="col" class:list={[headCell, "text-center text-primary"]}>Ahorro</th>
            </tr>
          </thead>
          <tbody>
            {timeComparison.map((row, i) => (
              <tr class:list={["border-t border-border text-sm", i % 2 === 1 && "bg-secondary/30"]}>
                <th scope="row" class="p-4 text-left font-medium">{row.task}</th>
                <td class="p-4 text-center text-muted-foreground">{row.manual}</td>
                <td class="p-4 text-center font-medium text-primary">{row.robot}</td>
                <td class="p-4 text-center font-bold text-primary">{row.savings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div class="mx-auto mt-8 max-w-4xl rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
        <p class="mb-2 text-5xl font-bold text-primary">+168 hs</p>
        <p class="text-muted-foreground">de tiempo libre por año — el equivalente a <span class="font-semibold text-foreground">21 días laborables</span> completos</p>
      </div>
    </div>
  </section>

  <section class="bg-card py-16 lg:py-24">
    <div class="wrap">
      <SectionHeader title="Corte manual vs. robot con IA" text="Una comparativa clara para que veas por qué cada vez más hogares eligen la automatización." />
      <div class="mx-auto max-w-3xl overflow-x-auto rounded-2xl border border-border">
        <table class="w-full">
          <caption class="sr-only">Comparación de características entre corte manual y robot</caption>
          <thead class="bg-primary/10 text-left">
            <tr>
              <th scope="col" class={headCell}>Característica</th>
              <th scope="col" class:list={[headCell, "text-center"]}>Manual</th>
              <th scope="col" class:list={[headCell, "text-center"]}>Robot IA</th>
            </tr>
          </thead>
          <tbody>
            {manualVsRobot.map((row, i) => (
              <tr class:list={["border-t border-border text-sm", i % 2 === 1 && "bg-secondary/30"]}>
                <th scope="row" class="p-4 text-left font-medium">{row.feature}</th>
                <td class="p-4"><span class="flex justify-center">{row.manual ? <IconCheck class="text-muted-foreground" size={20} /> : <IconClose class="text-muted-foreground/40" size={20} />}<span class="sr-only">{row.manual ? "Sí" : "No"}</span></span></td>
                <td class="p-4"><span class="flex justify-center">{row.robot ? <IconCheck class="text-primary" size={20} /> : <IconClose class="text-muted-foreground/40" size={20} />}<span class="sr-only">{row.robot ? "Sí" : "No"}</span></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="py-16 lg:py-24">
    <div class="wrap">
      <SectionHeader title="Ciclo de trabajo autónomo" text="El robot repite este ciclo solo, manteniendo tu jardín siempre parejo." />
      <ol class="mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
        {workCycle.map((phase, i) => (
          <li class="flex items-center gap-4 sm:flex-col sm:gap-2">
            <div class="min-w-[130px] rounded-2xl border border-border bg-linear-to-b from-primary/20 to-primary/5 p-5 text-center">
              <p class="mb-1 text-sm font-semibold">{phase.label}</p>
              <p class="text-xs font-medium text-primary">{phase.time}</p>
            </div>
            {i < workCycle.length - 1 && <span class="hidden text-xl font-bold text-primary sm:block" aria-hidden="true">→</span>}
          </li>
        ))}
      </ol>
      <p class="mt-6 text-center"><span class="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">↻ El ciclo se repite según tu programación</span></p>
    </div>
  </section>

  <CTAFinal wa="tecnologia-cta" title="¿Listo para recuperar tu tiempo?" text="Mirá los modelos V600 y V1000 o escribinos y te ayudamos a elegir según tu jardín." />
</BaseLayout>
```

- [ ] **Step 3: Build y verificación**

Run: `npm run build 2>&1 | tail -8 && grep -c '"@type":"HowTo"' dist/tecnologia/index.html && grep -c '<h1' dist/tecnologia/index.html && grep -c 'camara-ia-vs-rtk' dist/tecnologia/index.html`
Expected: cuatro ✔; `1`; `1`; `0` (el link a la guía aparece recién cuando el artículo exista, Parte 3).

- [ ] **Step 4: Commit y push**

```bash
git add src/data/tecnologia.ts src/pages/tecnologia.astro
git commit -m "feat: página de tecnología con HowTo, tablas reales y ciclo de trabajo

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
```

---

## Fin de la Parte 2

Al terminar: home, dos fichas, comparativa y tecnología construidas con los cuatro chequeos en verde; los links a `/blog/*` se activan solos cuando la Parte 3 publique los artículos. Continuar con `docs/superpowers/plans/2026-09-03-migracion-astro-parte-3-blog-medios-lanzamiento.md`.
