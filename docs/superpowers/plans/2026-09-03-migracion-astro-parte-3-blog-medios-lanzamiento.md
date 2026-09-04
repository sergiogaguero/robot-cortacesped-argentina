# Migración a Astro + SEO — Plan de implementación · Parte 3: blog, medios y lanzamiento

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Blog operativo (índice, plantilla de artículo, RSS) con los 3 artículos iniciales; video comprimido, imágenes OG, logo e íconos generados por script; README completo; verificación final y lanzamiento (merge a `master`).

**Architecture:** Los artículos son Markdown en `src/content/blog/` con portada al lado; `ArticleLayout` los envuelve con SEO, JSON-LD `BlogPosting`, productos relacionados y CTA. Los medios se generan con scripts reproducibles en `scripts/media/` (ffmpeg-static para el video, resvg + sharp para OG e íconos) y se commitean sus salidas en `public/`. El lanzamiento es un merge `astro` → `master` que Vercel despliega.

**Tech Stack:** el de la Parte 1. `@astrojs/rss`, `@resvg/resvg-js`, `ffmpeg-static`, `sharp` ya están instalados.

**Spec:** `docs/superpowers/specs/2026-09-03-migracion-astro-seo-design.md` — implementa §6.6, §7.4 (RSS), §7.5 (video, OG), §8.1, §10.3, §10.4, §11 (pasos 6-9), §14. Requiere las Partes 1 y 2 terminadas.

## Global Constraints

Las de las Partes 1 y 2, y además:

- **Artículos:** hablan de robots cortacésped **en general**; TerraMow aparece como ejemplo, no como único protagonista. Honestos: cada uno incluye cuándo *no* conviene o los límites de la tecnología. 1.200-1.800 palabras. Un solo `#` (el `<h1>` lo pone el layout desde el título del frontmatter: **el Markdown no lleva `# Título`**, empieza directo con un párrafo y usa `##`/`###`). Sin la palabra `oficial`. Voseo. Cifras con rango y aclaración de "referencia" cuando dependen del mercado.
- **Revisión del usuario:** los artículos se publican con `draft: false` en la rama `astro`. La revisión se hace en la URL de preview de Vercel antes del merge; el usuario puede pedir cambios o marcar `draft: true` para sacar uno del lanzamiento.
- **Medios:** los scripts deben ser reproducibles (`npm run media:video`, `media:og`, `media:icons`) y fallar con mensaje claro si el resultado supera el límite de peso.
- **Lanzamiento:** el merge a `master` lo hace el ejecutor **solo con confirmación explícita del usuario** en ese momento.

---

## Estructura de archivos de esta parte

| Archivo | Responsabilidad |
|---|---|
| `src/layouts/ArticleLayout.astro` | Plantilla de artículo (SEO `article`, `BlogPosting`, cuerpo `prose-dark`, relacionados, CTA) |
| `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/pages/rss.xml.ts` | Rutas del blog |
| `src/content/blog/<slug>.md` + `<slug>.jpg` | Los 3 artículos con su portada |
| `scripts/media/compress-video.mjs` | `media/hero-original.mp4` → `public/videos/hero.{mp4,webm}` ≤ 600 KB |
| `scripts/media/og-images.mjs` | `public/og/{default,v600,v1000}.jpg` 1200×630 |
| `scripts/media/icons.mjs` | `public/logo.png` (512 px), `public/apple-touch-icon.png` (180 px) |
| `README.md`, `.env.example` | Documentación y variables |

---

### Task 12: Infraestructura del blog + artículo 1

**Files:**
- Create: `src/layouts/ArticleLayout.astro`, `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/pages/rss.xml.ts`, `src/content/blog/conviene-robot-cortacesped-argentina.md`, `src/content/blog/conviene-robot-cortacesped-argentina.jpg`
- Delete: `src/content/blog/.gitkeep`

**Interfaces:**
- Consumes: colección `blog` (`post.id`, `post.data.{title, description, pubDate, updatedDate, cover, coverAlt, tags, relatedProducts, draft}`), `render()` de `astro:content`, `ArticleCard`, `Breadcrumbs`, `CTAFinal`, `ProductCard`, `ldBreadcrumb`, `ldArticle`, `absoluteUrl`, `getImage`.
- Produces: `ArticleLayout` props `{ post: CollectionEntry<"blog"> }` con slot por defecto para el cuerpo; rutas `/blog`, `/blog/<id>`, `/rss.xml`.

- [ ] **Step 1: `src/layouts/ArticleLayout.astro`**

```astro
---
import { getImage, Image } from "astro:assets";
import { getCollection, type CollectionEntry } from "astro:content";
import ArticleCard from "@/components/ArticleCard.astro";
import Breadcrumbs from "@/components/Breadcrumbs.astro";
import CTAFinal from "@/components/CTAFinal.astro";
import ProductCard from "@/components/ProductCard.astro";
import BaseLayout from "@/layouts/BaseLayout.astro";
import { ldArticle, ldBreadcrumb } from "@/lib/schema";
import { absoluteUrl } from "@/lib/seo";

interface Props { post: CollectionEntry<"blog"> }
const { post } = Astro.props;
const d = post.data;
const url = absoluteUrl(`/blog/${post.id}`);
const cover = await getImage({ src: d.cover, width: 1200, height: 675, format: "webp" });
const date = d.pubDate.toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });

const related = (await getCollection("products", ({ data }) => d.relatedProducts.includes(data.slug))).sort((a, b) => a.data.coverageM2 - b.data.coverageM2);
const others = (await getCollection("blog", ({ id, data }) => id !== post.id && !data.draft))
  .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
  .slice(0, 3);

const crumbs = [
  { name: "Inicio", href: "/" },
  { name: "Guías", href: "/blog" },
  { name: d.title, href: `/blog/${post.id}` },
];
const jsonLd = [
  ldBreadcrumb(crumbs.map((c) => ({ name: c.name, url: absoluteUrl(c.href) }))),
  ldArticle({ title: d.title, description: d.description, url, imageUrl: absoluteUrl(cover.src), pubDate: d.pubDate, updatedDate: d.updatedDate }),
];
---
<BaseLayout title={d.title} description={d.description} ogType="article" jsonLd={jsonLd}>
  <article class="wrap pt-24 pb-16 lg:pt-32">
    <div class="mx-auto max-w-3xl">
      <Breadcrumbs items={crumbs} />
      <p class="mb-3 text-xs font-semibold tracking-widest text-primary uppercase">{d.tags.join(" · ")}</p>
      <h1 class="mb-4 text-3xl leading-tight font-bold md:text-5xl">{d.title}</h1>
      <p class="mb-6 text-lg text-muted-foreground">{d.description}</p>
      <p class="mb-8 text-sm text-muted-foreground">
        Publicado el <time datetime={d.pubDate.toISOString()}>{date}</time>
        {d.updatedDate && <> · Actualizado el <time datetime={d.updatedDate.toISOString()}>{d.updatedDate.toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}</time></>}
      </p>
      <Image src={d.cover} alt={d.coverAlt} width={1200} height={675} format="webp" loading="eager" fetchpriority="high" class="mb-10 aspect-video w-full rounded-2xl object-cover" />
      <div class="prose-dark">
        <slot />
      </div>
    </div>
  </article>

  {related.length > 0 && (
    <section class="bg-card py-16" aria-labelledby="relacionados-titulo">
      <div class="wrap">
        <h2 id="relacionados-titulo" class="mb-8 text-center text-2xl font-bold md:text-3xl">Modelos relacionados</h2>
        <div class:list={["mx-auto grid gap-8", related.length > 1 ? "max-w-5xl md:grid-cols-2" : "max-w-md"]}>
          {related.map((product) => <ProductCard product={product} />)}
        </div>
      </div>
    </section>
  )}

  <CTAFinal wa={`blog-${post.id}-cta`} context="article" subject={d.title} title="¿Te quedó alguna duda?" text="Escribinos por WhatsApp: te respondemos con datos concretos para tu jardín, sin compromiso." />

  {others.length > 0 && (
    <section class="wrap pb-24" aria-labelledby="otras-titulo">
      <h2 id="otras-titulo" class="mb-8 text-2xl font-bold">Otras guías</h2>
      <div class="grid gap-6 md:grid-cols-3">
        {others.map((p) => <ArticleCard post={p} />)}
      </div>
    </section>
  )}
</BaseLayout>
```

- [ ] **Step 2: `src/pages/blog/[slug].astro` y `src/pages/blog/index.astro`**

`[slug].astro`:
```astro
---
import { getCollection, render } from "astro:content";
import type { InferGetStaticPropsType } from "astro";
import ArticleLayout from "@/layouts/ArticleLayout.astro";

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}
type Props = InferGetStaticPropsType<typeof getStaticPaths>;

const { post } = Astro.props as Props;
const { Content } = await render(post);
---
<ArticleLayout post={post}>
  <Content />
</ArticleLayout>
```

`index.astro`:
```astro
---
import { getCollection } from "astro:content";
import ArticleCard from "@/components/ArticleCard.astro";
import Breadcrumbs from "@/components/Breadcrumbs.astro";
import CTAFinal from "@/components/CTAFinal.astro";
import BaseLayout from "@/layouts/BaseLayout.astro";
import { ldBreadcrumb } from "@/lib/schema";
import { absoluteUrl } from "@/lib/seo";

const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
const crumbs = [
  { name: "Inicio", href: "/" },
  { name: "Guías", href: "/blog" },
];
const jsonLd = [ldBreadcrumb(crumbs.map((c) => ({ name: c.name, url: absoluteUrl(c.href) })))];
---
<BaseLayout
  title="Guías sobre robots cortacésped | Blog"
  description="Guías prácticas sobre robots cortacésped: costos, mantenimiento, tecnologías de navegación y cómo elegir el modelo para tu jardín."
  jsonLd={jsonLd}
>
  <div class="wrap pt-24 pb-24 lg:pt-32">
    <Breadcrumbs items={crumbs} />
    <p class="mb-4 text-xs font-semibold tracking-widest text-primary uppercase">Blog</p>
    <h1 class="mb-6 text-4xl font-bold md:text-6xl">Guías sobre robots cortacésped</h1>
    <p class="mb-12 max-w-2xl text-lg text-muted-foreground">Lo que conviene saber antes de comprar: cuánto cuesta de verdad, cómo navegan, qué mantenimiento piden y cuál elegir.</p>
    {posts.length > 0 ? (
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => <ArticleCard post={post} />)}
      </div>
    ) : (
      <p class="rounded-2xl border border-border bg-card p-8 text-muted-foreground">Estamos preparando las primeras guías. Mientras tanto, <a href="/tecnologia" class="text-primary hover:underline">mirá cómo funciona un robot cortacésped</a>.</p>
    )}
  </div>
  <CTAFinal wa="blog-index-cta" />
</BaseLayout>
```

- [ ] **Step 3: `src/pages/rss.xml.ts`**

```ts
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { site } from "@/config/site";

export async function GET(context: APIContext) {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  return rss({
    title: `${site.name} — Guías`,
    description: "Guías prácticas sobre robots cortacésped: costos, mantenimiento, tecnologías de navegación y cómo elegir.",
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}`,
    })),
    customData: "<language>es-AR</language>",
  });
}
```

- [ ] **Step 4: Artículo 1 — `src/content/blog/conviene-robot-cortacesped-argentina.md`**

Portada: `cp src/assets/step-planning.jpg src/content/blog/conviene-robot-cortacesped-argentina.jpg` y `git rm src/content/blog/.gitkeep`.

Frontmatter exacto:

```yaml
---
title: "¿Conviene un robot cortacésped en Argentina? Costo real"
description: "Cuánto cuesta cortar el pasto con jardinero o cortadora propia, cuánto cuesta un robot cortacésped, cuánto tarda en cortar y cuándo no conviene."
pubDate: 2026-09-10
cover: "./conviene-robot-cortacesped-argentina.jpg"
coverAlt: "Plano de un jardín con la ruta de corte planificada por un robot cortacésped"
tags: ["costos", "guía de compra"]
relatedProducts: ["v600", "v1000"]
draft: false
---
```

Cuerpo — redactar siguiendo exactamente esta estructura (el ejecutor escribe la prosa; cada sección indica qué debe decir y qué datos usar):

1. **Párrafo de apertura** (sin encabezado, 3-4 oraciones): la pregunta que se hace todo el mundo antes de gastar el equivalente a un buen sueldo en un aparato; anticipar que la respuesta depende de tres números (cuánto pagás hoy por cortar, cuántos metros tenés, cuánto vale tu tiempo) y que el artículo los pone sobre la mesa.
2. `## Qué es y para quién es un robot cortacésped` — 2 párrafos: qué hace (corta solo, poco y seguido, vuelve a cargar), para quién tiene sentido (jardín de 200 a 1500 m², césped que se corta ≥ 25 veces al año, gente que paga jardinero o dedica sus fines de semana). Aclarar que no reemplaza el bordeado con desmalezadora en canteros muy irregulares.
3. `## Cuánto cuesta cortar el pasto hoy` — subsecciones `### Con jardinero` y `### Con cortadora propia`. **No usar cifras en pesos**: el lector las conoce mejor que nadie. Dar la fórmula: cortes por año (25-35 en zona templada) × lo que paga por corte; para cortadora propia: horas por corte (2 a 2,5 hs para 500 m² incluida limpieza) × 30 cortes = 60-75 horas al año, más nafta, aceite, afilado y la máquina cada 6-8 años. Cerrar con: "anotá tu número; lo vas a necesitar abajo".
4. `## Cuánto cuesta un robot cortacésped` — tabla Markdown con filas: Equipo (referencia: TerraMow V1000 USD 2.100; V600 consultar), Electricidad por año (≈ 100 Wh por carga × ~150 cargas ≈ 15 kWh: "menos que una heladera en una semana"), Cuchillas (kit de 9 cada temporada; costo bajo, indicar "consultar"), Mantenimiento (0: sin aceite, nafta ni filtros), Vida útil (5-8 años con batería reemplazable). Un párrafo: el costo real es la compra; después es casi cero.
5. `## Cuánto tarda en cortar (y por qué no importa tanto)` — datos: 80-120 m²/hora; V600 120 min por carga, V1000 150 min; ejemplos: 600 m² ≈ 5-7 hs repartidas en 2-3 sesiones; 1200 m² ≈ 10-15 hs, típicamente 2 días de trabajo autónomo. Explicar que corta seguido (2-3 veces por semana) y por eso el césped siempre está a la misma altura; el tiempo lo pone el robot, no vos.
6. `## Cuándo NO conviene` — lista con viñetas, honesta: jardín < 150 m² (a mano es más rápido y barato); terrenos con pendientes > 18° o escalones sin rampa; césped con pozos/raíces muy expuestas sin nivelar; jardines donde no hay dónde poner la base con enchufe y Wi-Fi/4G; gente que disfruta cortar el pasto (existe).
7. `## Entonces, ¿conviene?` — cerrar con la cuenta: costo del robot ÷ lo que pagás por año = años de repago; ejemplo genérico "si pagás X por corte y cortás 30 veces, el robot se paga en Y años" expresado con letras (X, Y), y el argumento de tiempo: +156 horas libres por año. Última oración: invitar a chequear el modelo según metros y escribir por WhatsApp.

Links internos obligatorios dentro del texto: `/productos/v1000`, `/productos/v600-vs-v1000`, `/tecnologia`, y `/blog/mantenimiento-robot-cortacesped` (en la sección de costos, al hablar de cuchillas; este link **solo se agrega en la Task 14**, cuando el artículo exista — hasta entonces omitirlo).

- [ ] **Step 5: Build y verificación**

Run: `npm run build 2>&1 | tail -8`
Expected: cuatro ✔. Existen `dist/blog/index.html`, `dist/blog/conviene-robot-cortacesped-argentina/index.html`, `dist/rss.xml`.

Run: `grep -c '"@type":"BlogPosting"' dist/blog/conviene-robot-cortacesped-argentina/index.html && grep -o '<title>[^<]*' dist/blog/conviene-robot-cortacesped-argentina/index.html && grep -c "<item>" dist/rss.xml && grep -c '<h1' dist/blog/conviene-robot-cortacesped-argentina/index.html`
Expected: `1`, el título del frontmatter, `1`, `1`.

Run: `wc -w src/content/blog/conviene-robot-cortacesped-argentina.md`
Expected: entre 1300 y 1900 (frontmatter incluido).

- [ ] **Step 6: Commit y push**

```bash
git add src/layouts/ArticleLayout.astro src/pages/blog src/pages/rss.xml.ts src/content/blog
git commit -m "feat: blog con RSS y primer artículo (¿conviene un robot cortacésped?)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
```

---

### Task 13: Artículo 2 — Cámara con IA vs RTK vs LiDAR

**Files:**
- Create: `src/content/blog/camara-ia-vs-rtk-vs-lidar-robot-cortacesped.md`, `src/content/blog/camara-ia-vs-rtk-vs-lidar-robot-cortacesped.jpg` (copia de `src/assets/step-mapping.jpg`)

- [ ] **Step 1: Frontmatter exacto**

```yaml
---
title: "Cámara con IA vs RTK vs LiDAR en robots cortacésped"
description: "Cómo navegan los robots cortacésped sin cable perimetral: cámara con IA, RTK y LiDAR comparados en instalación, precisión, límites y costo."
pubDate: 2026-09-17
cover: "./camara-ia-vs-rtk-vs-lidar-robot-cortacesped.jpg"
coverAlt: "Robot cortacésped mapeando un jardín con sus cámaras"
tags: ["tecnología", "comparativa"]
relatedProducts: ["v1000"]
draft: false
---
```

- [ ] **Step 2: Cuerpo — estructura obligatoria**

1. **Apertura** (sin encabezado): durante veinte años, "robot cortacésped" significó enterrar un cable alrededor del jardín; hoy hay tres formas de navegar sin cable y no son equivalentes. Este artículo las compara sin marketing.
2. `## El problema que todos resuelven: saber dónde está el césped` — qué hacía el cable perimetral (un límite eléctrico), sus problemas (obra, cortes del cable, imposible cambiar el diseño del jardín, el robot no "ve", solo choca). Las tres tecnologías nuevas resuelven el "dónde estoy" de maneras distintas.
3. `## RTK: GPS de precisión centimétrica` — qué es (GPS + una antena de referencia fija que corrige la señal), precisión 2-3 cm en condiciones ideales; límites concretos: pierde señal bajo árboles frondosos, junto a paredes altas o techos, y el robot se detiene o se desvía; hay que instalar y alimentar la antena de referencia con cielo despejado; el robot no ve obstáculos por sí mismo (necesita sensores adicionales, en general ultrasonido o cámara básica). Para quién: jardines abiertos, sin árboles, grandes.
4. `## LiDAR: el sensor de los autos autónomos` — qué es (láser que mide distancias y arma un mapa 3D), ventaja: funciona de noche y no depende del cielo; límites: no distingue césped de tierra o de un cantero bajo (mide forma, no "qué es"), sensible a lluvia intensa y polvo, componente caro y con partes móviles en muchos modelos, y en jardines abiertos sin referencias verticales (paredes, árboles) puede perder posición. Para quién: jardines con muchas estructuras, presupuesto alto.
5. `## Cámara con IA: el robot que ve` — qué es (varias cámaras + un modelo de visión entrenado para reconocer césped, bordes, caminos, obstáculos, personas y mascotas); ventajas: cero instalación (ni cable ni antena), reconoce *qué* es cada cosa y no solo *dónde* está, se adapta si cambiás el jardín, detecta obstáculos pequeños (juguetes, mangueras, erizos); límites honestos: necesita luz (no trabaja de noche cerrada — sí al atardecer y con luz de patio), lentes que hay que limpiar cada tanto, y en césped extremadamente uniforme y sin bordes visibles puede necesitar delimitar zonas en la app. Ejemplo: TerraMow V Series usa tres cámaras (TerraVision 2.0) — una mención, sin más promoción.
6. `## Comparativa` — tabla Markdown con columnas Cámara con IA / RTK / LiDAR y filas: Instalación (nada / antena fija con cielo abierto / nada), Obra en el jardín (no / no / no), Funciona bajo árboles (sí / no o mal / sí), Funciona de noche (no / sí / sí), Reconoce césped vs no-césped (sí / no / no), Detecta obstáculos chicos (sí / depende de sensores extra / parcial), Cambiar el diseño del jardín (remapear desde la app / remapear / remapear), Sensibilidad a lluvia fuerte (media / baja / alta), Costo relativo (medio / medio-alto por la antena / alto).
7. `## Cuál conviene según tu jardín` — 4 viñetas: jardín con árboles y canteros → cámara; campo abierto enorme sin sombra → RTK puede servir; querés cortar de noche sí o sí → LiDAR o RTK; querés instalar en 20 minutos y olvidarte → cámara. Cerrar con una oración: para el jardín típico argentino (300-1200 m², árboles, quincho, pileta) la cámara con IA es la opción con menos fricción.
8. `## Conclusión` — 1 párrafo + link a `/tecnologia` y a `/productos/v1000`; invitación a WhatsApp.

Links internos obligatorios: `/tecnologia`, `/productos/v1000`, `/productos/v600-vs-v1000`.

- [ ] **Step 3: Build, verificación y commit**

Run: `npm run build 2>&1 | tail -8 && grep -c "<item>" dist/rss.xml && wc -w src/content/blog/camara-ia-vs-rtk-vs-lidar-robot-cortacesped.md`
Expected: cuatro ✔; `2`; 1300-1900 palabras. En `dist/tecnologia/index.html` ahora aparece el link "Leé la guía comparativa" (`grep -c 'camara-ia-vs-rtk' dist/tecnologia/index.html` → `1`).

```bash
git add src/content/blog
git commit -m "content: artículo 'Cámara con IA vs RTK vs LiDAR'

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
```

---

### Task 14: Artículo 3 — Mantenimiento (y "¿hay que recoger el césped?")

**Files:**
- Create: `src/content/blog/mantenimiento-robot-cortacesped.md`, `src/content/blog/mantenimiento-robot-cortacesped.jpg` (copia de `src/assets/step-cutting.jpg`)
- Modify: `src/content/blog/conviene-robot-cortacesped-argentina.md` (agregar el link a mantenimiento en la sección de costos)

- [ ] **Step 1: Frontmatter exacto**

```yaml
---
title: "Mantenimiento de un robot cortacésped: qué hacer y qué no"
description: "¿Hay que recoger el césped cortado? ¿Cada cuánto se cambian las cuchillas? Guía de mantenimiento de un robot cortacésped: limpieza, lluvia, invierno y batería."
pubDate: 2026-09-24
cover: "./mantenimiento-robot-cortacesped.jpg"
coverAlt: "Robot cortacésped trabajando sobre el césped, visto de cerca"
tags: ["mantenimiento", "uso"]
relatedProducts: ["v600", "v1000"]
draft: false
---
```

- [ ] **Step 2: Cuerpo — estructura obligatoria**

1. **Apertura**: las tres preguntas que más recibimos por WhatsApp son sobre mantenimiento; la respuesta corta es "muchísimo menos que una cortadora"; la larga es este artículo.
2. `## ¿Hay que recoger el césped cortado?` — **No**. Explicar el mulching: el robot corta pocos milímetros cada vez (2-3 veces por semana), los recortes miden milímetros, caen entre las hojas, se descomponen en 24-48 hs y devuelven nitrógeno al suelo. Consecuencias prácticas: no hay bolsas, no hay pila de pasto, no hay rastrillo; el césped se ve más verde y necesita menos fertilizante. Único caso donde puede verse resto: la primera pasada si el pasto estaba muy alto (> 10 cm) — recomendar un corte manual previo y arrancar el robot con altura máxima e ir bajando.
3. `## Cuchillas: lo único que se cambia seguido` — cuchillas pequeñas y giratorias (no una hoja grande); se cambian cada 4-8 semanas según uso y arena en el suelo; señal de cambio: puntas del césped amarronadas/deshilachadas; se cambian con un destornillador en 5 minutos; TerraMow entrega un kit de 9; guantes; girar el robot sobre un cartón. Costo: bajo (una fracción de un afilado de cortadora), "consultar".
4. `## Limpieza` — semanal o quincenal: dar vuelta el robot, cepillo seco o de cerdas suaves para la parte inferior y las ruedas; paño húmedo para carcasa y **lentes de las cámaras** (en robots con visión, la limpieza de lentes es la tarea más importante: 10 segundos, cada semana). **Nunca** hidrolavadora ni chorro de agua directo (IPX6 protege de lluvia, no de presión). No usar solventes.
5. `## Lluvia, rocío y calor` — sensor de lluvia: el robot vuelve a la base y espera; el rocío de la mañana es normal; programar cortes a media mañana o tarde; en olas de calor > 35 °C conviene programar de tarde para no estresar el césped (no por el robot). Temperatura de operación de referencia 0-50/55 °C.
6. `## Invierno y guardado` — en zonas con heladas o donde el pasto deja de crecer: limpiar, cargar la batería al 50-70 %, guardar bajo techo a más de 0 °C, apagar; la base puede quedar afuera pero mejor desenchufada si hay tormentas eléctricas; al volver: actualizar la app (OTA), remapear si cambió el jardín.
7. `## Batería` — litio, sin efecto memoria; dura 5-8 años/ciclos según uso; no descargar a cero por meses; reemplazable por servicio técnico; no dejar al sol directo en la base sin techo si la base puede tener sombra (calor acorta la vida).
8. `## Qué NO hacer` — lista: hidrolavadora; levantarlo con las cuchillas girando (se frenan solas, igual esperar); usar cuchillas de otra marca sin verificar medida; cortar con el pasto empapado por elección; dejar juguetes/mangueras/piñas (aunque los esquive, mejor el jardín despejado); ignorar las notificaciones de la app.
9. `## Cuánto tiempo y dinero lleva por año` — tabla: Tarea / Frecuencia / Tiempo: cambio de cuchillas (cada 4-8 semanas, 5 min), limpieza (semanal, 5 min), limpiar lentes (semanal, 10 seg), guardado de invierno (1 vez, 20 min), actualización app (automática, 0). Total: ~2 horas por año, contra 10-12 de una cortadora (afilado, aceite, bujía, filtro, limpieza). Costo: cuchillas + electricidad; nada más.
10. `## Conclusión` — 1 párrafo + CTA WhatsApp.

Links internos obligatorios: `/blog/conviene-robot-cortacesped-argentina`, `/productos/v1000`, `/tecnologia`.

- [ ] **Step 3: Agregar el link cruzado en el artículo 1**

En `conviene-robot-cortacesped-argentina.md`, sección "Cuánto cuesta un robot cortacésped", donde se mencionan las cuchillas, agregar el link `[guía de mantenimiento](/blog/mantenimiento-robot-cortacesped)`.

- [ ] **Step 4: Build, verificación y commit**

Run: `npm run build 2>&1 | tail -8 && grep -c "<item>" dist/rss.xml && grep -c 'Antes de decidir, informate' dist/index.html && wc -w src/content/blog/mantenimiento-robot-cortacesped.md`
Expected: cuatro ✔; `3`; `1` (el bloque "Guías" ya aparece en la home con 3 artículos); 1300-1900 palabras.

Run: `grep -o 'href="/blog/[^"]*"' dist/index.html | sort -u`
Expected: los tres slugs (links del FAQ) y `/blog`.

```bash
git add src/content/blog
git commit -m "content: artículo 'Mantenimiento de un robot cortacésped' + link cruzado

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
```

---

### Task 15: Medios — video, imágenes OG, logo e íconos

**Files:**
- Create: `scripts/media/compress-video.mjs`, `scripts/media/og-images.mjs`, `scripts/media/icons.mjs`, `public/videos/hero.mp4`, `public/videos/hero.webm`, `public/og/default.jpg` (reemplaza el placeholder), `public/og/v600.jpg`, `public/og/v1000.jpg`, `public/logo.png`, `public/apple-touch-icon.png`

**Interfaces:**
- Consumes: `media/hero-original.mp4`, `src/assets/logo.png`, `src/assets/products/*.png`, `src/assets/hero-mower.jpg`.
- Produces: los archivos de `public/` referenciados por `Hero.astro` (`/videos/hero.{mp4,webm}`), `SEO.astro` (`/og/default.jpg`), `products/*.json` (`/og/v600.jpg`, `/og/v1000.jpg`), `ldOrganization()` (`/logo.png`), `BaseLayout` (`/apple-touch-icon.png`).

- [ ] **Step 1: `scripts/media/compress-video.mjs`**

```js
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import ffmpegPath from "ffmpeg-static";

const INPUT = "media/hero-original.mp4";
const OUT_DIR = "public/videos";
const LIMIT = 600 * 1024;
const SECONDS = 10;
const FILTER = "scale=1280:-2,fps=24";

mkdirSync(OUT_DIR, { recursive: true });

function run(args) {
  execFileSync(ffmpegPath, ["-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit" });
}

function encodeUntilFits(name, build) {
  for (const crf of build.crfs) {
    const out = `${OUT_DIR}/${name}`;
    run(["-i", INPUT, "-t", String(SECONDS), "-an", "-vf", FILTER, ...build.codec(crf), out]);
    const size = statSync(out).size;
    console.log(`${name}: crf ${crf} → ${Math.round(size / 1024)} KB`);
    if (size <= LIMIT) return;
  }
  console.error(`${name} supera ${LIMIT / 1024} KB con todos los crf probados. Bajar SECONDS o la resolución en FILTER.`);
  process.exit(1);
}

encodeUntilFits("hero.mp4", {
  crfs: [30, 33, 36, 39],
  codec: (crf) => ["-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart"],
});
encodeUntilFits("hero.webm", {
  crfs: [40, 44, 48, 52],
  codec: (crf) => ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(crf), "-row-mt", "1", "-deadline", "good"],
});
console.log("Video listo en public/videos/");
```

Run: `npm run media:video`
Expected: dos líneas con tamaño ≤ 600 KB y `Video listo`. Verificar reproducción abriendo `public/videos/hero.mp4` en el navegador (Bash: `start public/videos/hero.mp4`).

- [ ] **Step 2: `scripts/media/og-images.mjs`**

```js
import { mkdirSync, readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const W = 1200, H = 630;
const OUT = "public/og";
mkdirSync(OUT, { recursive: true });

const dataUri = async (file, width) => {
  const buf = await sharp(file).resize({ width, withoutEnlargement: true }).png().toBuffer();
  return `data:image/png;base64,${buf.toString("base64")}`;
};

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function render(name, { lines, subtitle, image }) {
  const logo = await dataUri("src/assets/logo.png", 320);
  const picture = image ? await dataUri(image, 560) : "";
  const title = lines
    .map((l, i) => `<text x="80" y="${300 + i * 78}" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="68" font-weight="800" fill="#f2f2f2">${escape(l)}</text>`)
    .join("");
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g" cx="85%" cy="20%" r="70%"><stop offset="0" stop-color="#8fd014" stop-opacity="0.28"/><stop offset="1" stop-color="#0b0b0b" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0b0b0b"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0" y="0" width="12" height="${H}" fill="#8fd014"/>
  <image href="${logo}" x="80" y="70" width="300" />
  ${picture ? `<image href="${picture}" x="${W - 560 - 60}" y="${H - 560 + 20}" width="560" height="560" preserveAspectRatio="xMidYMid meet" />` : ""}
  ${title}
  <text x="80" y="${300 + lines.length * 78}" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="30" fill="#a3a3a3">${escape(subtitle)}</text>
  <text x="80" y="${H - 60}" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="24" font-weight="600" fill="#8fd014">robotscortacesped.com.ar · Distribuidor autorizado de TerraMow</text>
</svg>`;
  const png = new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { loadSystemFonts: true, defaultFontFamily: "Segoe UI" } }).render().asPng();
  const out = `${OUT}/${name}.jpg`;
  await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  console.log(`${out}: ${Math.round(readFileSync(out).length / 1024)} KB`);
}

await render("default", { lines: ["Robot cortacésped", "con inteligencia artificial"], subtitle: "Sin cables perimetrales · Garantía y soporte local · Envíos a todo el país", image: "src/assets/hero-mower.jpg" });
await render("v600", { lines: ["TerraMow V600", "hasta 600 m²"], subtitle: "Navegación por cámara con IA · Sin cables ni RTK", image: "src/assets/products/v600.png" });
await render("v1000", { lines: ["TerraMow V1000", "hasta 1200 m²"], subtitle: "Navegación por cámara con IA · 150 min de autonomía", image: "src/assets/products/v1000.png" });
```

Nota: si la fuente "Segoe UI" no está disponible (máquina no Windows), resvg usa la `defaultFontFamily` que encuentre; cambiar a `"Inter"` o `"Arial"` en ese caso.

Run: `npm run media:og`
Expected: tres archivos de 60-160 KB. Abrir `public/og/v1000.jpg` y verificar: fondo negro, barra lima, logo arriba a la izquierda, título en dos líneas, foto del robot a la derecha, texto del pie visible. Ajustar `y` de la foto si tapa el título.

- [ ] **Step 3: `scripts/media/icons.mjs`**

```js
import sharp from "sharp";

await sharp("src/assets/logo.png").resize({ width: 512, height: 512, fit: "contain", background: { r: 11, g: 11, b: 11, alpha: 1 } }).png().toFile("public/logo.png");
await sharp("src/assets/logo.png").resize({ width: 180, height: 180, fit: "contain", background: { r: 11, g: 11, b: 11, alpha: 1 } }).png().toFile("public/apple-touch-icon.png");
console.log("public/logo.png y public/apple-touch-icon.png generados");
```

Run: `npm run media:icons && ls -la public/logo.png public/apple-touch-icon.png`
Expected: ambos existen, < 100 KB cada uno.

- [ ] **Step 4: Build completo y verificación de peso**

Run: `npm run build 2>&1 | tail -8`
Expected: cuatro ✔, incluido `Presupuesto de peso` (el video no cuenta; los OG no se cargan en la página).

Run: `ls -la public/videos public/og`
Expected: `hero.mp4` y `hero.webm` ≤ 600 KB; tres JPG.

Manual: `npx astro preview` → en desktop (≥ 1024 px) el hero reproduce el video (Network: se descargan `hero.webm` o `hero.mp4`); en 375 px **no** aparece ningún request a `/videos/`.

- [ ] **Step 5: Commit y push**

```bash
git add scripts/media public/videos public/og public/logo.png public/apple-touch-icon.png
git commit -m "feat: video comprimido, imágenes OG, logo e íconos generados por script

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
```

---

### Task 16: README, verificación final y lanzamiento

**Files:**
- Modify: `README.md` (reemplazo completo)
- Create: `.env.example`

- [ ] **Step 1: `.env.example`**

```
# ID de Google Analytics 4 (Administrar → Flujos de datos → ID de medición). Vacío = GA desactivado.
PUBLIC_GA_ID=
```

- [ ] **Step 2: `README.md`**

```markdown
# Robot Cortacésped Argentina — robotscortacesped.com.ar

Sitio estático en [Astro](https://astro.build) + Tailwind 4. Objetivo: que el visitante escriba por WhatsApp. Sin tienda online.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias (Node ≥ 22.12) |
| `npm run dev` | Servidor local en http://localhost:4321 |
| `npm run build` | Build de producción en `dist/` + chequeos (links, SEO, palabra prohibida, peso). Si un chequeo falla, el build falla y Vercel no publica. |
| `npm run preview` | Sirve `dist/` para probar el build |
| `npm test` | Tests unitarios (Vitest) |
| `npm run media:video` | Recomprime `media/hero-original.mp4` → `public/videos/` |
| `npm run media:og` | Regenera las imágenes de preview (`public/og/`) |
| `npm run media:icons` | Regenera `public/logo.png` y `apple-touch-icon.png` |

## Publicar

`master` está conectado a Vercel: **cada push a `master` publica el sitio**. Para cambios grandes, trabajar en una rama: Vercel genera una URL de preview por rama.

## Cómo hacer las cosas comunes

### Cambiar el número de WhatsApp o los mensajes

`src/config/site.ts` → `whatsapp.number` (formato internacional sin `+`: `549…`). Los mensajes por contexto están en `src/lib/whatsapp.ts`.

### Agregar o editar un artículo del blog

1. Crear `src/content/blog/mi-articulo.md` (el nombre del archivo es la URL: `/blog/mi-articulo`).
2. Poner la portada al lado: `src/content/blog/mi-articulo.jpg` (mínimo 1200 px de ancho, formato 16:9).
3. Encabezado obligatorio:

   ```yaml
   ---
   title: "Título de hasta 60 caracteres"
   description: "Resumen de 50 a 160 caracteres; es lo que muestra Google."
   pubDate: 2026-10-01
   cover: "./mi-articulo.jpg"
   coverAlt: "Descripción de la imagen"
   tags: ["tema"]
   relatedProducts: ["v1000"]   # opcional: v600, v1000
   draft: false                 # true = no se publica
   ---
   ```
4. Escribir el cuerpo en Markdown usando `##` para las secciones (sin `#`: el título ya es el H1).
5. `npm run build` — si falta un campo o un link está roto, el build lo dice. Commit y push.

### Editar un producto (precio, stock, specs)

`src/content/products/v600.json` y `v1000.json`. Campos clave: `priceUSD` (número o `null` = "Consultar precio"), `inStock` (`true`/`false`), `coverageM2`, `specs`. Todas las páginas leen de acá.

### Editar las preguntas frecuentes

`src/content/faq/*.json`. `scope` define dónde aparece cada una: `home`, `v600`, `v1000`, `comparativa`. `link` es opcional.

### Activar Google Analytics 4

1. En https://analytics.google.com crear una propiedad → flujo de datos web → copiar el **ID de medición** (`G-XXXXXXXXXX`).
2. En Vercel: Project → Settings → Environment Variables → `PUBLIC_GA_ID` = el ID → Save.
3. Deployments → Redeploy del último deploy.
4. Verificar: en GA4 → Administrar → DebugView, hacer click en un botón de WhatsApp del sitio y ver el evento `contact_whatsapp` con `location` y `product`.

Sin la variable, el sitio no carga nada de Google.

### Reemplazar el video del hero

Copiar el original a `media/hero-original.mp4` y correr `npm run media:video`. Genera `public/videos/hero.mp4` y `hero.webm` de ≤ 600 KB (10 s, sin audio). Se reproduce solo en desktop.

## Reglas que el build hace cumplir

- La palabra "oficial" no puede aparecer en ninguna página (usar "Distribuidor autorizado de TerraMow", "garantía del fabricante").
- Todo link interno debe existir.
- Cada página: un solo `<h1>`, `<title>` ≤ 60 caracteres, descripción de 50-160, canónica correcta, imagen de preview existente.
- La home no puede superar 500 KB (sin contar el video).

## Después de publicar

- [Search Console](https://search.google.com/search-console): Sitemaps → enviar `https://www.robotscortacesped.com.ar/sitemap-index.xml`.
- A los 7 días: verificar en Search Console → Páginas que las URLs estén indexadas; mirar GA4.
- A los 28 días: Search Console → Core Web Vitals.

## Estructura

```
src/
  config/site.ts        datos del sitio (WhatsApp, email, URL, marca)
  content/              productos, FAQ y blog (validados en build)
  components/           piezas de página
  layouts/              BaseLayout (todas las páginas), ArticleLayout (blog)
  lib/                  funciones puras con tests (precios, cotización, JSON-LD, URLs)
  pages/                rutas
  scripts/              los 5 scripts del navegador
scripts/check/          chequeos que corren después del build
scripts/media/          generación de video, OG e íconos
docs/superpowers/       spec y planes de la migración
```
```

- [ ] **Step 3: Verificación final en el preview de Vercel**

Con la URL de preview de la rama `astro` (Vercel → Deployments):

1. **Lighthouse móvil** en `/`, `/productos/v1000` y un artículo:
   Run: `npx --yes lighthouse@latest <URL> --preset=perf --form-factor=mobile --screenEmulation.mobile --only-categories=performance,seo,accessibility,best-practices --output=json --output-path=./lh.json --chrome-flags="--headless" && node -e "const r=require('./lh.json').categories;console.log(Object.fromEntries(Object.entries(r).map(([k,v])=>[k,Math.round(v.score*100)])))"`
   Expected: `performance ≥ 95`, `seo = 100`, `accessibility ≥ 95`, `best-practices ≥ 95`. Guardar la salida en el mensaje de cierre. Borrar `lh.json`.
2. **Rich Results Test** (https://search.google.com/test/rich-results): pegar la URL de `/productos/v1000`, `/` y `/blog/mantenimiento-robot-cortacesped`. Expected: sin errores en Product, FAQ y Article (advertencias sobre campos opcionales como `review` son aceptables).
3. **Preview de WhatsApp**: compartir cada URL en un chat de WhatsApp real. Expected: imagen 1200×630, título y descripción correctos para home, ambas fichas, comparativa, tecnología y un artículo.
4. **Celular real** (Android o iPhone): menú; toggle USD/ARS con y sin red; barra fija; cada botón de WhatsApp abre el chat con `+54 9 2494 31-8185` y el mensaje de su contexto; el video **no** se descarga en móvil.
5. **Consola**: en Chrome DevTools, recorrer las 8 páginas; expected: 0 `console.error`.
6. **Palabra prohibida en producción-preview**: `curl -s <URL-preview>/ | grep -ic oficial` → `0`.

Si algo falla, corregir en la rama `astro`, commit, push, repetir.

- [ ] **Step 4: Commit de la documentación y push**

```bash
git add README.md .env.example
git commit -m "docs: README completo y .env.example

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
```

- [ ] **Step 5: Lanzamiento (solo con confirmación explícita del usuario)**

Presentar al usuario: la URL de preview, los scores de Lighthouse, el resultado del Rich Results Test y las capturas del preview de WhatsApp. Preguntar textualmente: **"¿Hago el merge a `master` y publico?"**. Solo si responde que sí:

```bash
git checkout master
git pull
git merge --no-ff astro -m "feat: sitio nuevo en Astro (rediseño + SEO + blog)

Reemplaza la SPA React/Vite por un sitio estático en Astro 7.
Ver docs/superpowers/specs/2026-09-03-migracion-astro-seo-design.md.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
```

Expected: Vercel construye `master` y publica. Verificar en producción:

Run: `for p in / /tecnologia /productos/v600 /productos/v1000 /productos/v600-vs-v1000 /blog /blog/mantenimiento-robot-cortacesped /rss.xml /sitemap-index.xml /og/default.jpg /logo.png /no-existe; do printf "%-45s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" -L "https://www.robotscortacesped.com.ar$p"; done`
Expected: `200` en todas salvo `/no-existe` → `404`.

- [ ] **Step 6: Post-lanzamiento**

1. Search Console → Sitemaps → enviar `https://www.robotscortacesped.com.ar/sitemap-index.xml` (lo hace el usuario; indicarle el paso).
2. Borrar la rama: `git branch -d astro && git push origin --delete astro`.
3. Recordar al usuario los pendientes que quedan de su lado: `PUBLIC_GA_ID` en Vercel, precio del V600 cuando haya stock, y el video original si quiere reemplazar el comprimido.

---

## Fin de la Parte 3

Con esto se cumplen los criterios de aceptación de la spec (§14). Verificarlos uno por uno antes de dar por cerrada la migración:

- [ ] `npm run build` verde en Vercel, incluyendo los 4 chequeos.
- [ ] Las 8 URLs responden 200 en producción; `/404` responde 404 en español.
- [ ] Ningún archivo de `dist/` contiene "oficial".
- [ ] Preview de WhatsApp con imagen y título correctos en home, fichas, comparativa, tecnología y un artículo.
- [ ] Rich Results Test sin errores en ficha, home y artículo.
- [ ] Lighthouse móvil: Performance ≥ 95, SEO 100, Accesibilidad ≥ 95.
- [ ] Home ≤ 500 KB (sin video); fotos de producto ≤ 150 KB.
- [ ] Todos los botones de WhatsApp abren `wa.me/5492494318185` con el mensaje de su contexto y llevan `data-wa`.
- [ ] Con `PUBLIC_GA_ID` cargado, un click a WhatsApp aparece en GA4 DebugView como `contact_whatsapp`.
- [ ] 3 artículos publicados; bloque "Guías" visible en la home; RSS válido.
- [ ] `dist/`, `*.tsbuildinfo`, `bun.lock` fuera del repo; `.superpowers/` ignorado.
- [ ] README con: correr, agregar artículo, editar producto, cambiar WhatsApp, activar GA4, publicar.
