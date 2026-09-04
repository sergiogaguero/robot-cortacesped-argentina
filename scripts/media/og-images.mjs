import { mkdirSync, readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const W = 1200, H = 630;
const OUT = "public/og";
const FONT = "Segoe UI, Inter, Arial, sans-serif";
const RESVG_OPTS = { font: { loadSystemFonts: true, defaultFontFamily: "Segoe UI" } };
mkdirSync(OUT, { recursive: true });

const dataUri = async (file, width) => {
  const buf = await sharp(file).resize({ width, withoutEnlargement: true }).png().toBuffer();
  return `data:image/png;base64,${buf.toString("base64")}`;
};

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Mide el ancho real (en px) de una línea de texto renderizándola aparte y
// recortando los píxeles transparentes, para poder maquetar sin adivinar
// métricas de fuente (necesario porque el ancho de "Segoe UI" varía según
// el texto y no queremos que el título/subtítulo se solape con la foto).
async function measureWidth(text, fontSize, weight) {
  if (!text) return 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="${fontSize * 2}"><text x="0" y="${fontSize * 1.4}" font-family="${FONT}" font-size="${fontSize}" font-weight="${weight}">${escape(text)}</text></svg>`;
  const png = new Resvg(svg, RESVG_OPTS).render().asPng();
  // sharp(...).metadata() reads the *input's* metadata and ignores chained
  // operations (trim included) — must materialize via toBuffer to see the
  // post-trim size.
  const { info } = await sharp(png).trim().toBuffer({ resolveWithObject: true });
  return info.width ?? 0;
}

async function fitFontSize(text, maxWidth, startSize, weight) {
  let size = startSize;
  for (let i = 0; i < 6; i++) {
    const w = await measureWidth(text, size, weight);
    if (w <= maxWidth) return size;
    size = Math.max(28, Math.floor(size * (maxWidth / w) * 0.98));
  }
  return size;
}

async function wrapText(text, maxWidth, fontSize, weight) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const w = await measureWidth(candidate, fontSize, weight);
    if (w > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Columna de texto a la izquierda; la foto del producto vive en una columna
// fija a la derecha (x >= IMG_X) para que nunca se solapen: el título usa un
// tamaño de fuente que se achica si la línea es larga, y el subtítulo se
// envuelve en varias líneas, ambos acotados a TEXT_MAX_WIDTH.
const TEXT_X = 80;
const IMG_W = 380;
const IMG_X = W - IMG_W - 70;
const TEXT_MAX_WIDTH = IMG_X - TEXT_X - 40;

async function render(name, { lines, subtitle, image }) {
  const logo = await dataUri("src/assets/logo.png", 300);
  const picture = image ? await dataUri(image, IMG_W) : "";

  const titleSize = Math.min(...(await Promise.all(lines.map((l) => fitFontSize(l, TEXT_MAX_WIDTH, 66, 800)))));
  const titleLineHeight = Math.round(titleSize * 1.15);
  const titleTop = 260;
  const title = lines
    .map((l, i) => `<text x="${TEXT_X}" y="${titleTop + i * titleLineHeight}" font-family="${FONT}" font-size="${titleSize}" font-weight="800" fill="#f2f2f2">${escape(l)}</text>`)
    .join("");

  const subtitleSize = 28;
  const subtitleLines = await wrapText(subtitle, TEXT_MAX_WIDTH, subtitleSize, 400);
  const subtitleLineHeight = Math.round(subtitleSize * 1.3);
  const subtitleTop = titleTop + lines.length * titleLineHeight + 40;
  const subtitleSvg = subtitleLines
    .map((l, i) => `<text x="${TEXT_X}" y="${subtitleTop + i * subtitleLineHeight}" font-family="${FONT}" font-size="${subtitleSize}" fill="#a3a3a3">${escape(l)}</text>`)
    .join("");

  // La imagen ocupa la columna derecha, debajo del logo y por encima del
  // pie de página (no comparte fila con ningún texto).
  const imgY = 180;
  const imgH = Math.min(IMG_W, H - 70 - imgY);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g" cx="85%" cy="20%" r="70%"><stop offset="0" stop-color="#8fd014" stop-opacity="0.28"/><stop offset="1" stop-color="#0b0b0b" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0b0b0b"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0" y="0" width="12" height="${H}" fill="#8fd014"/>
  <image href="${logo}" x="${TEXT_X}" y="60" width="280" />
  ${picture ? `<image href="${picture}" x="${IMG_X}" y="${imgY}" width="${IMG_W}" height="${imgH}" preserveAspectRatio="xMidYMid meet" />` : ""}
  ${title}
  ${subtitleSvg}
  <text x="${TEXT_X}" y="${H - 60}" font-family="${FONT}" font-size="24" font-weight="600" fill="#8fd014">robotscortacesped.com.ar · Distribuidor autorizado de TerraMow</text>
</svg>`;
  const png = new Resvg(svg, { fitTo: { mode: "width", value: W }, ...RESVG_OPTS }).render().asPng();
  const out = `${OUT}/${name}.jpg`;
  await sharp(png).jpeg({ quality: 90, mozjpeg: true }).toFile(out);
  console.log(`${out}: ${Math.round(readFileSync(out).length / 1024)} KB (título ${titleSize}px, subtítulo ${subtitleLines.length} línea(s))`);
}

await render("default", { lines: ["Robot cortacésped", "con inteligencia artificial"], subtitle: "Sin cables perimetrales · Garantía y soporte local · Envíos a todo el país", image: "src/assets/hero-mower.jpg" });
await render("v600", { lines: ["TerraMow V600", "hasta 600 m²"], subtitle: "Navegación por cámara con IA · Sin cables ni RTK", image: "src/assets/products/v600.png" });
await render("v1000", { lines: ["TerraMow V1000", "hasta 1200 m²"], subtitle: "Navegación por cámara con IA · 150 min de autonomía", image: "src/assets/products/v1000.png" });
