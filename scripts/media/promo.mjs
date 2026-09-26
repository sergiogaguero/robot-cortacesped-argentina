// Renderiza la animación promocional para redes (scripts/media/promo/promo.html) a MP4 vertical.
// Uso: node scripts/media/promo.mjs  →  media/promo/promo-terramow-9x16.mp4
// Necesita Playwright con Chromium (npx playwright install chromium si no está).
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ffmpegPath from "ffmpeg-static";

const FPS = 30;
const W = 1080;
const H = 1920;
const VIDEO = "media/hero-original.mp4";
const PAGE = "scripts/media/promo/promo.html";
const OUT_DIR = "media/promo";
const OUT = `${OUT_DIR}/promo-terramow-9x16.mp4`;

async function loadChromium() {
  try {
    return (await import("playwright")).chromium;
  } catch {
    // Instalación global (p. ej. `npm i -g playwright`)
    const globalRoot = execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim();
    return createRequire(join(globalRoot, "noop.js"))("playwright").chromium;
  }
}

// 1. Cuadros del video real, recortados a 9:16.
const framesDir = mkdtempSync(join(tmpdir(), "promo-frames-"));
execFileSync(ffmpegPath, [
  "-y", "-hide_banner", "-loglevel", "error", "-i", VIDEO,
  "-vf", `fps=${FPS},scale=-2:${H}:flags=lanczos,crop=${W}:${H}`,
  "-q:v", "2", join(framesDir, "%04d.jpg"),
]);
const videoFrames = readdirSync(framesDir).sort().map((f) => pathToFileURL(join(framesDir, f)).href);

// 2. Composición cuadro por cuadro con Chromium, directo a ffmpeg.
const chromium = await loadChromium();
const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(PAGE)).href);
await page.evaluate((frames) => { window.VIDEO_FRAMES = frames; }, videoFrames);
await page.evaluate(() => document.fonts.ready);
const duration = await page.evaluate(() => window.DURATION);
const total = Math.round(duration * FPS);

mkdirSync(OUT_DIR, { recursive: true });
const enc = spawn(ffmpegPath, [
  "-y", "-hide_banner", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
  // Pista de audio muda: Instagram/TikTok aceptan mejor un MP4 con audio y así se le puede
  // poner música desde la app.
  "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
  "-shortest", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
  "-profile:v", "high", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", OUT,
], { stdio: ["pipe", "inherit", "inherit"] });

for (let i = 0; i < total; i++) {
  await page.evaluate((t) => window.renderFrame(t), i / FPS);
  const buf = await page.screenshot({ type: "jpeg", quality: 95 });
  if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once("drain", r));
  if (i % FPS === 0) process.stdout.write(`\r${Math.round((i / total) * 100)}%`);
}
enc.stdin.end();
await new Promise((r, j) => enc.on("close", (c) => (c === 0 ? r() : j(new Error(`ffmpeg salió con ${c}`)))));
await browser.close();
rmSync(framesDir, { recursive: true, force: true });
console.log(`\r✔ ${OUT} (${duration}s, ${W}×${H}, ${FPS}fps)`);
