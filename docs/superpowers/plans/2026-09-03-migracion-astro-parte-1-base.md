# Migración a Astro + SEO — Plan de implementación · Parte 1: base y librerías

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el sitio React/Vite por un proyecto Astro estático con Tailwind 4, colecciones de contenido validadas, funciones puras testeadas (WhatsApp, precios, cotización, JSON-LD), el layout base con SEO completo, y chequeos de build que impiden publicar un sitio roto.

**Architecture:** Astro 7 en modo `static`, sin frameworks de UI en el navegador. Los datos (productos, FAQ, blog) viven en `src/content/` y se validan con esquemas Zod al hacer build. Toda la lógica con reglas (URLs de WhatsApp, formato de precios, cotización con fallback, JSON-LD) está en `src/lib/` como funciones puras con tests en Vitest. `scripts/check/` inspecciona `dist/` después del build y falla si hay links rotos, la palabra prohibida, reglas SEO incumplidas o exceso de peso.

**Tech Stack:** Astro 7.3 · Tailwind 4.3 (`@tailwindcss/vite`) · `@fontsource-variable/inter` · `@astrojs/sitemap` · `@astrojs/rss` · `sharp` · TypeScript 5.9 · Vitest 5 · `node-html-parser` · `@resvg/resvg-js` · `ffmpeg-static` · Node 24 · Vercel (preset Astro, sin adaptador).

**Spec:** `docs/superpowers/specs/2026-09-03-migracion-astro-seo-design.md` — este plan implementa las secciones §4, §5, §7.1, §7.3, §7.4, §9 y §10 de la spec. Las partes 2 y 3 (`2026-09-03-migracion-astro-parte-2-paginas.md`, `2026-09-03-migracion-astro-parte-3-blog-medios-lanzamiento.md`) dependen de esta.

## Global Constraints

- **Rama:** todo el trabajo se commitea en la rama `astro`. Nunca en `master` (Vercel despliega `master` a producción).
- **Versiones:** `astro@^7.3.1`, `typescript@~5.9.3` (**no** TypeScript 7: `@astrojs/check` solo acepta `^5 || ^6`), `vitest@^5.0.0`, `tailwindcss@^4.3.3` + `@tailwindcss/vite@^4.3.3`, Node ≥ 22.12 (instalado: 24.19).
- **Dependencias:** máximo 15 entre `dependencies` y `devDependencies`. Sin React, sin shadcn, sin ESLint (`astro check` con `noUnusedLocals` cubre lo mismo).
- **Palabra prohibida:** la cadena `oficial` (sin distinción de mayúsculas) **no puede aparecer en ningún HTML ni XML generado**. Esto incluye "Distribuidor Oficial", "garantía oficial", "sitio oficial". Reemplazos: "Distribuidor autorizado de TerraMow", "garantía del fabricante", "Sitio de TerraMow". La clave `oficial` de la API de bluelytics solo vive en JavaScript y no cuenta.
- **WhatsApp:** número `5492494318185` únicamente desde `src/config/site.ts`. Ningún componente arma una URL `wa.me` a mano.
- **Datos técnicos:** solo desde `src/content/products/*.json`. V1000 = **1200 m²** (confirmado en terramow.com), V600 = 600 m².
- **Copy:** español rioplatense con voseo ("Elegí", "Consultá", "Descubrí"). Nada en inglés en la interfaz.
- **HTML:** el compilador Rust de Astro 7 exige que todos los elementos no vacíos tengan etiqueta de cierre. Nada de `<div>` sin `</div>`.
- **Tailwind 4:** `bg-linear-to-r` (no `bg-gradient-to-r`); la clase `container` no centra — usar la utilidad propia `wrap` definida en `global.css`.
- **Commits:** un commit por tarea como mínimo, mensaje en español, con el trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- **Alias:** `@/` → `src/` (tsconfig `paths` + vitest `resolve.alias`).

---

## Estructura de archivos de esta parte

| Archivo | Responsabilidad |
|---|---|
| `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/env.d.ts` | Configuración del proyecto |
| `src/styles/global.css` | Tailwind, tokens de color, fuente, utilidades propias, reduced-motion |
| `src/config/site.ts` | Datos del sitio: URL, marca, WhatsApp, email, Instagram, cotización de respaldo, GA |
| `src/lib/whatsapp.ts` | `whatsappMessage()`, `whatsappUrl()` |
| `src/lib/price.ts` | `formatUSD()`, `formatARS()`, `usdToArs()`, `formatNumber()` |
| `src/lib/exchange-rate.ts` | Parsers de las dos APIs, `fetchJsonWithTimeout()`, `getUsdArsRate()` |
| `src/lib/seo.ts` | `canonicalUrl()`, `absoluteUrl()` |
| `src/lib/schema.ts` | Builders JSON-LD `ld*()` |
| `src/lib/product-images.ts` | `productImage(file)` resuelve imágenes de `src/assets/products/` |
| `src/content/schemas.ts` | Esquemas Zod de `products`, `faq`, `blog` (testeables sin Astro) |
| `src/content.config.ts` | Define las colecciones con `glob()` y los esquemas |
| `src/content/products/*.json`, `src/content/faq/*.json` | Datos |
| `src/components/SEO.astro`, `JsonLd.astro` | `<head>` |
| `src/components/Navbar.astro`, `Footer.astro`, `WhatsAppButton.astro`, `WhatsAppFloat.astro`, `icons/*.astro` | Chrome compartido |
| `src/layouts/BaseLayout.astro` | Layout de todas las páginas |
| `src/scripts/menu.ts`, `analytics.ts` | Scripts del navegador |
| `src/pages/index.astro` (provisoria), `404.astro` | Páginas mínimas para que el build funcione |
| `public/robots.txt`, `public/favicon.ico` | Archivos estáticos |
| `scripts/check/*.mjs` | Chequeos sobre `dist/` |
| `tests/*.test.ts`, `tests/fixtures/` | Tests |

---

### Task 1: Limpiar el repo y crear el esqueleto Astro

**Files:**
- Delete: `src/` (todo salvo `src/assets/`), `dist/`, `index.html`, `bun.lock`, `package-lock.json`, `components.json`, `eslint.config.js`, `postcss.config.js`, `tailwind.config.ts`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.app.tsbuildinfo`, `tsconfig.node.tsbuildinfo`, `vite.config.ts`, `vitest.config.ts`, `public/placeholder.svg`, `public/sitemap.xml`
- Move: `public/videos/hero-bg.mp4` → `media/hero-original.mp4`; `src/assets/mower-v600.png` → `src/assets/products/v600.png`; `src/assets/mower-v1000.png` → `src/assets/products/v1000.png`; delete `src/assets/mower-v600-bk.jpg`, `src/assets/mower-v1000-bk.jpg`
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/env.d.ts`, `src/styles/global.css`, `src/pages/index.astro`, `public/robots.txt`, `tests/smoke.test.ts`
- Modify: `.gitignore`, `README.md`

**Interfaces:**
- Produces: proyecto que construye con `npm run build` y testea con `npm test`; tokens de color `bg-background`, `text-foreground`, `bg-card`, `bg-secondary`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary`, `text-primary-foreground`, `bg-whatsapp`, `hover:bg-whatsapp-hover`; utilidades `wrap`, `text-gradient`, `glow-border`; animaciones `animate-fade-up`, `animate-float`, `animate-pulse-glow`.

- [ ] **Step 1: Verificar rama y árbol limpio**

Run: `git branch --show-current && git status --short`
Expected: `astro` y ninguna línea de cambios (salvo `?? .claude/`, que se ignora en el paso 3).

- [ ] **Step 2: Mover assets que se conservan y borrar el resto**

```bash
mkdir -p media src/assets/products
git mv public/videos/hero-bg.mp4 media/hero-original.mp4
git mv src/assets/mower-v600.png src/assets/products/v600.png
git mv src/assets/mower-v1000.png src/assets/products/v1000.png
git rm -q src/assets/mower-v600-bk.jpg src/assets/mower-v1000-bk.jpg
git rm -rq src/components src/hooks src/lib src/pages src/test
git rm -q src/App.css src/App.tsx src/index.css src/main.tsx src/tailwind.config.lov.json src/vite-env.d.ts
git rm -rq dist
git rm -q index.html bun.lock package-lock.json components.json eslint.config.js postcss.config.js tailwind.config.ts tsconfig.app.json tsconfig.node.json tsconfig.app.tsbuildinfo tsconfig.node.tsbuildinfo vite.config.ts vitest.config.ts public/placeholder.svg public/sitemap.xml
rm -rf node_modules
```

Run: `ls src/assets src/assets/products public media`
Expected: `src/assets` contiene `hero-mower.jpg logo.png products step-cutting.jpg step-mapping.jpg step-monitoring.jpg step-planning.jpg`; `products` contiene `v600.png v1000.png`; `public` contiene `favicon.ico robots.txt videos` (la carpeta `videos` queda vacía); `media` contiene `hero-original.mp4`.

- [ ] **Step 3: `.gitignore`**

Reemplazar el contenido completo de `.gitignore` por:

```gitignore
# dependencias y build
node_modules/
dist/
.astro/
.vercel/

# logs
*.log
npm-debug.log*

# entorno
.env
.env.*
!.env.example

# editor / SO
.vscode/
.idea/
.DS_Store
Thumbs.db

# herramientas de sesión
.superpowers/
.claude/launch.json
```

- [ ] **Step 4: `package.json`**

```json
{
  "name": "robot-cortacesped-argentina",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest",
    "media:video": "node scripts/media/compress-video.mjs",
    "media:og": "node scripts/media/og-images.mjs",
    "media:icons": "node scripts/media/icons.mjs"
  },
  "dependencies": {
    "@astrojs/rss": "^4.0.19",
    "@astrojs/sitemap": "^3.7.4",
    "@fontsource-variable/inter": "^5.3.0",
    "@tailwindcss/vite": "^4.3.3",
    "astro": "^7.3.1",
    "sharp": "^0.35.4",
    "tailwindcss": "^4.3.3"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.10",
    "@resvg/resvg-js": "^2.6.2",
    "ffmpeg-static": "^5.3.0",
    "node-html-parser": "^9.0.3",
    "typescript": "~5.9.3",
    "vitest": "^5.0.0"
  }
}
```

(13 dependencias. `npm run build` incorpora los chequeos de `dist/` en la Task 7.)

- [ ] **Step 5: Instalar**

Run: `npm install --no-audit --no-fund 2>&1 | tail -3`
Expected: sin errores; se genera `package-lock.json`. Si `sharp` falla al compilar, correr `npm install --include=optional sharp`.

- [ ] **Step 6: `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://www.robotscortacesped.com.ar",
  output: "static",
  trailingSlash: "never",
  build: { format: "directory" },
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith("/404"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 7: `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowJs": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vitest/globals"]
  },
  "include": [".astro/types.d.ts", "src/**/*", "tests/**/*", "scripts/**/*.mjs"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 8: `src/env.d.ts`**

```ts
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GA_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// gtag.js se inserta solo cuando PUBLIC_GA_ID está definido (ver BaseLayout.astro)
declare function gtag(...args: unknown[]): void;
```

- [ ] **Step 9: `vitest.config.ts`**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

- [ ] **Step 10: `src/styles/global.css`**

```css
@import "tailwindcss";
@import "@fontsource-variable/inter";

@theme {
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;

  --color-background: hsl(0 0% 5%);
  --color-foreground: hsl(0 0% 95%);
  --color-card: hsl(0 0% 8%);
  --color-secondary: hsl(0 0% 12%);
  --color-muted: hsl(0 0% 15%);
  --color-muted-foreground: hsl(0 0% 60%);
  --color-border: hsl(0 0% 18%);
  --color-primary: hsl(84 81% 44%);
  --color-primary-foreground: hsl(0 0% 5%);
  --color-whatsapp: #25d366;
  --color-whatsapp-hover: #1ebe5a;

  --radius-lg: 0.75rem;

  --animate-fade-up: fade-up 0.8s ease-out both;
  --animate-float: float 6s ease-in-out infinite;
  --animate-pulse-glow: pulse-glow 3s ease-in-out infinite;

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px hsl(84 81% 44% / 0.1); }
    50% { box-shadow: 0 0 40px hsl(84 81% 44% / 0.25); }
  }
}

@layer base {
  html { scroll-behavior: smooth; }
  body { @apply bg-background text-foreground font-sans antialiased; }
  * { @apply border-border; }
  :focus-visible { @apply outline-2 outline-offset-2 outline-primary; }
}

@utility wrap {
  @apply mx-auto w-full max-w-7xl px-4 lg:px-8;
}

@utility text-gradient {
  @apply bg-clip-text text-transparent;
  background-image: linear-gradient(135deg, hsl(84 81% 44%), hsl(120 60% 50%));
}

@utility glow-border {
  box-shadow: 0 0 20px hsl(84 81% 44% / 0.1), inset 0 0 20px hsl(84 81% 44% / 0.05);
}

/* Cuerpo de artículos del blog (se usa en ArticleLayout, Parte 3) */
@utility prose-dark {
  @apply text-foreground/90 leading-relaxed;
  & h2 { @apply mt-12 mb-4 text-2xl font-bold text-foreground md:text-3xl; }
  & h3 { @apply mt-8 mb-3 text-xl font-semibold text-foreground; }
  & p { @apply mb-5; }
  & ul, & ol { @apply mb-5 ml-6 space-y-2; }
  & ul { @apply list-disc; }
  & ol { @apply list-decimal; }
  & a { @apply text-primary underline underline-offset-4 hover:opacity-80; }
  & strong { @apply font-semibold text-foreground; }
  & table { @apply my-6 w-full border-collapse text-sm; }
  & th { @apply border-b border-border bg-secondary px-3 py-2 text-left font-semibold; }
  & td { @apply border-b border-border px-3 py-2 align-top; }
  & blockquote { @apply my-6 border-l-4 border-primary pl-4 text-muted-foreground italic; }
  & img { @apply my-6 rounded-xl; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 11: `src/pages/index.astro` provisoria y `public/robots.txt`**

`src/pages/index.astro` (se reemplaza en la Task 6 y en la Parte 2):

```astro
---
import "@/styles/global.css";
---
<html lang="es-AR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Robot Cortacésped Argentina</title>
  </head>
  <body>
    <main class="wrap py-24">
      <h1 class="text-4xl font-bold">Sitio en construcción</h1>
      <p class="mt-4 text-muted-foreground">Base Astro funcionando.</p>
    </main>
  </body>
</html>
```

`public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /404

Sitemap: https://www.robotscortacesped.com.ar/sitemap-index.xml
```

- [ ] **Step 12: Test de humo `tests/smoke.test.ts`**

```ts
import { describe, expect, it } from "vitest";

describe("entorno de tests", () => {
  it("resuelve el alias @/ y corre TypeScript", async () => {
    const mod = await import("@/styles/global.css?raw");
    expect(mod.default).toContain("@theme");
  });
});
```

- [ ] **Step 13: Build y tests**

Run: `npm run build 2>&1 | tail -12`
Expected: `astro check` sin errores (0 errors) y `astro build` termina con `Complete!`; existe `dist/index.html` y `dist/sitemap-index.xml`.

Run: `npm test 2>&1 | tail -6`
Expected: `1 passed`.

Run: `grep -c "Inter Variable" dist/_astro/*.css`
Expected: número ≥ 1 (la fuente está auto-alojada).

- [ ] **Step 14: README provisorio y commit**

`README.md`:

```markdown
# Robot Cortacésped Argentina

Sitio estático en Astro para robotscortacesped.com.ar. En migración — ver `docs/superpowers/specs/2026-09-03-migracion-astro-seo-design.md`.

## Comandos

- `npm run dev` — servidor local en http://localhost:4321
- `npm run build` — build de producción en `dist/`
- `npm test` — tests unitarios
```

```bash
git add -A
git commit -m "chore: esqueleto Astro 7 + Tailwind 4, limpieza del proyecto React

Elimina src/, dist/, lockfile de bun, configs de Vite/shadcn y ~55
dependencias sin uso. Conserva imágenes en src/assets y el video
original en media/. Agrega tokens de color, fuente Inter auto-alojada
y test de humo.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: `site.ts`, `whatsapp.ts`, `price.ts`

**Files:**
- Create: `src/config/site.ts`, `src/lib/whatsapp.ts`, `src/lib/price.ts`
- Test: `tests/whatsapp.test.ts`, `tests/price.test.ts`

**Interfaces:**
- Produces:
  - `site` (objeto `as const`) con `url`, `name`, `tagline`, `brandClaim`, `locale`, `lang`, `whatsapp.number`, `whatsapp.display`, `email`, `instagram`, `terramow`, `location.locality`, `location.country`, `exchangeRate.fallback`, `exchangeRate.ttlMinutes`, `exchangeRate.timeoutMs`, `googleSiteVerification`; y `gaId: string`.
  - `type WaContext = "general" | "product" | "priceARS" | "article" | "compare"`; `whatsappMessage(context: WaContext, subject?: string): string`; `whatsappUrl(context: WaContext, subject?: string): string`.
  - `CONSULT_LABEL = "Consultar precio"`; `formatNumber(n: number): string`; `formatUSD(usd: number | null): string`; `formatARS(ars: number): string`; `usdToArs(usd: number, rate: number): number`.

- [ ] **Step 1: Tests de WhatsApp (fallan)**

`tests/whatsapp.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { whatsappMessage, whatsappUrl } from "@/lib/whatsapp";

describe("whatsappMessage", () => {
  it("general", () => {
    expect(whatsappMessage("general")).toBe("Hola, quiero consultar por los robots cortacésped TerraMow.");
  });
  it("product usa el nombre del modelo", () => {
    expect(whatsappMessage("product", "TerraMow V1000")).toBe("Hola, quiero consultar por el TerraMow V1000.");
  });
  it("priceARS", () => {
    expect(whatsappMessage("priceARS", "TerraMow V1000")).toBe("Hola, quiero saber el precio en pesos del TerraMow V1000.");
  });
  it("article cita el título", () => {
    expect(whatsappMessage("article", "Mantenimiento")).toBe('Hola, leí la guía "Mantenimiento" y tengo una consulta.');
  });
  it("compare", () => {
    expect(whatsappMessage("compare")).toBe("Hola, no sé si me conviene el V600 o el V1000. ¿Me ayudan a elegir?");
  });
});

describe("whatsappUrl", () => {
  it("usa el número del sitio y codifica el mensaje", () => {
    const url = whatsappUrl("product", "TerraMow V600");
    expect(url.startsWith("https://wa.me/5492494318185?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1]!)).toBe("Hola, quiero consultar por el TerraMow V600.");
    expect(url).not.toContain(" ");
  });
});
```

- [ ] **Step 2: Tests de precio (fallan)**

`tests/price.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CONSULT_LABEL, formatARS, formatNumber, formatUSD, usdToArs } from "@/lib/price";

describe("price", () => {
  it("formatNumber usa separador de miles es-AR", () => {
    expect(formatNumber(2100)).toBe("2.100");
    expect(formatNumber(2520000)).toBe("2.520.000");
    expect(formatNumber(600)).toBe("600");
  });
  it("formatUSD", () => {
    expect(formatUSD(2100)).toBe("USD 2.100");
    expect(formatUSD(null)).toBe(CONSULT_LABEL);
    expect(CONSULT_LABEL).toBe("Consultar precio");
  });
  it("formatARS", () => {
    expect(formatARS(2520000)).toBe("$ 2.520.000");
  });
  it("usdToArs redondea", () => {
    expect(usdToArs(2100, 1200)).toBe(2520000);
    expect(usdToArs(2100, 1234.567)).toBe(2592591);
  });
});
```

- [ ] **Step 3: Correr los tests para verificar que fallan**

Run: `npm test 2>&1 | tail -8`
Expected: FAIL — `Failed to resolve import "@/lib/whatsapp"` y `"@/lib/price"`.

- [ ] **Step 4: `src/config/site.ts`**

```ts
export const site = {
  url: "https://www.robotscortacesped.com.ar",
  name: "Robot Cortacésped Argentina",
  tagline: "Robots cortacésped con inteligencia artificial en Argentina",
  brandClaim: "Distribuidor autorizado de TerraMow",
  locale: "es_AR",
  lang: "es-AR",
  whatsapp: {
    number: "5492494318185",
    display: "+54 9 2494 31-8185",
  },
  email: "ventas@robotscortacesped.com.ar",
  instagram: "https://www.instagram.com/robotscortacesped_argentina/",
  terramow: "https://www.terramow.com/",
  location: { locality: "Buenos Aires", country: "AR" },
  exchangeRate: { fallback: 1200, ttlMinutes: 60, timeoutMs: 4000 },
  googleSiteVerification: "1yzojphGNe10deN-CMqx2NHtcYYhzQPkoySsWLobITI",
} as const;

/** ID de Google Analytics 4 (G-XXXXXXX). Vacío = GA desactivado. */
export const gaId: string = import.meta.env.PUBLIC_GA_ID ?? "";
```

- [ ] **Step 5: `src/lib/whatsapp.ts`**

```ts
import { site } from "@/config/site";

export type WaContext = "general" | "product" | "priceARS" | "article" | "compare";

export function whatsappMessage(context: WaContext, subject = ""): string {
  switch (context) {
    case "product":
      return `Hola, quiero consultar por el ${subject}.`;
    case "priceARS":
      return `Hola, quiero saber el precio en pesos del ${subject}.`;
    case "article":
      return `Hola, leí la guía "${subject}" y tengo una consulta.`;
    case "compare":
      return "Hola, no sé si me conviene el V600 o el V1000. ¿Me ayudan a elegir?";
    case "general":
    default:
      return "Hola, quiero consultar por los robots cortacésped TerraMow.";
  }
}

export function whatsappUrl(context: WaContext, subject?: string): string {
  const text = encodeURIComponent(whatsappMessage(context, subject));
  return `https://wa.me/${site.whatsapp.number}?text=${text}`;
}
```

- [ ] **Step 6: `src/lib/price.ts`**

```ts
const formatter = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

export const CONSULT_LABEL = "Consultar precio";

export function formatNumber(n: number): string {
  return formatter.format(n);
}

export function formatUSD(usd: number | null): string {
  return usd === null ? CONSULT_LABEL : `USD ${formatter.format(usd)}`;
}

export function formatARS(ars: number): string {
  return `$ ${formatter.format(ars)}`;
}

export function usdToArs(usd: number, rate: number): number {
  return Math.round(usd * rate);
}
```

- [ ] **Step 7: Tests en verde**

Run: `npm test 2>&1 | tail -6`
Expected: `3 passed` (smoke + whatsapp + price), 0 failed.

- [ ] **Step 8: Commit**

```bash
git add src/config/site.ts src/lib/whatsapp.ts src/lib/price.ts tests/whatsapp.test.ts tests/price.test.ts
git commit -m "feat: configuración del sitio, URLs de WhatsApp y formato de precios

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Cotización USD→ARS con fallback

**Files:**
- Create: `src/lib/exchange-rate.ts`
- Test: `tests/exchange-rate.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `type RateSource = "bluelytics" | "exchangerate-api" | "fallback"`; `parseBluelytics(json: unknown): number | null`; `parseExchangeRateApi(json: unknown): number | null`; `fetchJsonWithTimeout(url: string, timeoutMs: number, fetchFn?: typeof fetch): Promise<unknown | null>`; `getUsdArsRate(opts: { timeoutMs: number; fallback: number; fetchFn?: typeof fetch }): Promise<{ rate: number; source: RateSource }>`.

- [ ] **Step 1: Tests (fallan)**

`tests/exchange-rate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  fetchJsonWithTimeout,
  getUsdArsRate,
  parseBluelytics,
  parseExchangeRateApi,
} from "@/lib/exchange-rate";

const jsonResponse = (body: unknown, ok = true) =>
  ({ ok, json: async () => body }) as unknown as Response;

describe("parsers", () => {
  it("bluelytics lee oficial.value_sell", () => {
    expect(parseBluelytics({ oficial: { value_sell: 1250.5 } })).toBe(1250.5);
  });
  it("bluelytics devuelve null si falta o no es número positivo", () => {
    expect(parseBluelytics({})).toBeNull();
    expect(parseBluelytics({ oficial: { value_sell: "1250" } })).toBeNull();
    expect(parseBluelytics({ oficial: { value_sell: 0 } })).toBeNull();
    expect(parseBluelytics(null)).toBeNull();
  });
  it("exchangerate-api lee rates.ARS", () => {
    expect(parseExchangeRateApi({ rates: { ARS: 1300 } })).toBe(1300);
    expect(parseExchangeRateApi({ rates: {} })).toBeNull();
  });
});

describe("fetchJsonWithTimeout", () => {
  it("devuelve el JSON si la respuesta es ok", async () => {
    const fetchFn = (async () => jsonResponse({ a: 1 })) as unknown as typeof fetch;
    expect(await fetchJsonWithTimeout("http://x", 100, fetchFn)).toEqual({ a: 1 });
  });
  it("devuelve null si la respuesta no es ok o falla", async () => {
    const notOk = (async () => jsonResponse({}, false)) as unknown as typeof fetch;
    expect(await fetchJsonWithTimeout("http://x", 100, notOk)).toBeNull();
    const throws = (async () => { throw new Error("red"); }) as unknown as typeof fetch;
    expect(await fetchJsonWithTimeout("http://x", 100, throws)).toBeNull();
  });
  it("aborta por timeout", async () => {
    const slow = ((_: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      })) as unknown as typeof fetch;
    expect(await fetchJsonWithTimeout("http://x", 20, slow)).toBeNull();
  });
});

describe("getUsdArsRate", () => {
  it("usa bluelytics si responde", async () => {
    const fetchFn = (async (url: string) =>
      url.includes("bluelytics") ? jsonResponse({ oficial: { value_sell: 1250 } }) : jsonResponse({ rates: { ARS: 1300 } })) as unknown as typeof fetch;
    expect(await getUsdArsRate({ timeoutMs: 100, fallback: 1200, fetchFn })).toEqual({ rate: 1250, source: "bluelytics" });
  });
  it("cae a exchangerate-api si bluelytics falla", async () => {
    const fetchFn = (async (url: string) =>
      url.includes("bluelytics") ? jsonResponse({}, false) : jsonResponse({ rates: { ARS: 1300 } })) as unknown as typeof fetch;
    expect(await getUsdArsRate({ timeoutMs: 100, fallback: 1200, fetchFn })).toEqual({ rate: 1300, source: "exchangerate-api" });
  });
  it("cae al fallback si las dos fallan", async () => {
    const fetchFn = (async () => { throw new Error("sin red"); }) as unknown as typeof fetch;
    expect(await getUsdArsRate({ timeoutMs: 100, fallback: 1200, fetchFn })).toEqual({ rate: 1200, source: "fallback" });
  });
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `npm test -- tests/exchange-rate.test.ts 2>&1 | tail -5`
Expected: FAIL — `Failed to resolve import "@/lib/exchange-rate"`.

- [ ] **Step 3: `src/lib/exchange-rate.ts`**

```ts
export type RateSource = "bluelytics" | "exchangerate-api" | "fallback";

function positiveNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

/** https://api.bluelytics.com.ar/v2/latest → { oficial: { value_sell } } (cotización Banco Nación, venta) */
export function parseBluelytics(json: unknown): number | null {
  const root = json as { oficial?: { value_sell?: unknown } } | null;
  return positiveNumber(root?.oficial?.value_sell);
}

/** https://api.exchangerate-api.com/v4/latest/USD → { rates: { ARS } } */
export function parseExchangeRateApi(json: unknown): number | null {
  const root = json as { rates?: { ARS?: unknown } } | null;
  return positiveNumber(root?.rates?.ARS);
}

export async function fetchJsonWithTimeout(
  url: string,
  timeoutMs: number,
  fetchFn: typeof fetch = fetch,
): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const SOURCES: ReadonlyArray<{ name: Exclude<RateSource, "fallback">; url: string; parse: (json: unknown) => number | null }> = [
  { name: "bluelytics", url: "https://api.bluelytics.com.ar/v2/latest", parse: parseBluelytics },
  { name: "exchangerate-api", url: "https://api.exchangerate-api.com/v4/latest/USD", parse: parseExchangeRateApi },
];

export async function getUsdArsRate(opts: {
  timeoutMs: number;
  fallback: number;
  fetchFn?: typeof fetch;
}): Promise<{ rate: number; source: RateSource }> {
  for (const source of SOURCES) {
    const json = await fetchJsonWithTimeout(source.url, opts.timeoutMs, opts.fetchFn);
    const rate = json === null ? null : source.parse(json);
    if (rate !== null) return { rate, source: source.name };
  }
  return { rate: opts.fallback, source: "fallback" };
}
```

- [ ] **Step 4: Tests en verde**

Run: `npm test 2>&1 | tail -6`
Expected: `4 passed`, 0 failed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/exchange-rate.ts tests/exchange-rate.test.ts
git commit -m "feat: cotización USD/ARS con dos fuentes, timeout y fallback

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Esquemas de contenido, productos y FAQ

**Files:**
- Create: `src/content/schemas.ts`, `src/content.config.ts`, `src/content/products/v600.json`, `src/content/products/v1000.json`, `src/content/faq/*.json` (9 archivos), `src/content/blog/.gitkeep`, `src/lib/product-images.ts`
- Test: `tests/content.test.ts`

**Interfaces:**
- Produces:
  - Esquemas Zod `productSchema`, `faqSchema`, `blogSchema` y tipos `Product`, `Faq`, `BlogFrontmatter`, `ProductSlug = "v600" | "v1000"`, `FaqScope = "home" | "v600" | "v1000" | "comparativa"`.
  - Colecciones Astro `products` (id = nombre de archivo: `v600`, `v1000`), `faq` (id = nombre de archivo), `blog` (id = nombre de archivo `.md`; `cover` es `ImageMetadata`).
  - `productImage(file: string): ImageMetadata` — resuelve `src/assets/products/<file>`.

- [ ] **Step 1: Test de contenido (falla)**

`tests/content.test.ts`:

```ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { faqSchema, productSchema } from "@/content/schemas";

const root = join(process.cwd(), "src/content");
const readJsonDir = (dir: string) =>
  readdirSync(join(root, dir))
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ id: f.replace(/\.json$/, ""), data: JSON.parse(readFileSync(join(root, dir, f), "utf8")) as unknown }));

const products = readJsonDir("products");
const faqs = readJsonDir("faq");

describe("productos", () => {
  it("hay exactamente v600 y v1000", () => {
    expect(products.map((p) => p.id).sort()).toEqual(["v1000", "v600"]);
  });
  it.each(products)("$id cumple el esquema", ({ data }) => {
    const r = productSchema.safeParse(data);
    expect(r.success, JSON.stringify(r.success ? null : r.error.issues, null, 2)).toBe(true);
  });
  it("el slug coincide con el nombre de archivo", () => {
    for (const p of products) expect(productSchema.parse(p.data).slug).toBe(p.id);
  });
  it("V1000 cubre 1200 m² y V600 600 m²", () => {
    const byId = Object.fromEntries(products.map((p) => [p.id, productSchema.parse(p.data)]));
    expect(byId.v1000!.coverageM2).toBe(1200);
    expect(byId.v600!.coverageM2).toBe(600);
  });
  it("cada FAQ referenciada existe", () => {
    const ids = new Set(faqs.map((f) => f.id));
    for (const p of products) for (const id of productSchema.parse(p.data).faq) expect(ids.has(id), `faq "${id}" no existe`).toBe(true);
  });
});

describe("faq", () => {
  it.each(faqs)("$id cumple el esquema", ({ data }) => {
    const r = faqSchema.safeParse(data);
    expect(r.success, JSON.stringify(r.success ? null : r.error.issues, null, 2)).toBe(true);
  });
  it("hay al menos 9 preguntas y las 3 más frecuentes están en home, v600 y v1000", () => {
    expect(faqs.length).toBeGreaterThanOrEqual(9);
    for (const id of ["recoger-cesped", "cuanto-tarda", "mantenimiento"]) {
      const f = faqs.find((x) => x.id === id);
      expect(f, `falta ${id}`).toBeDefined();
      expect(faqSchema.parse(f!.data).scope).toEqual(expect.arrayContaining(["home", "v600", "v1000"]));
    }
  });
});

describe("palabra prohibida", () => {
  it('ningún JSON de contenido contiene "oficial"', () => {
    for (const { id, data } of [...products, ...faqs]) {
      expect(JSON.stringify(data).toLowerCase(), id).not.toContain("oficial");
    }
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm test -- tests/content.test.ts 2>&1 | tail -5`
Expected: FAIL — no existe `@/content/schemas` ni la carpeta `src/content/products`.

- [ ] **Step 3: `src/content/schemas.ts`**

```ts
import { z } from "astro/zod";

export const productSlugSchema = z.enum(["v600", "v1000"]);
export type ProductSlug = z.infer<typeof productSlugSchema>;

export const faqScopeSchema = z.enum(["home", "v600", "v1000", "comparativa"]);
export type FaqScope = z.infer<typeof faqScopeSchema>;

const specItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const productSchema = z.object({
  name: z.string().min(1),
  slug: productSlugSchema,
  model: z.string().min(1),
  tagline: z.string().min(1),
  coverageM2: z.number().int().positive(),
  priceUSD: z.number().positive().nullable(),
  inStock: z.boolean(),
  highlights: z.array(z.string().min(1)).min(3).max(5),
  fit: z.object({
    maxSlopeDeg: z.number().positive(),
    maxSlopePct: z.number().positive(),
    obstacles: z.boolean(),
    multiZone: z.boolean(),
    noiseDb: z.number().positive(),
    areaPerHourM2: z.string().min(1),
    runtimeMin: z.number().int().positive(),
  }),
  specs: z
    .array(
      z.object({
        category: z.string().min(1),
        items: z.array(specItemSchema).min(1),
      }),
    )
    .min(1),
  image: z.string().regex(/^[a-z0-9-]+\.(png|jpg|webp)$/),
  imageAlt: z.string().min(10),
  ogImage: z.string().startsWith("/og/"),
  faq: z.array(z.string().min(1)),
  why: z.object({ title: z.string().min(1), text: z.string().min(50) }),
  seo: z.object({
    title: z.string().min(10).max(60),
    description: z.string().min(50).max(160),
  }),
});
export type Product = z.infer<typeof productSchema>;

export const faqSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(20),
  scope: z.array(faqScopeSchema).min(1),
  order: z.number().int(),
  link: z.object({ label: z.string().min(1), href: z.string().startsWith("/") }).optional(),
});
export type Faq = z.infer<typeof faqSchema>;

export const blogSchema = z.object({
  title: z.string().min(10).max(60),
  description: z.string().min(50).max(160),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  coverAlt: z.string().min(10),
  tags: z.array(z.string().min(1)).min(1),
  relatedProducts: z.array(productSlugSchema).default([]),
  draft: z.boolean().default(false),
});
export type BlogFrontmatter = z.infer<typeof blogSchema>;
```

- [ ] **Step 4: `src/content.config.ts`**

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { blogSchema, faqSchema, productSchema } from "./content/schemas";

const products = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/products" }),
  schema: productSchema,
});

const faq = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/faq" }),
  schema: faqSchema,
});

const blog = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/blog" }),
  schema: ({ image }) => blogSchema.extend({ cover: image() }),
});

export const collections = { products, faq, blog };
```

- [ ] **Step 5: `src/content/products/v1000.json`**

```json
{
  "name": "TerraMow V1000",
  "slug": "v1000",
  "model": "V1000",
  "tagline": "Máxima cobertura para jardines grandes",
  "coverageM2": 1200,
  "priceUSD": 2100,
  "inStock": true,
  "highlights": [
    "Navegación por cámara con IA, sin cables ni antenas RTK",
    "Cobertura hasta 1200 m²",
    "Triple cámara TerraVision™ 2.0",
    "Impermeabilidad IPX6"
  ],
  "fit": {
    "maxSlopeDeg": 18,
    "maxSlopePct": 32.5,
    "obstacles": true,
    "multiZone": true,
    "noiseDb": 54,
    "areaPerHourM2": "80-120 m²",
    "runtimeMin": 150
  },
  "specs": [
    {
      "category": "Parámetros generales",
      "items": [
        { "label": "Tecnología de navegación", "value": "TerraVision™ 2.0, visión con IA de triple cámara" },
        { "label": "Conectividad", "value": "Wi-Fi / red celular 4G" },
        { "label": "Área de corte recomendada", "value": "1200 m² (0,3 acres)" },
        { "label": "Área de corte por hora", "value": "80-120 m² (según la complejidad del césped)" },
        { "label": "Área de corte por carga completa", "value": "160-300 m²" },
        { "label": "Altura de corte", "value": "25-75 mm" },
        { "label": "Ancho de corte", "value": "203 mm" }
      ]
    },
    {
      "category": "Funciones inteligentes",
      "items": [
        { "label": "Mapeo automático con IA", "value": "Sí" },
        { "label": "Evasión de obstáculos 3D", "value": "Sí" },
        { "label": "Ajuste eléctrico de altura de corte", "value": "Sí" },
        { "label": "Recarga automática", "value": "Sí" },
        { "label": "Detección de lluvia", "value": "Sí" },
        { "label": "Actualización OTA (por internet)", "value": "Sí" }
      ]
    },
    {
      "category": "Batería",
      "items": [
        { "label": "Capacidad", "value": "4,5 Ah / 98,55 Wh" },
        { "label": "Tiempo de carga", "value": "120 minutos" },
        { "label": "Autonomía por carga", "value": "150 minutos" }
      ]
    },
    {
      "category": "Otras especificaciones",
      "items": [
        { "label": "Nivel de ruido", "value": "< 54 dB" },
        { "label": "Impermeabilidad", "value": "IPX6" },
        { "label": "Temperatura de operación", "value": "0-55 °C" },
        { "label": "Pendiente máxima", "value": "18° (32,5 %)" },
        { "label": "Voltaje de trabajo", "value": "24 V CC" },
        { "label": "Peso", "value": "11,8 kg" },
        { "label": "Dimensiones", "value": "60,2 × 39,4 × 33,1 cm" }
      ]
    }
  ],
  "image": "v1000.png",
  "imageAlt": "Robot cortacésped TerraMow V1000 con navegación por cámara e IA para jardines de hasta 1200 m²",
  "ogImage": "/og/v1000.jpg",
  "faq": ["recoger-cesped", "cuanto-tarda", "mantenimiento", "cables", "seguridad", "garantia"],
  "why": {
    "title": "¿Por qué el V1000?",
    "text": "Es el modelo para jardines grandes o con varias zonas: hasta 1200 m², 150 minutos de autonomía y triple cámara con IA que reconoce el césped, los bordes y los obstáculos sin cables perimetrales ni antenas RTK. Vuelve solo a la base, detecta lluvia y se actualiza por internet. Ideal si tenés más de 600 m², árboles, canteros o pendientes de hasta 18°."
  },
  "seo": {
    "title": "TerraMow V1000: robot cortacésped hasta 1200 m² | Precio",
    "description": "Ficha completa del TerraMow V1000: 1200 m² de cobertura, triple cámara con IA, sin cables ni RTK, especificaciones y precio. Garantía y envío a todo el país."
  }
}
```

- [ ] **Step 6: `src/content/products/v600.json`**

```json
{
  "name": "TerraMow V600",
  "slug": "v600",
  "model": "V600",
  "tagline": "Ideal para jardines medianos",
  "coverageM2": 600,
  "priceUSD": null,
  "inStock": false,
  "highlights": [
    "Navegación por cámara con IA, sin cables ni antenas RTK",
    "Cobertura hasta 600 m²",
    "Triple cámara TerraVision™ 2.0",
    "Impermeabilidad IPX6"
  ],
  "fit": {
    "maxSlopeDeg": 18,
    "maxSlopePct": 32.5,
    "obstacles": true,
    "multiZone": true,
    "noiseDb": 54,
    "areaPerHourM2": "80-120 m²",
    "runtimeMin": 120
  },
  "specs": [
    {
      "category": "Parámetros generales",
      "items": [
        { "label": "Tecnología de navegación", "value": "TerraVision™ 2.0, visión con IA de triple cámara" },
        { "label": "Conectividad", "value": "Wi-Fi / red celular 4G" },
        { "label": "Área de corte recomendada", "value": "600 m² (0,15 acres)" },
        { "label": "Área de corte por hora", "value": "80-120 m² (según la complejidad del césped)" },
        { "label": "Área de corte por carga completa", "value": "130-250 m²" },
        { "label": "Altura de corte", "value": "25-75 mm" },
        { "label": "Ancho de corte", "value": "203 mm" }
      ]
    },
    {
      "category": "Funciones inteligentes",
      "items": [
        { "label": "Mapeo automático con IA", "value": "Sí" },
        { "label": "Evasión de obstáculos 3D", "value": "Sí" },
        { "label": "Ajuste eléctrico de altura de corte", "value": "Sí" },
        { "label": "Recarga automática", "value": "Sí" },
        { "label": "Detección de lluvia", "value": "Sí" },
        { "label": "Actualización OTA (por internet)", "value": "Sí" }
      ]
    },
    {
      "category": "Batería",
      "items": [
        { "label": "Capacidad", "value": "3,8 Ah / 84,36 Wh" },
        { "label": "Tiempo de carga", "value": "100 minutos" },
        { "label": "Autonomía por carga", "value": "120 minutos" }
      ]
    },
    {
      "category": "Otras especificaciones",
      "items": [
        { "label": "Nivel de ruido", "value": "< 54 dB" },
        { "label": "Impermeabilidad", "value": "IPX6" },
        { "label": "Temperatura de operación", "value": "0-50 °C" },
        { "label": "Pendiente máxima", "value": "18° (32,5 %)" },
        { "label": "Voltaje de trabajo", "value": "24 V CC" },
        { "label": "Peso", "value": "11,8 kg" },
        { "label": "Dimensiones", "value": "60,2 × 39,4 × 33,1 cm" }
      ]
    }
  ],
  "image": "v600.png",
  "imageAlt": "Robot cortacésped TerraMow V600 con navegación por cámara e IA para jardines de hasta 600 m²",
  "ogImage": "/og/v600.jpg",
  "faq": ["recoger-cesped", "cuanto-tarda", "mantenimiento", "cables", "seguridad", "garantia"],
  "why": {
    "title": "¿Por qué el V600?",
    "text": "Es la puerta de entrada a la V Series: la misma navegación por cámara con IA y las mismas funciones inteligentes que el V1000, en un equipo pensado para jardines de hasta 600 m². Sin cables perimetrales, sin antenas, con mapeo automático y control desde la app. Si tu jardín es mediano y sin zonas muy separadas, es la opción justa."
  },
  "seo": {
    "title": "TerraMow V600: robot cortacésped hasta 600 m² | Ficha",
    "description": "Ficha del TerraMow V600 para jardines medianos: navegación con IA sin cables, mapeo automático y especificaciones completas. Consultá disponibilidad por WhatsApp."
  }
}
```

- [ ] **Step 7: FAQ — 9 archivos en `src/content/faq/`**

`recoger-cesped.json`:
```json
{
  "question": "¿Hay que recoger el césped cortado?",
  "answer": "No. El robot corta un poco cada vez y deja recortes muy finos que caen entre las hojas y se descomponen en uno o dos días (mulching). No queda césped acumulado ni hay que rastrillar; además funciona como fertilizante natural.",
  "scope": ["home", "v600", "v1000"],
  "order": 1,
  "link": { "label": "Leé la guía de mantenimiento", "href": "/blog/mantenimiento-robot-cortacesped" }
}
```

`cuanto-tarda.json`:
```json
{
  "question": "¿Cuánto tarda en cortar el jardín?",
  "answer": "Depende de la superficie y de la complejidad. Como referencia, corta entre 80 y 120 m² por hora: un jardín de 600 m² lleva unas 5 a 7 horas repartidas en una o dos sesiones; uno de 1200 m², entre 10 y 15. Como trabaja solo y en los horarios que le programes, el tiempo no lo pasás vos.",
  "scope": ["home", "v600", "v1000", "comparativa"],
  "order": 2,
  "link": { "label": "Ver cuánto tiempo ahorrás al año", "href": "/blog/conviene-robot-cortacesped-argentina" }
}
```

`mantenimiento.json`:
```json
{
  "question": "¿Qué mantenimiento necesita?",
  "answer": "Muy poco: cambiar las cuchillas cada 4 a 8 semanas (son económicas y se cambian con un destornillador), limpiar la parte inferior y las cámaras cada tanto, y guardarlo bajo techo en invierno si no lo vas a usar. No tiene aceite, nafta ni filtros.",
  "scope": ["home", "v600", "v1000"],
  "order": 3,
  "link": { "label": "Guía completa de mantenimiento", "href": "/blog/mantenimiento-robot-cortacesped" }
}
```

`cables.json`:
```json
{
  "question": "¿Necesita cables perimetrales para funcionar?",
  "answer": "No. Los robots TerraMow V Series navegan con cámaras e inteligencia artificial: reconocen dónde hay césped y dónde no. No requieren cables enterrados, antenas RTK ni balizas. Se instala la base, se hace el mapeo automático y ya está.",
  "scope": ["home", "v600", "v1000"],
  "order": 4,
  "link": { "label": "Cámara con IA vs RTK vs LiDAR", "href": "/blog/camara-ia-vs-rtk-vs-lidar-robot-cortacesped" }
}
```

`superficie.json`:
```json
{
  "question": "¿Qué superficie cubre cada modelo?",
  "answer": "El TerraMow V600 cubre hasta 600 m² y es ideal para jardines medianos. El V1000 cubre hasta 1200 m² y tiene más autonomía (150 minutos por carga), pensado para terrenos grandes o con varias zonas.",
  "scope": ["home", "comparativa"],
  "order": 5,
  "link": { "label": "Comparar V600 y V1000", "href": "/productos/v600-vs-v1000" }
}
```

`app.json`:
```json
{
  "question": "¿Cómo se controla el robot?",
  "answer": "Desde la app TerraMow para iOS y Android. Ahí programás horarios, ajustás la altura de corte, definís zonas de trabajo y zonas prohibidas, y seguís el progreso en tiempo real. También podés mandarlo a la base o pausarlo desde el celular.",
  "scope": ["home", "v600", "v1000"],
  "order": 6
}
```

`seguridad.json`:
```json
{
  "question": "¿Es seguro con mascotas y niños?",
  "answer": "Sí. Detecta obstáculos en 3D y los esquiva o se detiene; si se levanta o se inclina, las cuchillas se frenan al instante. Además tiene sistema antirrobo con PIN y alarma. De todos modos, como con cualquier máquina de corte, no conviene dejar chicos jugando sobre el césped mientras trabaja.",
  "scope": ["home", "v600", "v1000"],
  "order": 7
}
```

`envios.json`:
```json
{
  "question": "¿Hacen envíos a todo el país?",
  "answer": "Sí, enviamos a toda la Argentina. La compra y el envío se coordinan por WhatsApp: te confirmamos disponibilidad, precio del día y plazo de entrega a tu domicilio.",
  "scope": ["home"],
  "order": 8
}
```

`garantia.json`:
```json
{
  "question": "¿Tienen garantía?",
  "answer": "Sí. Todos los equipos tienen garantía del fabricante y soporte técnico local: te ayudamos con la instalación, la configuración de la app y cualquier consulta de mantenimiento.",
  "scope": ["home", "v600", "v1000"],
  "order": 9
}
```

Crear también `src/content/blog/.gitkeep` vacío (la colección `blog` necesita que exista la carpeta).

- [ ] **Step 8: `src/lib/product-images.ts`**

```ts
import type { ImageMetadata } from "astro";

const images = import.meta.glob<{ default: ImageMetadata }>("/src/assets/products/*.{png,jpg,webp}", { eager: true });

/** Devuelve la imagen de `src/assets/products/<file>` para usar con <Image>. */
export function productImage(file: string): ImageMetadata {
  const hit = images[`/src/assets/products/${file}`];
  if (!hit) throw new Error(`Imagen de producto no encontrada: src/assets/products/${file}`);
  return hit.default;
}
```

- [ ] **Step 9: Tests y build en verde**

Run: `npm test 2>&1 | tail -6`
Expected: `5 passed` (todos los archivos), 0 failed.

Run: `npm run build 2>&1 | grep -E "error|Complete" | head -5`
Expected: `Complete!` y ningún `error` — las colecciones validan.

- [ ] **Step 10: Commit**

```bash
git add src/content src/content.config.ts src/lib/product-images.ts tests/content.test.ts
git commit -m "feat: colecciones de contenido (productos, FAQ, blog) con esquemas validados

V1000 = 1200 m² según ficha de TerraMow. FAQ con las 3 preguntas más
frecuentes por WhatsApp (césped cortado, tiempo, mantenimiento).

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Builders JSON-LD y helpers de URL

**Files:**
- Create: `src/lib/seo.ts`, `src/lib/schema.ts`
- Test: `tests/seo.test.ts`, `tests/schema.test.ts`

**Interfaces:**
- Consumes: `site` (Task 2), tipo `Product` (Task 4).
- Produces:
  - `canonicalUrl(pathname: string): string`, `absoluteUrl(path: string): string`.
  - `ldOrganization(): object`, `ldWebSite(): object`, `ldBreadcrumb(items: { name: string; url: string }[]): object`, `ldProduct(p: Product, opts: { url: string; imageUrl: string }): object`, `ldFaq(items: { question: string; answer: string }[]): object`, `ldItemList(items: { name: string; url: string }[]): object`, `ldHowTo(opts: { name: string; description: string; steps: { name: string; text: string }[] }): object`, `ldArticle(a: { title: string; description: string; url: string; imageUrl: string; pubDate: Date; updatedDate?: Date }): object`.

- [ ] **Step 1: Tests (fallan)**

`tests/seo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { absoluteUrl, canonicalUrl } from "@/lib/seo";

describe("canonicalUrl", () => {
  it("home", () => expect(canonicalUrl("/")).toBe("https://www.robotscortacesped.com.ar/"));
  it("quita barra final e index.html", () => {
    expect(canonicalUrl("/tecnologia/")).toBe("https://www.robotscortacesped.com.ar/tecnologia");
    expect(canonicalUrl("/tecnologia/index.html")).toBe("https://www.robotscortacesped.com.ar/tecnologia");
    expect(canonicalUrl("/productos/v1000")).toBe("https://www.robotscortacesped.com.ar/productos/v1000");
  });
});

describe("absoluteUrl", () => {
  it("antepone el dominio", () => expect(absoluteUrl("/og/v1000.jpg")).toBe("https://www.robotscortacesped.com.ar/og/v1000.jpg"));
  it("respeta URLs ya absolutas", () => expect(absoluteUrl("https://x.com/a.jpg")).toBe("https://x.com/a.jpg"));
});
```

`tests/schema.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { productSchema } from "@/content/schemas";
import {
  ldArticle, ldBreadcrumb, ldFaq, ldHowTo, ldItemList, ldOrganization, ldProduct, ldWebSite,
} from "@/lib/schema";

const v1000 = productSchema.parse(JSON.parse(readFileSync("src/content/products/v1000.json", "utf8")));
const v600 = productSchema.parse(JSON.parse(readFileSync("src/content/products/v600.json", "utf8")));
const asRecord = (o: object) => o as Record<string, any>;

describe("JSON-LD", () => {
  it("Organization tiene logo, teléfono nuevo y sameAs", () => {
    const o = asRecord(ldOrganization());
    expect(o["@type"]).toBe("Organization");
    expect(o.logo).toBe("https://www.robotscortacesped.com.ar/logo.png");
    expect(o.contactPoint.telephone).toBe("+5492494318185");
    expect(o.sameAs).toContain("https://www.instagram.com/robotscortacesped_argentina/");
    expect(JSON.stringify(o).toLowerCase()).not.toContain("oficial");
  });
  it("WebSite", () => expect(asRecord(ldWebSite())["@type"]).toBe("WebSite"));
  it("Breadcrumb numera posiciones", () => {
    const b = asRecord(ldBreadcrumb([{ name: "Inicio", url: "https://x/" }, { name: "Productos", url: "https://x/p" }]));
    expect(b.itemListElement[1]).toEqual({ "@type": "ListItem", position: 2, name: "Productos", item: "https://x/p" });
  });
  it("Product con precio: Offer en USD, InStock", () => {
    const p = asRecord(ldProduct(v1000, { url: "https://x/productos/v1000", imageUrl: "https://x/i.webp" }));
    expect(p["@type"]).toBe("Product");
    expect(p.brand).toEqual({ "@type": "Brand", name: "TerraMow" });
    expect(p.offers.price).toBe(2100);
    expect(p.offers.priceCurrency).toBe("USD");
    expect(p.offers.availability).toBe("https://schema.org/InStock");
    expect(p.offers.url).toBe("https://x/productos/v1000");
  });
  it("Product sin precio: sin Offer; sin stock → OutOfStock no aplica porque no hay oferta", () => {
    const p = asRecord(ldProduct(v600, { url: "https://x/productos/v600", imageUrl: "https://x/i.webp" }));
    expect(p.offers).toBeUndefined();
  });
  it("Product sin stock pero con precio → OutOfStock", () => {
    const p = asRecord(ldProduct({ ...v600, priceUSD: 1500 }, { url: "https://x", imageUrl: "https://x/i" }));
    expect(p.offers.availability).toBe("https://schema.org/OutOfStock");
  });
  it("FAQPage", () => {
    const f = asRecord(ldFaq([{ question: "¿A?", answer: "B." }]));
    expect(f["@type"]).toBe("FAQPage");
    expect(f.mainEntity[0]).toEqual({ "@type": "Question", name: "¿A?", acceptedAnswer: { "@type": "Answer", text: "B." } });
  });
  it("ItemList", () => {
    const l = asRecord(ldItemList([{ name: "A", url: "https://x/a" }]));
    expect(l.itemListElement[0]).toEqual({ "@type": "ListItem", position: 1, name: "A", url: "https://x/a" });
  });
  it("HowTo", () => {
    const h = asRecord(ldHowTo({ name: "N", description: "D", steps: [{ name: "S1", text: "T1" }] }));
    expect(h.step[0]).toEqual({ "@type": "HowToStep", position: 1, name: "S1", text: "T1" });
  });
  it("BlogPosting con fechas ISO y publisher", () => {
    const a = asRecord(ldArticle({ title: "T", description: "D", url: "https://x/blog/t", imageUrl: "https://x/c.webp", pubDate: new Date("2026-09-10T00:00:00Z") }));
    expect(a["@type"]).toBe("BlogPosting");
    expect(a.datePublished).toBe("2026-09-10T00:00:00.000Z");
    expect(a.dateModified).toBe("2026-09-10T00:00:00.000Z");
    expect(a.publisher["@type"]).toBe("Organization");
    expect(a.mainEntityOfPage).toEqual({ "@type": "WebPage", "@id": "https://x/blog/t" });
  });
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `npm test -- tests/seo.test.ts tests/schema.test.ts 2>&1 | tail -5`
Expected: FAIL por módulos inexistentes.

- [ ] **Step 3: `src/lib/seo.ts`**

```ts
import { site } from "@/config/site";

/** URL canónica absoluta: sin barra final (salvo la home) ni index.html. */
export function canonicalUrl(pathname: string): string {
  let path = pathname.replace(/index\.html$/, "");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (!path.startsWith("/")) path = `/${path}`;
  return `${site.url}${path}`;
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
```

- [ ] **Step 4: `src/lib/schema.ts`**

```ts
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
```

- [ ] **Step 5: Tests en verde**

Run: `npm test 2>&1 | tail -6`
Expected: `7 passed`, 0 failed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/seo.ts src/lib/schema.ts tests/seo.test.ts tests/schema.test.ts
git commit -m "feat: builders JSON-LD (Organization, Product, FAQ, HowTo, Article…) y URLs canónicas

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Layout base, SEO, navbar, footer y botones de WhatsApp

**Files:**
- Create: `src/components/icons/IconWhatsApp.astro`, `IconInstagram.astro`, `IconMenu.astro`, `IconClose.astro`, `IconArrowRight.astro`, `IconArrowLeft.astro`, `IconCheck.astro`, `IconChevronDown.astro`, `src/components/SEO.astro`, `src/components/JsonLd.astro`, `src/components/WhatsAppButton.astro`, `src/components/WhatsAppFloat.astro`, `src/components/Navbar.astro`, `src/components/Footer.astro`, `src/layouts/BaseLayout.astro`, `src/scripts/menu.ts`, `src/scripts/analytics.ts`, `src/pages/404.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `site`, `gaId`, `whatsappUrl`, `WaContext`, `canonicalUrl`, `absoluteUrl`, `ldOrganization`, `ldWebSite`.
- Produces:
  - `BaseLayout` props: `{ title: string; description: string; ogImage?: string; ogType?: "website" | "product" | "article"; noindex?: boolean; jsonLd?: object[]; }` — inserta `Organization` y `WebSite` siempre; el resto viene por `jsonLd`. Slot por defecto para el contenido. Usa `Astro.url.pathname` para la canónica.
  - `WhatsAppButton` props: `{ context: WaContext; subject?: string; wa: string; product?: string; label: string; variant?: "primary" | "outline" | "bar"; class?: string; }` — renderiza `<a data-wa={wa} data-product={product}>`.
  - `Navbar`, `Footer`, `WhatsAppFloat` sin props. `WhatsAppFloat` tiene `id="wa-float"`.
  - Todos los iconos aceptan `class` y `size` (px, default 20).

- [ ] **Step 1: Iconos (SVG inline, estilo Lucide, stroke currentColor)**

`src/components/icons/IconMenu.astro`:
```astro
---
interface Props { class?: string; size?: number }
const { class: cls = "", size = 24 } = Astro.props;
---
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true"><path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path></svg>
```

`IconClose.astro` (mismo frontmatter):
```astro
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
```

`IconInstagram.astro`:
```astro
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
```

`IconArrowRight.astro`:
```astro
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
```

`IconArrowLeft.astro`:
```astro
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
```

`IconCheck.astro`:
```astro
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
```

`IconChevronDown.astro`:
```astro
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
```

`IconWhatsApp.astro` (relleno, logo de Simple Icons):
```astro
---
interface Props { class?: string; size?: number }
const { class: cls = "", size = 20 } = Astro.props;
---
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" class={cls} aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path></svg>
```

- [ ] **Step 2: `src/components/WhatsAppButton.astro`**

```astro
---
import IconWhatsApp from "@/components/icons/IconWhatsApp.astro";
import { whatsappUrl, type WaContext } from "@/lib/whatsapp";

interface Props {
  context: WaContext;
  subject?: string;
  /** Identificador del botón para GA4, ej. "home-hero", "ficha-v1000-sticky" */
  wa: string;
  product?: string;
  label: string;
  variant?: "primary" | "outline" | "bar";
  class?: string;
}
const { context, subject, wa, product, label, variant = "primary", class: cls = "" } = Astro.props;
const href = whatsappUrl(context, subject);
const variants = {
  primary: "bg-whatsapp text-white hover:bg-whatsapp-hover shadow-lg shadow-whatsapp/20 px-6 py-3.5 text-base",
  outline: "border border-border text-foreground hover:bg-secondary px-6 py-3.5 text-base",
  bar: "bg-whatsapp text-white hover:bg-whatsapp-hover px-4 py-2.5 text-sm",
};
const ariaLabel = subject ? `${label} — ${subject} por WhatsApp` : `${label} por WhatsApp`;
---
<a
  href={href}
  target="_blank"
  rel="noopener noreferrer"
  data-wa={wa}
  data-product={product}
  aria-label={ariaLabel}
  class:list={["inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors", variants[variant], cls]}
>
  <IconWhatsApp size={variant === "bar" ? 18 : 22} />
  <span>{label}</span>
</a>
```

- [ ] **Step 3: `src/components/WhatsAppFloat.astro`**

```astro
---
import IconWhatsApp from "@/components/icons/IconWhatsApp.astro";
import { whatsappUrl } from "@/lib/whatsapp";
---
<a
  id="wa-float"
  href={whatsappUrl("general")}
  target="_blank"
  rel="noopener noreferrer"
  data-wa="float"
  aria-label="Contactar por WhatsApp"
  class="fixed right-5 bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition-transform hover:scale-110 hover:bg-whatsapp-hover"
>
  <IconWhatsApp size={28} />
</a>
```

- [ ] **Step 4: `src/components/Navbar.astro` y `src/scripts/menu.ts`**

`Navbar.astro`:
```astro
---
import { Image } from "astro:assets";
import logo from "@/assets/logo.png";
import IconClose from "@/components/icons/IconClose.astro";
import IconInstagram from "@/components/icons/IconInstagram.astro";
import IconMenu from "@/components/icons/IconMenu.astro";
import WhatsAppButton from "@/components/WhatsAppButton.astro";
import { site } from "@/config/site";

const links = [
  { href: "/#productos", label: "Productos" },
  { href: "/tecnologia", label: "Tecnología" },
  { href: "/blog", label: "Guías" },
];
const linkCls = "text-sm font-medium text-muted-foreground transition-colors hover:text-primary";
---
<header class="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
  <nav class="wrap flex h-16 items-center justify-between lg:h-20" aria-label="Principal">
    <a href="/" class="flex items-center" aria-label={`${site.name} — inicio`}>
      <Image src={logo} alt={site.name} height={56} width={Math.round((logo.width * 56) / logo.height)} format="webp" loading="eager" class="h-10 w-auto lg:h-14" />
    </a>

    <div class="hidden items-center gap-8 md:flex">
      {links.map((l) => <a href={l.href} class={linkCls}>{l.label}</a>)}
      <a href={site.instagram} target="_blank" rel="noopener noreferrer" class={linkCls} aria-label="Instagram"><IconInstagram size={20} /></a>
      <WhatsAppButton context="general" wa="nav" label="Consultar" variant="bar" />
    </div>

    <button
      id="menu-toggle"
      type="button"
      class="text-foreground md:hidden"
      aria-controls="menu-mobile"
      aria-expanded="false"
      aria-label="Abrir menú"
    >
      <IconMenu class="menu-icon-open" size={24} />
      <IconClose class="menu-icon-close hidden" size={24} />
    </button>
  </nav>

  <div id="menu-mobile" class="wrap hidden flex-col gap-4 border-t border-border pb-6 pt-4 md:hidden">
    {links.map((l) => <a href={l.href} class={linkCls}>{l.label}</a>)}
    <a href={site.instagram} target="_blank" rel="noopener noreferrer" class:list={["flex items-center gap-2", linkCls]}><IconInstagram size={18} /> Instagram</a>
    <WhatsAppButton context="general" wa="nav-mobile" label="Consultar por WhatsApp" variant="primary" class="w-full" />
  </div>
</header>

<script>
  import "@/scripts/menu.ts";
</script>
```

`src/scripts/menu.ts`:
```ts
const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu-mobile");

function setOpen(open: boolean): void {
  if (!toggle || !menu) return;
  menu.classList.toggle("hidden", !open);
  menu.classList.toggle("flex", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  toggle.querySelector(".menu-icon-open")?.classList.toggle("hidden", open);
  toggle.querySelector(".menu-icon-close")?.classList.toggle("hidden", !open);
}

if (toggle && menu) {
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}
```

- [ ] **Step 5: `src/components/Footer.astro`**

```astro
---
import { Image } from "astro:assets";
import logo from "@/assets/logo.png";
import IconInstagram from "@/components/icons/IconInstagram.astro";
import { site } from "@/config/site";

const year = new Date().getFullYear();
const linkCls = "text-sm text-muted-foreground transition-colors hover:text-primary";
---
<footer class="border-t border-border py-16">
  <div class="wrap">
    <div class="mb-12 grid gap-12 md:grid-cols-3">
      <div>
        <Image src={logo} alt={site.name} height={48} width={Math.round((logo.width * 48) / logo.height)} format="webp" loading="lazy" class="mb-4 h-12 w-auto" />
        <p class="text-sm leading-relaxed text-muted-foreground">
          {site.brandClaim}. Robots cortacésped con navegación por cámara e inteligencia artificial para el cuidado del jardín.
        </p>
      </div>
      <nav aria-label="Enlaces del sitio">
        <h2 class="mb-4 font-semibold">Enlaces</h2>
        <ul class="space-y-3">
          <li><a href="/#productos" class={linkCls}>Productos</a></li>
          <li><a href="/productos/v600-vs-v1000" class={linkCls}>Comparativa V600 vs V1000</a></li>
          <li><a href="/tecnologia" class={linkCls}>Tecnología</a></li>
          <li><a href="/blog" class={linkCls}>Guías</a></li>
          <li><a href={site.terramow} target="_blank" rel="noopener noreferrer" class={linkCls}>Sitio de TerraMow ↗</a></li>
        </ul>
      </nav>
      <div>
        <h2 class="mb-4 font-semibold">Contacto</h2>
        <ul class="space-y-3">
          <li class="text-sm text-muted-foreground">{site.location.locality}, Argentina</li>
          <li><a href={`mailto:${site.email}`} class={linkCls}>{site.email}</a></li>
          <li><a href={site.instagram} target="_blank" rel="noopener noreferrer" class:list={["inline-flex items-center gap-2", linkCls]}><IconInstagram size={16} /> Instagram</a></li>
        </ul>
      </div>
    </div>
    <div class="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row">
      <p>© {year} {site.name}. Todos los derechos reservados.</p>
      <p>{site.brandClaim}</p>
    </div>
  </div>
</footer>
```

- [ ] **Step 6: `src/components/SEO.astro` y `src/components/JsonLd.astro`**

`JsonLd.astro`:
```astro
---
interface Props { data: object }
const { data } = Astro.props;
---
<script type="application/ld+json" set:html={JSON.stringify(data)}></script>
```

`SEO.astro`:
```astro
---
import { site } from "@/config/site";
import { absoluteUrl, canonicalUrl } from "@/lib/seo";

interface Props {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: "website" | "product" | "article";
  noindex?: boolean;
}
const { title, description, ogImage = "/og/default.jpg", ogType = "website", noindex = false } = Astro.props;
const canonical = canonicalUrl(Astro.url.pathname);
const image = absoluteUrl(ogImage);
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1"} />

<meta property="og:type" content={ogType} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={image} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content={site.locale} />
<meta property="og:site_name" content={site.name} />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={image} />

<meta name="geo.region" content="AR" />
<meta name="google-site-verification" content={site.googleSiteVerification} />
```

- [ ] **Step 7: `src/scripts/analytics.ts`**

```ts
// Envía un evento a GA4 por cada click en un link de WhatsApp (a[data-wa]).
// gtag solo existe si BaseLayout insertó el snippet (PUBLIC_GA_ID definido).
document.addEventListener("click", (event) => {
  const target = event.target as Element | null;
  const link = target?.closest<HTMLAnchorElement>("a[data-wa]");
  if (!link || typeof gtag !== "function") return;
  gtag("event", "contact_whatsapp", {
    location: link.dataset.wa ?? "",
    product: link.dataset.product ?? "",
    page_path: window.location.pathname,
  });
});
```

- [ ] **Step 8: `src/layouts/BaseLayout.astro`**

```astro
---
import "@/styles/global.css";
import Footer from "@/components/Footer.astro";
import JsonLd from "@/components/JsonLd.astro";
import Navbar from "@/components/Navbar.astro";
import SEO from "@/components/SEO.astro";
import WhatsAppFloat from "@/components/WhatsAppFloat.astro";
import { gaId, site } from "@/config/site";
import { ldOrganization, ldWebSite } from "@/lib/schema";

interface Props {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: "website" | "product" | "article";
  noindex?: boolean;
  jsonLd?: object[];
}
const { title, description, ogImage, ogType, noindex, jsonLd = [] } = Astro.props;
const schemas = [ldOrganization(), ldWebSite(), ...jsonLd];
---
<!doctype html>
<html lang={site.lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0d0d0d" />
    <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <link rel="alternate" type="application/rss+xml" title={`${site.name} — Guías`} href="/rss.xml" />
    <SEO title={title} description={description} ogImage={ogImage} ogType={ogType} noindex={noindex} />
    {schemas.map((s) => <JsonLd data={s} />)}
    {gaId && (
      <>
        <script is:inline async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
        <script is:inline define:vars={{ gaId }}>
          window.dataLayer = window.dataLayer || [];
          function gtag() { dataLayer.push(arguments); }
          gtag("js", new Date());
          gtag("config", gaId);
        </script>
      </>
    )}
  </head>
  <body class="min-h-screen">
    <a href="#contenido" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Ir al contenido</a>
    <Navbar />
    <main id="contenido">
      <slot />
    </main>
    <Footer />
    <WhatsAppFloat />
    <script>
      import "@/scripts/analytics.ts";
    </script>
  </body>
</html>
```

- [ ] **Step 9: `src/pages/404.astro` e `index.astro` provisoria con layout**

`404.astro`:
```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import WhatsAppButton from "@/components/WhatsAppButton.astro";
---
<BaseLayout title="Página no encontrada" description="La página que buscás no existe o cambió de dirección. Volvé al inicio, mirá los modelos o escribinos por WhatsApp." noindex>
  <section class="wrap flex min-h-[70vh] flex-col items-center justify-center py-32 text-center">
    <p class="mb-4 text-xs font-semibold tracking-widest text-primary uppercase">Error 404</p>
    <h1 class="mb-4 text-4xl font-bold md:text-6xl">Esta página no existe</h1>
    <p class="mb-8 max-w-md text-muted-foreground">Puede que el link esté mal escrito o que la página haya cambiado de lugar.</p>
    <div class="flex flex-col gap-3 sm:flex-row">
      <a href="/" class="rounded-lg bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90">Ir al inicio</a>
      <a href="/#productos" class="rounded-lg border border-border px-6 py-3.5 font-semibold transition-colors hover:bg-secondary">Ver modelos</a>
      <WhatsAppButton context="general" wa="404" label="Escribinos" />
    </div>
  </section>
</BaseLayout>
```

`index.astro` (provisoria; la Parte 2 la reemplaza):
```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import WhatsAppButton from "@/components/WhatsAppButton.astro";
---
<BaseLayout title="Robot Cortacésped con IA en Argentina | TerraMow" description="Robots cortacésped con navegación por cámara e IA, sin cables perimetrales. Modelos TerraMow V600 y V1000, garantía y soporte local. Consultá por WhatsApp.">
  <section id="productos" class="wrap py-32">
    <h1 class="mb-6 text-4xl font-bold">Robot cortacésped con IA en Argentina</h1>
    <p class="mb-8 text-muted-foreground">Sitio en construcción.</p>
    <WhatsAppButton context="general" wa="home-temp" label="Consultar por WhatsApp" />
  </section>
</BaseLayout>
```

- [ ] **Step 10: Build y verificación del HTML generado**

Run: `npm run build 2>&1 | grep -E "error|warn|Complete" | head`
Expected: `Complete!`, sin `error`.

Run: `grep -o '<link rel="canonical" href="[^"]*"' dist/index.html dist/404.html`
Expected: `https://www.robotscortacesped.com.ar/` y `https://www.robotscortacesped.com.ar/404`.

Run: `grep -c 'application/ld+json' dist/index.html && grep -o 'name="robots" content="[^"]*"' dist/404.html && grep -o 'wa.me/[0-9]*' dist/index.html | sort -u`
Expected: `2` (Organization + WebSite), `noindex, nofollow`, `wa.me/5492494318185`.

Run: `grep -io 'oficial' dist/index.html dist/404.html | wc -l`
Expected: `0`.

Run: `PUBLIC_GA_ID=G-TEST123 npx astro build >/dev/null 2>&1 && grep -c 'googletagmanager.com/gtag/js?id=G-TEST123' dist/index.html; npx astro build >/dev/null 2>&1 && grep -c googletagmanager dist/index.html`
Expected: `1` y luego `0` (GA solo con la variable definida).

- [ ] **Step 11: Commit**

```bash
git add src/components src/layouts src/scripts src/pages
git commit -m "feat: layout base con SEO, JSON-LD, navbar, footer, WhatsApp y GA4 condicional

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Chequeos automáticos sobre `dist/`

**Files:**
- Create: `scripts/check/config.mjs`, `scripts/check/lib.mjs`, `scripts/check/forbidden.mjs`, `scripts/check/links.mjs`, `scripts/check/seo.mjs`, `scripts/check/budget.mjs`, `scripts/check/index.mjs`, `tests/fixtures/dist-ok/index.html`, `tests/fixtures/dist-ok/tecnologia/index.html`, `tests/fixtures/dist-ok/style.css`, `tests/fixtures/dist-ok/og/default.jpg`, `tests/fixtures/dist-bad/index.html`, `tests/fixtures/dist-bad/sitemap-0.xml`
- Modify: `package.json` (script `build`)
- Test: `tests/checks.test.ts`

**Interfaces:**
- Produces: cada módulo exporta `check<Nombre>(distDir: string): string[]` (lista de errores, vacía = OK). `index.mjs` corre los cuatro y sale con código 1 si hay errores. `npm run build` = `astro check && astro build && node scripts/check/index.mjs`.

- [ ] **Step 1: Fixtures**

`tests/fixtures/dist-ok/style.css`: `body{margin:0}`

`tests/fixtures/dist-ok/og/default.jpg`: cualquier archivo pequeño; crear con `printf 'jpg' > tests/fixtures/dist-ok/og/default.jpg`.

`tests/fixtures/dist-ok/index.html`:
```html
<!doctype html><html lang="es-AR"><head><title>Robot Cortacésped con IA en Argentina | TerraMow</title>
<meta name="description" content="Robots cortacésped con navegación por cámara e IA, sin cables perimetrales. Modelos TerraMow V600 y V1000, garantía y soporte local.">
<link rel="canonical" href="https://www.robotscortacesped.com.ar/">
<meta property="og:image" content="https://www.robotscortacesped.com.ar/og/default.jpg">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite"}</script>
</head><body><h1>Hola</h1><a href="/tecnologia">Tecnología</a><a href="/#productos">P</a><a href="https://wa.me/1">W</a><a href="mailto:a@b.c">M</a></body></html>
```

`tests/fixtures/dist-ok/tecnologia/index.html`:
```html
<!doctype html><html lang="es-AR"><head><title>Cómo funciona un robot cortacésped con IA | Guía</title>
<meta name="description" content="Guía paso a paso: mapeo, planificación, corte autónomo y control por app. Ahorro de tiempo real y comparativa contra el corte manual.">
<link rel="canonical" href="https://www.robotscortacesped.com.ar/tecnologia">
<meta property="og:image" content="https://www.robotscortacesped.com.ar/og/default.jpg">
</head><body><h1>Tecnología</h1><a href="/">Inicio</a></body></html>
```

`tests/fixtures/dist-bad/index.html`:
```html
<!doctype html><html lang="es"><head><title>Corto</title>
<meta name="description" content="Muy corta.">
<link rel="canonical" href="https://www.robotscortacesped.com.ar/otra">
<meta property="og:image" content="https://www.robotscortacesped.com.ar/og/no-existe.jpg">
<script type="application/ld+json">{no es json}</script>
</head><body><h1>Uno</h1><h1>Dos</h1><p>Distribuidor Oficial</p><a href="/no-existe">Rota</a><img src="/img/nada.png" alt=""></body></html>
```

`tests/fixtures/dist-bad/sitemap-0.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?><urlset><url><loc>https://www.robotscortacesped.com.ar/garantia-oficial</loc></url></urlset>
```

- [ ] **Step 2: Test (falla)**

`tests/checks.test.ts`:

```ts
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkBudget } from "../scripts/check/budget.mjs";
import { checkForbidden } from "../scripts/check/forbidden.mjs";
import { checkLinks } from "../scripts/check/links.mjs";
import { checkSeo } from "../scripts/check/seo.mjs";

const ok = join(process.cwd(), "tests/fixtures/dist-ok");
const bad = join(process.cwd(), "tests/fixtures/dist-bad");

describe("dist-ok pasa todos los chequeos", () => {
  it("forbidden", () => expect(checkForbidden(ok)).toEqual([]));
  it("links", () => expect(checkLinks(ok)).toEqual([]));
  it("seo", () => expect(checkSeo(ok)).toEqual([]));
  it("budget", () => expect(checkBudget(ok, 500 * 1024)).toEqual([]));
});

describe("dist-bad reporta cada problema", () => {
  it("forbidden encuentra la palabra en html y xml", () => {
    const errs = checkForbidden(bad);
    expect(errs.some((e) => e.includes("index.html"))).toBe(true);
    expect(errs.some((e) => e.includes("sitemap-0.xml"))).toBe(true);
  });
  it("links detecta href e img rotos", () => {
    const errs = checkLinks(bad);
    expect(errs.some((e) => e.includes("/no-existe"))).toBe(true);
    expect(errs.some((e) => e.includes("/img/nada.png"))).toBe(true);
  });
  it("seo detecta lang, título, descripción, canónica, og:image, h1 y JSON-LD", () => {
    const errs = checkSeo(bad).join("\n");
    for (const needle of ["lang", "title", "description", "canonical", "og:image", "h1", "JSON-LD"]) {
      expect(errs, `falta error de ${needle}`).toContain(needle);
    }
  });
  it("budget falla con un límite muy bajo", () => {
    expect(checkBudget(ok, 10).length).toBe(1);
  });
});
```

Run: `npm test -- tests/checks.test.ts 2>&1 | tail -5`
Expected: FAIL — no existen los módulos de `scripts/check/`.

- [ ] **Step 3: `scripts/check/config.mjs` y `lib.mjs`**

`config.mjs`:
```js
// Debe coincidir con `site` en astro.config.mjs y src/config/site.ts
export const SITE_URL = "https://www.robotscortacesped.com.ar";
export const BUDGET_BYTES = 500 * 1024;
export const FORBIDDEN = /oficial/i;
```

`lib.mjs`:
```js
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "node-html-parser";

export function walk(dir, exts) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

export function htmlFiles(distDir) {
  return walk(distDir, [".html"]).map((file) => ({
    file,
    rel: relative(distDir, file).replaceAll("\\", "/"),
    root: parse(readFileSync(file, "utf8")),
  }));
}

/** ¿Existe en dist el recurso al que apunta una URL interna (/a, /a/, /a.html, /img.png)? */
export function resolveInternal(distDir, href) {
  const path = decodeURIComponent(href.split("#")[0].split("?")[0]);
  if (path === "" || path === "/") return exists(join(distDir, "index.html"));
  const clean = path.replace(/\/+$/, "");
  return [clean, `${clean}/index.html`, `${clean}.html`].some((p) => exists(join(distDir, p)));
}

export function exists(p) {
  try { return statSync(p).isFile(); } catch { return false; }
}

export function isInternal(url) {
  return url.startsWith("/") && !url.startsWith("//");
}
```

- [ ] **Step 4: `forbidden.mjs`, `links.mjs`, `seo.mjs`, `budget.mjs`**

`forbidden.mjs`:
```js
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { FORBIDDEN } from "./config.mjs";
import { walk } from "./lib.mjs";

export function checkForbidden(distDir) {
  const errors = [];
  for (const file of walk(distDir, [".html", ".xml"])) {
    const text = readFileSync(file, "utf8");
    const m = FORBIDDEN.exec(text);
    if (m) {
      const ctx = text.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, " ");
      errors.push(`${relative(distDir, file)}: palabra prohibida "${m[0]}" … ${ctx} …`);
    }
  }
  return errors;
}
```

`links.mjs`:
```js
import { htmlFiles, isInternal, resolveInternal } from "./lib.mjs";

const SELECTORS = [
  ["a[href]", "href"],
  ["img[src]", "src"],
  ["link[rel=stylesheet][href]", "href"],
  ["script[src]", "src"],
  ["source[src]", "src"],
];

export function checkLinks(distDir) {
  const errors = [];
  for (const { rel, root } of htmlFiles(distDir)) {
    for (const [selector, attr] of SELECTORS) {
      for (const el of root.querySelectorAll(selector)) {
        const url = el.getAttribute(attr) ?? "";
        if (!isInternal(url)) continue;
        if (!resolveInternal(distDir, url)) errors.push(`${rel}: ${attr}="${url}" no existe en dist/`);
      }
    }
  }
  return errors;
}
```

`seo.mjs`:
```js
import { join } from "node:path";
import { SITE_URL } from "./config.mjs";
import { exists, htmlFiles } from "./lib.mjs";

function expectedCanonical(rel) {
  if (rel === "index.html") return `${SITE_URL}/`;
  return `${SITE_URL}/${rel.replace(/\/index\.html$/, "").replace(/\.html$/, "")}`;
}

export function checkSeo(distDir) {
  const errors = [];
  for (const { rel, root } of htmlFiles(distDir)) {
    const err = (msg) => errors.push(`${rel}: ${msg}`);
    const html = root.querySelector("html");
    if (html?.getAttribute("lang") !== "es-AR") err('html lang debe ser "es-AR"');

    const title = root.querySelector("title")?.text.trim() ?? "";
    if (title.length < 10 || title.length > 60) err(`title de ${title.length} caracteres (debe ser 10-60): "${title}"`);

    const desc = root.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";
    if (desc.length < 50 || desc.length > 160) err(`description de ${desc.length} caracteres (debe ser 50-160)`);

    const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "";
    if (canonical !== expectedCanonical(rel)) err(`canonical "${canonical}" ≠ esperada "${expectedCanonical(rel)}"`);

    const og = root.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "";
    if (!og.startsWith(SITE_URL)) err(`og:image ausente o no absoluta: "${og}"`);
    else if (!exists(join(distDir, og.slice(SITE_URL.length)))) err(`og:image apunta a un archivo inexistente: ${og}`);

    const h1s = root.querySelectorAll("h1").length;
    if (h1s !== 1) err(`hay ${h1s} <h1> (debe haber exactamente 1)`);

    for (const s of root.querySelectorAll('script[type="application/ld+json"]')) {
      try { JSON.parse(s.text); } catch { err("JSON-LD inválido"); }
    }
  }
  return errors;
}
```

`budget.mjs`:
```js
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "node-html-parser";
import { BUDGET_BYTES } from "./config.mjs";
import { exists, isInternal } from "./lib.mjs";

const ASSETS = [
  ["link[rel=stylesheet][href]", "href"],
  ["script[src]", "src"],
  ["img[src]", "src"],
  ["link[rel=preload][href]", "href"],
];

/** Peso de index.html + CSS + JS + imágenes referenciadas (sin video). */
export function checkBudget(distDir, limit = BUDGET_BYTES) {
  const index = join(distDir, "index.html");
  const html = readFileSync(index, "utf8");
  const root = parse(html);
  let total = statSync(index).size;
  const seen = new Set();
  for (const [selector, attr] of ASSETS) {
    for (const el of root.querySelectorAll(selector)) {
      const url = (el.getAttribute(attr) ?? "").split("?")[0];
      if (!isInternal(url) || seen.has(url)) continue;
      seen.add(url);
      const file = join(distDir, url);
      if (exists(file)) total += statSync(file).size;
    }
  }
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  return total > limit ? [`index.html carga ${kb(total)} (límite ${kb(limit)})`] : [];
}
```

`index.mjs`:
```js
import { join } from "node:path";
import { checkBudget } from "./budget.mjs";
import { checkForbidden } from "./forbidden.mjs";
import { checkLinks } from "./links.mjs";
import { checkSeo } from "./seo.mjs";

const dist = join(process.cwd(), "dist");
const suites = [
  ["Palabra prohibida", checkForbidden],
  ["Links internos", checkLinks],
  ["Reglas SEO", checkSeo],
  ["Presupuesto de peso", checkBudget],
];

let failed = 0;
for (const [name, fn] of suites) {
  const errors = fn(dist);
  if (errors.length === 0) {
    console.log(`✔ ${name}`);
  } else {
    failed += errors.length;
    console.log(`✖ ${name} — ${errors.length} problema(s):`);
    for (const e of errors) console.log(`   • ${e}`);
  }
}
if (failed > 0) {
  console.error(`\n${failed} problema(s). El build no se publica.`);
  process.exit(1);
}
console.log("\nTodos los chequeos pasaron.");
```

- [ ] **Step 5: Tests en verde**

Run: `npm test 2>&1 | tail -6`
Expected: `8 passed`, 0 failed.

- [ ] **Step 6: Conectar al build**

En `package.json` cambiar:
```json
"build": "astro check && astro build && node scripts/check/index.mjs",
```

Run: `npm run build 2>&1 | tail -12`
Expected: los cuatro chequeos con ✔ y `Todos los chequeos pasaron.` Si `Reglas SEO` falla por `og:image apunta a un archivo inexistente` (`/og/default.jpg` todavía no existe): crear un placeholder temporal con `mkdir -p public/og && cp src/assets/hero-mower.jpg public/og/default.jpg` (la Parte 3 lo reemplaza por la imagen definitiva) y volver a correr.

- [ ] **Step 7: Commit**

```bash
git add scripts/check tests/checks.test.ts tests/fixtures package.json public/og
git commit -m "feat: chequeos de build (palabra prohibida, links, SEO, peso) integrados a npm run build

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
```

Expected tras el push: Vercel construye la rama `astro` y publica un preview con la página provisoria. Anotar la URL del preview (panel de Vercel → Deployments → rama `astro`).

---

## Fin de la Parte 1

Al terminar: `npm test` → 8 archivos en verde; `npm run build` → sitio mínimo con layout, 404 en español, sitemap, robots, chequeos verdes; preview en Vercel. Continuar con `docs/superpowers/plans/2026-09-03-migracion-astro-parte-2-paginas.md`.
