// Piezas comunes para renderizar animaciones HTML a video con Chromium + ffmpeg.
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ffmpegPath from "ffmpeg-static";

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export async function loadChromium() {
  try {
    return (await import("playwright")).chromium;
  } catch {
    // Instalación global (p. ej. `npm i -g playwright`)
    const globalRoot = execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim();
    return createRequire(join(globalRoot, "noop.js"))("playwright").chromium;
  }
}

/**
 * Extrae todos los cuadros de un video a JPG en una carpeta temporal y devuelve sus URLs file://.
 * `crop: true` recorta al centro a 1080×1920; si no, escala a 1920 de alto y deja el ancho
 * (la composición elige el encuadre con object-position).
 */
export function extractFrames(video, { crop = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "frames-"));
  const vf = crop ? `fps=${FPS},scale=-2:${H}:flags=lanczos,crop=${W}:${H}` : `fps=${FPS},scale=-2:${H}:flags=lanczos`;
  execFileSync(ffmpegPath, ["-y", "-hide_banner", "-loglevel", "error", "-i", video, "-vf", vf, "-q:v", "2", join(dir, "%04d.jpg")]);
  const frames = readdirSync(dir).sort().map((f) => pathToFileURL(join(dir, f)).href);
  return { frames, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/**
 * Abre un encoder ffmpeg que recibe JPEGs por stdin. Agrega una pista de audio: la música
 * indicada o, si no hay, silencio (Instagram/TikTok aceptan mejor un MP4 con audio).
 */
export function openEncoder(out, { audio } = {}) {
  const audioIn = audio ? ["-stream_loop", "-1", "-i", audio] : ["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"];
  const enc = spawn(ffmpegPath, [
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    ...audioIn,
    "-shortest", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
    "-profile:v", "high", "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart", out,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  return {
    async write(buf) {
      if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once("drain", r));
    },
    close() {
      enc.stdin.end();
      return new Promise((r, j) => enc.on("close", (c) => (c === 0 ? r() : j(new Error(`ffmpeg salió con ${c}`)))));
    },
  };
}

/** Llama a window.renderFrame(t) cuadro por cuadro y manda cada captura al encoder. */
export async function renderToVideo(page, duration, out, opts) {
  const enc = openEncoder(out, opts);
  const total = Math.round(duration * FPS);
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.renderFrame(t), i / FPS);
    await enc.write(await page.screenshot({ type: "jpeg", quality: 95 }));
    if (i % FPS === 0) process.stdout.write(`\r  ${Math.round((i / total) * 100)}%`);
  }
  await enc.close();
  process.stdout.write("\r");
}
