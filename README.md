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
| `npm run media:promo -- <nombre>` | Renderiza una animación suelta (`scripts/media/promo/<nombre>.html`: `terramow` o `tiempo`) → `public/redes/extra/<nombre>.mp4`. Necesita Playwright + Chromium |
| `npm run media:reels -- [nombre…]` | Renderiza los reels e historias de la serie para redes (guiones en `scripts/media/reels/`) → `public/redes/`. Ver `docs/redes.md` |

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

Un archivo por modelo en `src/content/products/` (`v600.json`, `v1000.json`, `neomow-x2.json`). Campos clave: `brand`, `priceUSD` (número o `null` = "Consultar precio"), `inStock` (`true`/`false`), `coverageM2`, `specs`, `draft` (`true` = no se publica). Todas las páginas leen de acá.

- **Versiones de un mismo modelo** (ej. Neomow X2 de 3000, 4000 y 6000 m²): `variants`, con `coverageM2` y `priceUSD` de cada una. En ese caso `priceUSD` es el de la más barata ("desde") y `coverageM2` el de la más grande. La ficha muestra un selector de versión.
- **Dato sin confirmar** (autonomía, ruido, etc.): `null` en `fit` y fuera de `specs`; no se muestra. `specsNote` agrega una aclaración debajo de la ficha técnica.
- **Producto nuevo**: copiar un JSON, cambiar `slug` (= nombre del archivo y URL `/productos/<slug>`), poner la foto en `src/assets/products/` y la imagen de preview en `public/og/`. Con `draft: true` no se publica hasta que esté listo.
- **Marca nueva**: sumarla a `brandSchema` en `src/content/schemas.ts`. Los textos de la home, el título, las preguntas frecuentes, `llms.txt` y los datos estructurados se arman solos con las marcas publicadas.

**Pendiente:** el Hookii Neomow X2 y las guías que lo enlazan (`como-elegir-robot-cortacesped`, `robot-cortacesped-pendientes`, `robot-cortacesped-lidar`) están en `draft` hasta tener las fotos oficiales (`src/assets/products/neomow-x2.jpg` y `public/og/neomow-x2.jpg`). Para publicarlos: sumar las fotos y pasar los cuatro `draft` a `false`.

La cobertura del V1000 (1200 m²) sale de la ficha de TerraMow; si cambia, actualizá `coverageM2` y regenerá las imágenes OG con `npm run media:og`.

### Editar las preguntas frecuentes

`src/content/faq/*.json`. `scope` define dónde aparece cada una: `home`, `comparativa` o el slug de un producto (`v600`, `v1000`, `neomow-x2`…). Las de un producto en borrador no se muestran. `link` es opcional.

### Activar Google Analytics 4

1. En https://analytics.google.com crear una propiedad → flujo de datos web → copiar el **ID de medición** (`G-XXXXXXXXXX`).
2. En Vercel: Project → Settings → Environment Variables → `PUBLIC_GA_ID` = el ID → Save.
3. Deployments → Redeploy del último deploy.
4. Verificar: en GA4 → Administrar → DebugView, hacer click en un botón de WhatsApp del sitio y ver el evento `contact_whatsapp` con `location` y `product`.

Sin la variable, el sitio no carga nada de Google.

### Reemplazar el video del hero

Copiar el original a `media/hero-original.mp4` y correr `npm run media:video`. Genera `public/videos/hero.mp4` y `hero.webm` de ≤ 600 KB (10 s, sin audio). Se reproduce solo en desktop.

El original actual (`media/hero-original.mp4`) es vertical (810×1080); un video apaisado 16:9 de al menos 1280 px de ancho se vería mejor en desktop, donde el hero lo recorta.

## Reglas que el build hace cumplir

- La palabra prohibida (ver `scripts/check/config.mjs`) no puede aparecer en ninguna página ni en `llms.txt` (usar "garantía del fabricante"; tampoco usamos "distribuidor autorizado" ni frases similares).
- Todo link interno debe existir.
- Cada página: un solo `<h1>`, `<title>` ≤ 60 caracteres, descripción de 50-160, canónica correcta, imagen de preview existente.
- La home no puede superar 500 KB (sin contar el video).

## Antes de publicar (checklist en la URL de preview de Vercel)

- [Rich Results Test](https://search.google.com/test/rich-results) sobre `/productos/v1000`, `/` y un artículo: sin errores en Product, FAQ y Article.
- Compartir cada URL por WhatsApp y revisar la imagen y el título de la vista previa.
- Abrir el sitio en un celular real: menú, toggle USD/ARS, barra fija, y que cada botón de WhatsApp abra el chat con `+54 9 2494 31-8185` y el mensaje de su contexto.
- Recorrer las páginas en DevTools: 0 `console.error`.

## Después de publicar

- [Search Console](https://search.google.com/search-console): Sitemaps → enviar `https://www.robotscortacesped.com.ar/sitemap-index.xml`.
- A los 7 días: verificar en Search Console → Páginas que las URLs estén indexadas; mirar GA4.
- A los 28 días: Search Console → Core Web Vitals.

## Estructura

```
src/
  config/site.ts        datos del sitio (WhatsApp, email, URL, marca)
  content/               productos, FAQ y blog (validados en build)
  components/            piezas de página
  layouts/               BaseLayout (todas las páginas), ArticleLayout (blog)
  lib/                   funciones puras con tests (precios, cotización, JSON-LD, URLs)
  pages/                 rutas
  scripts/               los 5 scripts del navegador (menu, currency, sticky-bar, analytics, hero)
scripts/check/          chequeos que corren después del build
scripts/media/          generación de video, OG e íconos
docs/superpowers/       spec y planes de la migración
```
