// Renderiza una animación promocional para redes (scripts/media/promo/<nombre>.html) a MP4 vertical.
// Uso: node scripts/media/promo.mjs [nombre]  →  public/redes/extra/<nombre>.mp4
//   terramow (por defecto): presentación del producto
//   tiempo: el tiempo libre que devuelve el robot
// Los reels de la serie para redes usan otro motor: ver scripts/media/reels.mjs.
// Necesita Playwright con Chromium (npx playwright install chromium si no está).
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { H, W, FPS, extractFrames, loadChromium, renderToVideo } from "./lib/render.mjs";

const VIDEO = "media/hero-original.mp4";
const NAME = process.argv[2] ?? "terramow";
const PAGE = `scripts/media/promo/${NAME}.html`;
const OUT_DIR = "public/redes/extra";
const OUT = `${OUT_DIR}/${NAME}.mp4`;

// Cuadros del video real, recortados a 9:16.
const { frames, cleanup } = extractFrames(VIDEO, { crop: true });

const chromium = await loadChromium();
const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(PAGE)).href);
await page.evaluate((f) => { window.VIDEO_FRAMES = f; }, frames);
await page.evaluate(() => document.fonts.ready);
const duration = await page.evaluate(() => window.DURATION);

mkdirSync(OUT_DIR, { recursive: true });
await renderToVideo(page, duration, OUT);
await browser.close();
cleanup();
console.log(`✔ ${OUT} (${duration}s, ${W}×${H}, ${FPS}fps)`);
