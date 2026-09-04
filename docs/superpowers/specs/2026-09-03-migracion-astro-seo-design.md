# Migración a Astro + SEO — Diseño

**Fecha:** 2026-09-03
**Proyecto:** robotscortacesped.com.ar (repo `sergiogaguero/robot-cortacesped-argentina`)
**Estado:** aprobado por secciones en sesión de brainstorming; pendiente de revisión final del documento.

---

## 1. Objetivo

Reemplazar el sitio actual (SPA en React/Vite generada con Lovable) por un sitio **estático en Astro**, rediseñado, con la mejor base técnica posible para posicionar en Google y con un único objetivo de negocio: **que el visitante escriba por WhatsApp para comprar**. No es una tienda online.

Métricas de éxito:

- Todas las URLs responden 200 en producción (hoy `/tecnologia` y `/productos/v1000` dan 404).
- Un link compartido por WhatsApp/Instagram muestra preview con imagen y título correctos para cada página.
- Lighthouse móvil: Performance ≥ 95, SEO = 100, Accesibilidad ≥ 95.
- Home < 500 KB de transferencia inicial (hoy ≈ 5,5 MB).
- Cada click a WhatsApp queda medido en GA4 con página y botón de origen.
- Blog operativo con 3 artículos publicados.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Alcance SEO | Técnico + contenido (blog con content collections, 3 artículos iniciales) |
| Deploy | Vercel conectado a GitHub. Cloudflare delante (DNS/proxy). Push a `master` = producción |
| Rama de trabajo | `astro` (Vercel genera preview por rama). Merge a `master` = lanzamiento único |
| Páginas de producto | `/productos/v600` y `/productos/v1000` + comparativa `/productos/v600-vs-v1000` |
| Precio | USD fijo + toggle a ARS con cotización en vivo y valor de respaldo |
| Medición | GA4 con eventos `contact_whatsapp`; se activa solo si `PUBLIC_GA_ID` está definido |
| Diseño | Rediseño. Dirección **"Tech oscuro"** (fondo negro, verde lima, brillos) |
| Secuencia | Todo junto, sin parche al sitio actual; un solo lanzamiento |
| Copy prohibido | **"Distribuidor Oficial"** no aparece en ningún lugar del sitio (texto, meta, JSON-LD, artículos) |
| Copy aprobado | **"Distribuidor autorizado de TerraMow"** |
| Hero | Video comprimido solo en desktop con `poster`; imagen WebP en móvil; respeta `prefers-reduced-motion` |
| Home | Layout **B · Persuasivo** + bloque "Guías" condicional (≥ 3 artículos) |
| Ficha de producto | Layout **C**: ficha clásica + barra fija móvil (precio + WhatsApp) + bloque "¿Es para tu jardín?" + link a comparativa |
| Blog | Robots cortacésped en general (TerraMow como ejemplo, no protagonista) |
| Enfoque técnico | **Astro puro**: sin frameworks de UI en el navegador; 5 scripts en JS plano |
| WhatsApp | **+54 9 2494 318185** → `5492494318185` (el sitio actual usa `5492494028837`) |
| Voz | Voseo rioplatense ("Elegí", "Consultá", "Descubrí"), como el sitio actual |

## 3. Alcance

**Incluido:** todo lo descrito en este documento: proyecto Astro nuevo, 8 rutas, rediseño, modelo de contenido, capa SEO completa, 5 scripts, GA4, 3 artículos, assets optimizados, tests y chequeos de build, README, lanzamiento.

**Fuera de alcance (explícito):** CMS visual (Keystatic u otro), tienda/carrito/pagos, más idiomas, newsletter, chat en vivo, pixel de Meta (se puede sumar después; el diseño lo permite sin rehacer nada).

## 4. Arquitectura

### 4.1 Stack

| Pieza | Elección | Motivo |
|---|---|---|
| Framework | Astro (última estable al momento de implementar), `output: 'static'` | HTML por ruta, cero JS por defecto |
| Estilos | Tailwind 4 vía `@tailwindcss/vite`; tokens de color en `@theme` con los mismos HSL del sitio actual | Mismo lenguaje visual, config en CSS |
| Fuente | `@fontsource-variable/inter` (auto-alojada) | Elimina Google Fonts (render-blocking, conexión externa) |
| Imágenes | `astro:assets` (sharp) | WebP/AVIF, tamaños responsive, `width/height` automáticos |
| Sitemap | `@astrojs/sitemap` | `lastmod` real, excluye borradores |
| RSS | `@astrojs/rss` | Feed del blog |
| Tests | Vitest (ya presente) | Funciones puras de `lib/` |
| Chequeos | Scripts Node en `scripts/check/` con `node-html-parser` | Reglas propias sobre `dist/` |
| Tipos | TypeScript `strict: true` | El sitio actual tiene `strict: false` y por eso acumuló código muerto |

Objetivo: **≈ 12-15 dependencias** (hoy ≈ 70).

### 4.2 Rutas

| URL | Página | Estado respecto al sitio actual |
|---|---|---|
| `/` | Home | Rediseñada |
| `/productos/v600` | Ficha V600 | Nueva |
| `/productos/v1000` | Ficha V1000 | Misma URL (conserva indexación) |
| `/productos/v600-vs-v1000` | Comparativa | Nueva |
| `/tecnologia` | Guía "cómo funciona" | Misma URL |
| `/blog` | Índice de guías | Nueva |
| `/blog/<slug>` | Artículo | Nueva |
| `/404` | No encontrada (español, `noindex`) | Reemplaza la actual en inglés |
| `/rss.xml` | Feed del blog | Nueva |
| `/sitemap-index.xml` | Sitemap | Reemplaza el manual |

No hace falta ninguna redirección: las URLs existentes se conservan.

### 4.3 Estructura de carpetas

```
src/
  layouts/
    BaseLayout.astro          <head> completo (SEO, OG, JSON-LD), navbar, footer, GA, WhatsApp flotante
    ArticleLayout.astro       Envuelve BaseLayout para artículos del blog
  components/
    Navbar.astro  Footer.astro  Hero.astro  TrustStrip.astro  WhyRobot.astro
    ProductCard.astro  ProductGrid.astro  WhichOne.astro  HowItWorks.astro
    FAQ.astro  CTAFinal.astro  WhatsAppFloat.astro  WhatsAppButton.astro
    StickyBar.astro  PriceBlock.astro  FitCheck.astro  SpecsTable.astro
    ArticleCard.astro  ArticlesBlock.astro  Breadcrumbs.astro  SEO.astro  JsonLd.astro
  pages/
    index.astro
    productos/[slug].astro                (genera v600 y v1000 desde la colección)
    productos/v600-vs-v1000.astro
    tecnologia.astro
    blog/index.astro
    blog/[slug].astro
    404.astro
    rss.xml.ts
  content/
    config.ts                             esquemas (zod) de las 3 colecciones
    products/v600.json  v1000.json
    faq/*.json
    blog/*.md  (+ imágenes de portada junto a cada .md)
  config/site.ts                          WhatsApp, mensajes, email, Instagram, URL, marca, fallback de cotización, GA
  lib/
    whatsapp.ts   price.ts   exchange-rate.ts   schema.ts   seo.ts
  scripts/                                los 5 scripts del navegador (se importan desde los componentes)
    menu.ts  currency.ts  sticky-bar.ts  analytics.ts  hero.ts
  styles/global.css                       Tailwind + @theme con tokens + utilidades propias (text-gradient, glow)
  assets/                                 imágenes fuente (las procesa astro:assets)
public/
  robots.txt  favicon.ico  favicon.svg  apple-touch-icon.png
  og/default.jpg  og/v600.jpg  og/v1000.jpg   (1200×630)
  logo.png                                referenciado por Organization.logo
  videos/hero.mp4  videos/hero.webm       comprimidos, solo desktop
scripts/check/                            chequeos de build (ver §10.2)
docs/superpowers/specs/                   este documento
tests/                                    Vitest
```

### 4.4 Repo y deploy

- **Se eliminan del repo:** `src/` actual completo (incluidos los 49 componentes de `ui/`, hooks, `App.css`, `tailwind.config.lov.json`), `dist/` (trackeado por error), `tsconfig.*.tsbuildinfo`, `bun.lock`, `vite.config.ts`, `vitest.config.ts` (se reemplaza), `tailwind.config.ts`, `postcss.config.js`, `components.json`, `eslint.config.js` (se reemplaza por uno mínimo), `lovable-tagger` y ≈ 55 dependencias sin uso.
- **`.gitignore`:** agrega `.superpowers/`, `.astro/`, `.vercel/`; conserva `dist/`, `node_modules/`.
- **Vercel:** detecta Astro automáticamente; no hace falta `vercel.json` ni adaptador (salida estática). Build command `npm run build`, que ejecuta los chequeos antes (§10.2): si fallan, no se publica.
- **Variables de entorno en Vercel:** `PUBLIC_GA_ID` (vacía hasta que el usuario la cargue).
- **README.md** real: correr en local, agregar un artículo, agregar/editar un producto, cambiar el número de WhatsApp, activar GA4 (5 pasos), publicar.

## 5. Modelo de contenido

Principio: **cada dato vive en un solo lugar**. Todas las páginas leen de las colecciones; el esquema se valida en build y un dato faltante o mal tipado **rompe el build con un mensaje que dice archivo y campo**.

### 5.1 `products` (JSON, uno por modelo)

```ts
{
  name: string,                 // "TerraMow V1000"
  slug: "v600" | "v1000",
  tagline: string,
  coverageM2: number,           // V1000: pendiente confirmar 1000 vs 1200 (ver §12)
  priceUSD: number | null,      // null → "Consultar precio", sin toggle
  inStock: boolean,
  highlights: string[],         // 4 bullets bajo el precio
  fit: { maxSlopeDeg: number, obstacles: boolean, multiZone: boolean, noiseDb: number },
  specs: { category: string, items: { label: string, value: string }[] }[],
  images: { main: ImageMetadata, gallery?: ImageMetadata[] },   // via image() del schema
  ogImage: string,              // "/og/v1000.jpg"
  faq: string[],                // ids de la colección faq
  seo: { title: string, description: string }
}
```

### 5.2 `faq` (JSON, uno por pregunta)

```ts
{ id: string, question: string, answer: string, scope: ("home" | "v600" | "v1000" | "tecnologia")[], order: number }
```

La misma fuente alimenta lo que se ve en pantalla y el JSON-LD `FAQPage` de cada página (deben coincidir; Google lo verifica).

### 5.3 `blog` (Markdown con frontmatter)

```yaml
title: string            # ≤ 60 caracteres
description: string      # 50-160 caracteres; es la meta description
pubDate: date
updatedDate?: date
cover: image             # relativa al .md; se optimiza con astro:assets
coverAlt: string
tags: string[]
relatedProducts: ("v600" | "v1000")[]
draft: boolean           # true → no se publica, no entra al sitemap ni al RSS
```

Un artículo nuevo = un archivo `.md`. Aparece en `/blog`, sitemap, RSS, JSON-LD `BlogPosting`, y en el bloque "Guías" de la home cuando hay ≥ 3 publicados.

### 5.4 `config/site.ts`

```ts
export const site = {
  url: "https://www.robotscortacesped.com.ar",
  name: "Robot Cortacésped Argentina",
  brandClaim: "Distribuidor autorizado de TerraMow",
  locale: "es_AR",
  whatsapp: {
    number: "5492494318185",
    messages: {
      general: "Hola, quiero consultar por los robots cortacésped TerraMow.",
      product: (name: string) => `Hola, quiero consultar por el ${name}.`,
      priceARS: (name: string) => `Hola, quiero saber el precio en pesos del ${name}.`,
      article: (title: string) => `Hola, leí la guía "${title}" y tengo una consulta.`,
      compare: "Hola, no sé si me conviene el V600 o el V1000. ¿Me ayudan a elegir?",
    },
  },
  email: "ventas@robotscortacesped.com.ar",
  instagram: "https://www.instagram.com/robotscortacesped_argentina/",
  terramow: "https://www.terramow.com/",
  location: { locality: "Buenos Aires", country: "AR" },
  exchangeRate: { fallback: 1200, ttlMinutes: 60, timeoutMs: 4000 },
  gaId: import.meta.env.PUBLIC_GA_ID ?? "",
};
```

### 5.5 Textos de página

Hero, "¿Por qué un robot?", "Nosotros", pasos de tecnología, comparativa: viven en sus componentes `.astro`. Se editan poco y en JSON serían menos legibles.

## 6. Diseño visual y layouts

### 6.1 Tokens (dirección "Tech oscuro")

Se conservan los HSL actuales: `background 0 0% 5%`, `card 0 0% 8%`, `secondary 0 0% 12%`, `muted 0 0% 15%`, `muted-foreground 0 0% 60%`, `border 0 0% 18%`, `primary 84 81% 44%` (verde lima), `radius 0.75rem`. Se agrega `whatsapp: #25D366` (y hover `#1EBE5A`) como color reservado **exclusivamente** para botones de WhatsApp — ningún otro elemento lo usa, así el ojo lo asocia. Gradiente `text-gradient` y `glow-border` se mantienen. Tipografía Inter variable.

Animaciones (`fade-up`, `float`, `pulse-glow`) se desactivan completas bajo `prefers-reduced-motion: reduce`.

### 6.2 Home (`/`) — layout B

1. **Navbar** (fija, blur): logo → `/`; links: Productos (`/#productos`), Tecnología (`/tecnologia`), Guías (`/blog`), Instagram; botón WhatsApp. Menú móvil con `aria-expanded`.
2. **Hero**: badge "Distribuidor autorizado de TerraMow"; H1 "El futuro del corte inteligente" (o variante aprobada); 1 párrafo; botones: WhatsApp (primario, verde) + "Ver modelos" (secundario). Fondo: video en desktop (`<video muted loop playsinline preload="none">` con `poster`, activado por `hero.ts`), imagen WebP en móvil (`fetchpriority="high"`, es el LCP).
3. **TrustStrip**: Distribuidor autorizado · Garantía · Envíos a todo el país · Soporte local.
4. **WhyRobot**: 3 stats grandes (+156 hs libres/año, < 54 dB, 0 cables) con una línea cada uno.
5. **ProductGrid** (`id="productos"`): 2 `ProductCard` desde la colección. Toda la tarjeta es un `<a>` a la ficha; sin stock → etiqueta "Sin stock · Consultá disponibilidad" pero el link sigue yendo a la ficha.
6. **WhichOne**: mini tabla V600 vs V1000 (m², precio, stock) → link a comparativa.
7. **HowItWorks**: 4 pasos con imagen → link a `/tecnologia`.
8. **ArticlesBlock**: 3 últimas guías. **Solo se renderiza si hay ≥ 3 artículos publicados.**
9. **FAQ** (scope `home`): `<details>/<summary>` nativo, estilizado.
10. **CTAFinal**: "¿Hablamos de tu jardín?" + WhatsApp.
11. **Footer**: logo, descripción, links, contacto (email, Instagram, ubicación), "Distribuidor autorizado de TerraMow", © año.
12. **WhatsAppFloat**: botón flotante en todas las páginas (esquina inferior derecha; en fichas móviles convive con la barra fija → se oculta cuando la barra está visible).

### 6.3 Ficha de producto (`/productos/[slug]`) — layout C

Desktop: dos columnas (imagen | info) arriba, resto a una columna. Móvil: una columna.

1. **Breadcrumbs**: Inicio › Productos › V1000.
2. **Imagen principal** (`astro:assets`, `loading="eager"`).
3. **PriceBlock**: eyebrow "V Series", H1 "TerraMow V1000", tagline, precio (`USD 2.100` en el HTML + toggle USD/ARS solo si `priceUSD`), 4 highlights, botón "Comprar por WhatsApp" (mensaje `product`). Sin stock: etiqueta "Sin stock" + botón "Consultar disponibilidad por WhatsApp".
4. **TrustStrip**.
5. **FitCheck** "¿Es para tu jardín?": superficie (`coverageM2`), pendiente máx., obstáculos/árboles, zonas múltiples, ruido. Si el jardín es más grande → link al otro modelo.
6. **SpecsTable** agrupada por categoría (desde `specs`).
7. **FAQ** (scope del producto) — incluye las 3 preguntas más frecuentes (§8.2).
8. **"¿Dudás entre los dos?"** → link a comparativa.
9. **CTAFinal**.
10. **StickyBar** (solo móvil): precio + botón WhatsApp; aparece al pasar el `PriceBlock`, se oculta al scrollear hacia arriba.

### 6.4 Comparativa (`/productos/v600-vs-v1000`)

H1 "TerraMow V600 vs V1000: ¿cuál elegir?"; tabla lado a lado generada desde ambos JSON (m², precio, stock, pendiente, batería, ruido, peso, dimensiones…); bloque "Elegí el V600 si… / Elegí el V1000 si…"; dos botones WhatsApp (uno por modelo, mensaje `product`) + uno "No sé cuál" (mensaje `compare`); FAQ scope `home` filtrado a las de elección; JSON-LD `ItemList`.

### 6.5 Tecnología (`/tecnologia`)

Contenido actual migrado (4 pasos, ventajas con stats, tabla de ahorro de tiempo, manual vs robot, ciclo de trabajo, CTA), con Navbar y Footer compartidos (hoy los reimplementa). Tablas reales (`<table>`) en vez de grids de `div`. Link a los artículos relacionados (especialmente el de cámara IA vs RTK/LiDAR).

### 6.6 Blog (`/blog`, `/blog/[slug]`)

Índice: H1 "Guías sobre robots cortacésped", lista de `ArticleCard` (portada, título, descripción, fecha, tags). Artículo: `ArticleLayout` con breadcrumbs, H1, fecha, portada, cuerpo (tipografía de lectura, ancho ≤ 70ch), bloque "Modelos relacionados" (desde `relatedProducts`), CTA WhatsApp (mensaje `article`), "Otras guías" (2-3). Sin comentarios ni autor visible más allá de la marca.

### 6.7 404

En español: "Esta página no existe", links a Productos, Tecnología, Guías, botón WhatsApp. `noindex`.

## 7. Capa SEO

### 7.1 `<head>` por página (componente `SEO.astro`)

- `<title>` **escrito completo por página** (sin sufijo automático); el chequeo de build exige ≤ 60 caracteres.
- `meta description` 50-160 caracteres.
- `link canonical` absoluta (`site.url + pathname`, sin barra final salvo `/`).
- `<html lang="es-AR">`.
- Open Graph: `og:type` (`website` / `product` / `article`), `og:title`, `og:description`, `og:url`, `og:image` (absoluta, 1200×630), `og:image:width/height`, `og:locale es_AR`, `og:site_name`. Twitter: `summary_large_image` + título/descr/imagen.
- `meta robots`: `index, follow, max-image-preview:large, max-snippet:-1`; `/404` → `noindex`.
- Favicons: `favicon.svg` + `favicon.ico` + `apple-touch-icon.png`.
- `link rel="alternate" type="application/rss+xml"` en todas las páginas.
- `meta google-site-verification` (valor actual conservado).

### 7.2 Títulos y descripciones propuestos

| Página | `<title>` | Descripción |
|---|---|---|
| `/` | Robot Cortacésped con IA en Argentina \| TerraMow | Robots cortacésped con navegación por cámara e IA, sin cables perimetrales. Modelos TerraMow V600 y V1000, garantía y soporte local. Consultá por WhatsApp. |
| `/productos/v1000` | TerraMow V1000: robot cortacésped hasta 1000 m² \| Precio | Ficha completa del TerraMow V1000: cobertura, triple cámara con IA, sin cables ni RTK, especificaciones y precio. Garantía y envío a todo el país. |
| `/productos/v600` | TerraMow V600: robot cortacésped hasta 600 m² \| Ficha | Ficha del TerraMow V600 para jardines medianos: navegación con IA sin cables, mapeo automático y especificaciones. Consultá disponibilidad por WhatsApp. |
| `/productos/v600-vs-v1000` | TerraMow V600 vs V1000: ¿cuál robot cortacésped elegir? | Comparativa completa entre el TerraMow V600 y el V1000: superficie, batería, ruido, precio y para qué jardín conviene cada uno. |
| `/tecnologia` | Cómo funciona un robot cortacésped con IA \| Guía | Guía paso a paso: mapeo, planificación, corte autónomo y control por app. Ahorro de tiempo real y comparativa contra el corte manual. |
| `/blog` | Guías sobre robots cortacésped \| Blog | Guías prácticas sobre robots cortacésped: costos, mantenimiento, tecnologías de navegación y cómo elegir el modelo para tu jardín. |
| `/404` | Página no encontrada | — (noindex) |

Los artículos definen su propio título y descripción en el frontmatter (§8.1).

### 7.3 Datos estructurados (JSON-LD desde `lib/schema.ts`)

| Página | Esquemas |
|---|---|
| Todas | `Organization` (name, url, `logo: /logo.png` existente en `public/`, `contactPoint` con teléfono nuevo, `sameAs` Instagram, address), `WebSite`, `BreadcrumbList` |
| Ficha | `Product` (name, description, brand TerraMow, model, image, sku=slug, `additionalProperty` cobertura) + `Offer` (`price` USD, `priceCurrency: USD`, `availability` InStock/OutOfStock según JSON, `url`, `seller`, `shippingDetails` AR). Sin `priceUSD` → sin `Offer` |
| Home, fichas, comparativa | `FAQPage` con exactamente las preguntas visibles |
| Comparativa | `ItemList` con los dos `Product` |
| Tecnología | `HowTo` con los 4 pasos |
| Artículo | `BlogPosting` (headline, description, image, datePublished, dateModified, author/publisher = Organization, mainEntityOfPage) |

**Regla:** ningún JSON-LD se escribe a mano; todos se generan desde las colecciones y `site.ts`, y se testean (§10.1).

### 7.4 Archivos técnicos

- `sitemap-index.xml` con `@astrojs/sitemap`: todas las páginas indexables, `lastmod` (artículos: `updatedDate ?? pubDate`), excluye `/404` y borradores.
- `robots.txt`: `Allow: /`, `Disallow: /404`, `Sitemap: <url>/sitemap-index.xml`.
- `rss.xml` con los artículos publicados.

### 7.5 Rendimiento (Core Web Vitals)

- Inter auto-alojada con `font-display: swap`, subset latin, preload del archivo variable.
- Imágenes: `astro:assets` → WebP (AVIF donde convenga), `srcset` por dispositivo, `width/height` siempre, `loading="lazy"` salvo LCP, `decoding="async"`.
- Hero móvil: imagen WebP ≤ 80 KB con `fetchpriority="high"`; hero desktop: video ≤ 600 KB (H.264 + WebM), 10 s loop, sin audio, `poster`. El `<video>` va con `preload="none"` y sin `src`; `hero.ts` asigna el `src` y reproduce solo si el viewport es ≥ 1024 px y no hay `prefers-reduced-motion`. En móvil no se descarga ni un byte del video.
- Fotos de producto: de PNG 1 MB / 670 KB a WebP ≈ 100-150 KB.
- CSS: Tailwind purgado, ≤ 20 KB gzip. JS total ≤ 10 KB.
- Presupuesto verificado en build: home ≤ 500 KB (sin video).

### 7.6 Enlazado interno

| Desde | Hacia |
|---|---|
| Home | Ambas fichas, comparativa, tecnología, blog, 3 artículos (si hay) |
| Ficha | Otra ficha (en FitCheck), comparativa, tecnología, artículos con `relatedProducts` que la incluyan |
| Comparativa | Ambas fichas, artículo "conviene" |
| Tecnología | Ambas fichas, artículo "cámara IA vs RTK/LiDAR" |
| Artículo | Modelos relacionados, 2-3 artículos, tecnología cuando aplique |
| Footer (todas) | Productos, tecnología, blog, comparativa |

Cada página indexable recibe enlaces desde al menos otras dos.

### 7.7 Accesibilidad (afecta SEO y conversión)

Un `<h1>` por página y jerarquía correcta; `alt` descriptivos; contraste AA (muted-foreground 60 % sobre negro 5 % ≈ 5,9:1); foco visible; menú con `aria-expanded`/`aria-controls`; botones de WhatsApp con `aria-label` que incluye el modelo; `prefers-reduced-motion` respetado; `<table>` reales con `<th scope>`.

## 8. Contenido inicial

### 8.1 Artículos (3)

Voz: robots cortacésped **en general**; TerraMow aparece como ejemplo cuando corresponde. Honestos (incluyen cuándo NO conviene). 1.200-1.800 palabras, H2/H3 claros, una tabla o lista por sección donde ayude, portada propia. Los tres pasan por revisión del usuario antes de `draft: false`.

| # | Slug | Título | Búsqueda objetivo | Secciones |
|---|---|---|---|---|
| 1 | `conviene-robot-cortacesped-argentina` | ¿Conviene un robot cortacésped en Argentina? Costo real vs jardinero | "robot cortacésped conviene", "robot cortacésped precio argentina" | Qué es y para quién · Cuánto cuesta cortar el pasto hoy (jardinero / cortadora propia, rangos marcados como estimación) · Cuánto cuesta un robot (compra + electricidad + mantenimiento) · **Cuánto tarda en cortar** (m²/hora, ejemplos 600 y 1000 m²) · Cuándo NO conviene · Conclusión · CTA |
| 2 | `camara-ia-vs-rtk-vs-lidar-robot-cortacesped` | Cámara con IA vs RTK vs LiDAR: cómo navegan los robots cortacésped | "robot cortacésped sin cable perimetral", "robot cortacésped RTK", "LiDAR" | El problema del cable perimetral · RTK: qué es, antena/base, pierde señal bajo árboles y cerca de paredes · LiDAR: qué es, precisión, costo, limitaciones · Cámara con IA: reconoce césped y obstáculos, sin instalación; límites (luz) · Tabla comparativa · Cuál conviene según el jardín · CTA |
| 3 | `mantenimiento-robot-cortacesped` | Mantenimiento de un robot cortacésped: qué hay que hacer y qué no | "robot cortacésped mantenimiento", "hay que recoger el césped" | **¿Hay que recoger el césped cortado?** (no: mulching, por qué es mejor) · Cuchillas (cambio, costo) · Limpieza · Ruedas, sensores, cámara · Lluvia · Invierno y guardado · Batería · Qué NO hacer · Costo anual · CTA |

### 8.2 FAQ

Se conservan las 6 actuales (con la de envíos corregida: no hay "tienda online" — se coordina por WhatsApp) y se agregan las 3 más preguntadas por WhatsApp, en versión corta con link al artículo que amplía:

- ¿Hay que recoger el césped cortado? → no, mulching (→ artículo 3)
- ¿Cuánto tarda en cortar el jardín? → depende de m²; ejemplo por modelo (→ artículo 1)
- ¿Qué mantenimiento necesita? → cuchillas, limpieza, invierno (→ artículo 3)

Scope: las 3 nuevas en `home`, `v600` y `v1000`.

### 8.3 Reglas de copy

- Prohibido: "Distribuidor Oficial" / "distribuidor oficial" / "oficial" referido a la relación con TerraMow. Chequeo automático en build (§10.2).
- Aprobado: "Distribuidor autorizado de TerraMow".
- Todo en español rioplatense con voseo. Sin textos en inglés ("Out of Stock" → "Sin stock").
- Datos técnicos solo desde `products/*.json`.

## 9. Interactividad, medición y errores

### 9.1 Scripts del navegador (JS plano, ≈ 90 líneas en total)

| Script | Qué hace | Sin JS |
|---|---|---|
| `menu.ts` | Abre/cierra menú móvil, `aria-expanded`, cierra con Escape y al navegar | Menú visible, links funcionan |
| `currency.ts` | Toggle USD/ARS. Lee `data-price-usd`. Pide cotización (bluelytics `oficial.value_sell` → exchangerate-api `rates.ARS` → `site.exchangeRate.fallback`), timeout 4 s por API, cachea en `localStorage` 60 min, formatea `es-AR`, muestra "cotización de referencia" si usó fallback | Precio en USD visible (está en el HTML); toggle oculto |
| `sticky-bar.ts` | `IntersectionObserver` sobre `PriceBlock` + dirección de scroll; muestra/oculta barra; oculta `WhatsAppFloat` mientras la barra está visible | Sin barra; botón flotante normal |
| `analytics.ts` | Un listener delegado en `document` para `a[data-wa]`; envía `gtag('event','contact_whatsapp',{location, product})`. Solo se carga si `site.gaId` | Nada |
| `hero.ts` | Si viewport ≥ 1024 px y sin `prefers-reduced-motion`, asigna `src` al `<video>` del hero y reproduce | Se ve el `poster` |

### 9.2 WhatsApp

`lib/whatsapp.ts` exporta `whatsappUrl({ context, product?, title? })` → `https://wa.me/<number>?text=<mensaje codificado>`. Todos los botones se renderizan con `WhatsAppButton.astro`, que agrega `data-wa="<page>-<slot>"` (ej. `home-hero`, `ficha-v1000-sticky`, `blog-mantenimiento-cta`) y `aria-label`. Ningún componente arma la URL a mano.

### 9.3 GA4

`<script is:inline>` con gtag.js en `BaseLayout` **solo si `PUBLIC_GA_ID`** tiene valor. Eventos: `page_view` automático, `contact_whatsapp` con `{ location, product }`. README documenta: crear propiedad, obtener `G-XXXX`, cargar en Vercel → Environment Variables → redeploy.

### 9.4 Errores

| Falla | Comportamiento |
|---|---|
| Ambas APIs de cotización | ARS con fallback + nota "de referencia"; nunca "Cargando…" permanente |
| JS bloqueado | Sitio 100 % funcional: menú abierto, USD, WhatsApp directo, FAQ nativo |
| Video no carga | Se ve el `poster` |
| GA bloqueado | Silencioso |
| Producto sin `priceUSD` | "Consultar precio", sin toggle, sin `Offer` |
| Campo faltante en JSON/MD | Build falla con archivo y campo |
| Ruta inexistente | `/404` en español |

## 10. Testing y verificación

### 10.1 Unitarios (Vitest)

- `whatsapp.ts`: número, codificación, un caso por contexto.
- `price.ts`: `formatUSD(2100) → "USD 2.100"`, `formatARS(2520000) → "$ 2.520.000"`, `null → "Consultar"`.
- `exchange-rate.ts`: parseo de bluelytics, de exchangerate-api, respuesta rota → `null`, timeout → `null`.
- `schema.ts`: cada builder produce `@type` correcto y los campos obligatorios (`Offer.price`, `availability`, `FAQPage.mainEntity[]`, `BlogPosting.datePublished`…); snapshot de un ejemplo por tipo.

### 10.2 Chequeos de build (`npm run check`, ejecutado por `npm run build` en Vercel)

1. `astro check` (tipos + esquemas de contenido).
2. **Palabra prohibida**: `oficial` (case-insensitive) en cualquier `.html`/`.xml` de `dist/` → falla, listando archivo y contexto.
3. **Links internos**: todo `href`/`src` interno de `dist/**/*.html` debe existir en `dist/` → falla listando los rotos.
4. **SEO por página**: un `<h1>`; `<title>` 10-60; `description` 50-160; `canonical` absoluta y coincide con la ruta; `og:image` presente y el archivo existe; `lang="es-AR"`; JSON-LD parsea como JSON válido.
5. **Presupuesto**: suma de HTML+CSS+JS+imágenes referenciadas por `index.html` (excluyendo `video`) ≤ 500 KB.

### 10.3 Manual, antes del lanzamiento (en la URL de preview de Vercel)

- Lighthouse móvil: Performance ≥ 95, SEO 100, Accesibilidad ≥ 95, Best Practices ≥ 95 — capturas en el PR.
- Google Rich Results Test: ficha V1000, home, un artículo → sin errores.
- Compartir cada URL por WhatsApp real → preview con imagen y título correctos.
- Celular real: menú, toggle, barra fija, cada botón de WhatsApp abre el chat con el número nuevo y el mensaje correcto.
- Sin `console.error` en ninguna página.

### 10.4 Post-lanzamiento (checklist en el README)

Reenviar sitemap en Search Console · verificar indexación de las 8 URLs a los 7 días · primer reporte GA4 a los 7 días · revisar Core Web Vitals en Search Console a los 28 días.

## 11. Plan de migración

Cada paso deja el preview de Vercel funcionando.

1. **Base** — rama `astro`; proyecto Astro; Tailwind + tokens; `BaseLayout` con `SEO`, `Navbar`, `Footer`, `WhatsAppFloat`; `site.ts`; `.gitignore`; limpieza de deps y archivos viejos; README inicial.
2. **Contenido** — `content/config.ts`; `products/*.json` cargados desde el sitio actual con correcciones; `faq/*.json` (9); esqueleto de `blog/` con 1 borrador.
3. **Home** — layout B completo con hero video/imagen y bloque de guías condicional.
4. **Fichas + comparativa** — layout C, `currency.ts`, `sticky-bar.ts`.
5. **Tecnología** — migración con componentes compartidos y tablas reales.
6. **Blog** — índice, `ArticleLayout`, RSS, los 3 artículos (revisión del usuario → `draft: false`).
7. **Assets** — imágenes a WebP/AVIF, video comprimido (ffmpeg; si no está instalado, `winget install ffmpeg`), OG images generadas, favicons, `public/logo.png`.
8. **Verificación** — `npm run check` verde, Lighthouse, Rich Results, celular, capturas.
9. **Lanzamiento** — merge `astro` → `master`; Vercel publica; reenviar sitemap; borrar rama.

Rollback: `git revert` del merge + push.

## 12. Mapa: problemas del análisis previo → resolución

| Problema detectado | Resolución en este diseño |
|---|---|
| 404 en `/tecnologia` y `/productos/v1000` en producción | Salida estática: cada ruta es un archivo real (§4.1) |
| `og-image.jpg` inexistente; sin preview en WhatsApp | `public/og/*.jpg` reales por página + chequeo de existencia en build (§7.1, §10.2) |
| Tarjeta V600 sin `href` | Tarjetas desde la colección, siempre con link a la ficha; chequeo de links rotos (§6.2, §10.2) |
| Navbar rota fuera de la home (`#productos`, logo `href="#"`) | Links absolutos (`/#productos`, `/`), Navbar compartida (§6.2) |
| Video 3,6 MB `preload="auto"` | ≤ 600 KB, solo desktop, `poster`, `preload="none"`, reduced-motion (§7.5) |
| 1000 vs 1200 m² | Un solo campo `coverageM2` leído por todas las páginas (§5.1); valor pendiente de confirmación |
| JSON-LD: V600 `InStock` con "Out of Stock"; `Offer` sin `price`; `logo.png` 404 | `availability` desde `inStock`; `price` USD; `public/logo.png` existe; builders testeados (§7.3, §10.1) |
| `/productos/v1000` sin SEOHead ni en sitemap; `lastmod` viejo | `SEO.astro` en `BaseLayout` para todas; sitemap automático con `lastmod` real (§7.1, §7.4) |
| Textos en inglés; "Ver Mas" | Reglas de copy + 404 en español (§8.3, §6.7) |
| Google Fonts `@import` | Inter auto-alojada (§7.5) |
| `dist/`, `*.tsbuildinfo` commiteados | Eliminados del repo; `.gitignore` corregido (§4.4) |
| Dos lockfiles | Solo `package-lock.json` (§4.4) |
| Código muerto (44/49 `ui/`, hooks, `App.css`, 3 imágenes…) | `src/` se reemplaza entero; `strict: true` (§4.1, §4.4) |
| ≈ 55 dependencias sin uso | ≈ 12-15 dependencias (§4.1) |
| Número de WhatsApp en 4 archivos con mensajes distintos | `site.ts` + `whatsappUrl()` + `WhatsAppButton.astro` (§5.4, §9.2) |
| Duplicación en `ProductsSection`, navbar/footer reimplementados en Tecnología | Componentes compartidos; una `ProductCard` (§4.3, §6.5) |
| `currencySymbol` muerto; `toLocaleString()` sin locale; fetch sin cancelar | `price.ts` con `es-AR`; `AbortController` + timeout; cache (§9.1, §10.1) |
| `strict: false`, `no-unused-vars: off` | `strict: true`, ESLint mínimo con la regla activa (§4.1) |
| Un test trivial | Suite unitaria + 5 chequeos de build (§10) |
| Sin `aria-label`/`aria-expanded`; sin `prefers-reduced-motion` | §7.7 |
| PNG de 1 MB / 670 KB | WebP/AVIF vía `astro:assets` (§7.5) |
| Número de WhatsApp actual `5492494028837` ≠ número del usuario | `site.ts` usa `5492494318185` (§5.4). El sitio actual no se toca (decisión "sin parche") |

## 13. Pendientes (no bloquean el inicio)

| Pendiente | Quién | Plan si no llega |
|---|---|---|
| V1000: 1000 o 1200 m² | Usuario | Verificar en terramow.com; usar el dato oficial |
| Precio del V600 | Usuario | `priceUSD: null` → "Consultar" |
| Revisión de los 3 artículos | Usuario | Quedan `draft: true` hasta aprobación; el bloque "Guías" no aparece en la home |
| `PUBLIC_GA_ID` | Usuario | GA desactivado hasta que se cargue |
| Video original en mejor calidad | Usuario | Se comprime el actual del repo |
| Aprobación de las OG images | Usuario | Se muestran en el preview antes del lanzamiento |
| ¿Cambiar el número viejo en el sitio actual mientras tanto? | Usuario | No se toca (decisión "sin parche") |

## 14. Criterios de aceptación

- [ ] `npm run build` verde en Vercel, incluyendo los 5 chequeos.
- [ ] Las 8 URLs de §4.2 responden 200 en producción; `/404` responde 404 con la página en español.
- [ ] Ningún archivo de `dist/` contiene "oficial".
- [ ] Preview de WhatsApp con imagen y título correctos en home, ambas fichas, comparativa, tecnología y un artículo.
- [ ] Rich Results Test sin errores en ficha (Product+Offer+FAQ), home (FAQ) y artículo (BlogPosting).
- [ ] Lighthouse móvil: Performance ≥ 95, SEO 100, Accesibilidad ≥ 95.
- [ ] Home ≤ 500 KB (sin video); fotos de producto ≤ 150 KB cada una.
- [ ] Todos los botones de WhatsApp abren `wa.me/5492494318185` con el mensaje de su contexto y llevan `data-wa`.
- [ ] Con `PUBLIC_GA_ID` cargado, un click a WhatsApp aparece en GA4 (DebugView) como `contact_whatsapp` con `location` y `product`.
- [ ] 3 artículos publicados; bloque "Guías" visible en la home; RSS válido.
- [ ] `dist/`, `*.tsbuildinfo`, `bun.lock` fuera del repo; `.superpowers/` ignorado.
- [ ] README con: correr, agregar artículo, editar producto, cambiar WhatsApp, activar GA4, publicar.
