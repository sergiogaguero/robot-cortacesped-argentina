// Renderiza los reels y las historias de la serie para redes a partir de sus guiones JSON.
//
//   node scripts/media/reels.mjs                  → todos
//   node scripts/media/reels.mjs 03-mulching      → uno (o varios) por nombre
//   node scripts/media/reels.mjs --preview <dir>  → en vez de video, un JPG por escena (para revisar)
//
// Guiones: scripts/media/reels/videos/*.json (reels), historias/*.json (historias) y
// carruseles/*.json (una lámina por escena).
// Salida:  public/redes/reels/<nombre>.mp4, public/redes/historias/<nombre>.jpg|mp4 y
// public/redes/carruseles/<nombre>/01.jpg, 02.jpg… — se publican con
// el sitio para que la automatización de Instagram (scripts/social/publish.mjs) los tome por URL.
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { H, W, extractFrames, loadChromium, renderToVideo } from "./lib/render.mjs";

// Videos fuente que pueden usar los guiones ("bg": { "clip": "<nombre>" }). Cualquier otro nombre se
// busca en media/clips/<nombre>.mp4 (ahí van los videos propios: entregas, clientes, antes/después).
const CLIPS = {
  comercial: "media/terramow-comercial.mp4", // comercial de TerraMow (caja, encendido, corte en primer plano)
  hero: "media/hero-original.mp4", // robot real en el jardín (el video de la portada del sitio)
};
const clipPath = (name) => CLIPS[name] ?? (existsSync(`media/clips/${name}.mp4`) ? `media/clips/${name}.mp4` : null);
const DIRS = [
  { src: "scripts/media/reels/videos", out: "public/redes/reels", still: false },
  { src: "scripts/media/reels/historias", out: "public/redes/historias", still: true },
  { src: "scripts/media/reels/carruseles", out: "public/redes/carruseles", carousel: true },
];
const ENGINE = "scripts/media/reels/engine.html";

const args = process.argv.slice(2);
const previewAt = args.indexOf("--preview");
const previewDir = previewAt >= 0 ? args.splice(previewAt, 2)[1] : null;
const only = new Set(args);

const jobs = DIRS.filter((d) => existsSync(d.src)).flatMap((d) =>
  readdirSync(d.src)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ ...d, name: basename(f, ".json"), script: JSON.parse(readFileSync(join(d.src, f), "utf8")) }))
    .filter((j) => only.size === 0 || only.has(j.name)),
);
if (jobs.length === 0) {
  console.error(`No hay guiones que coincidan con: ${[...only].join(", ")}`);
  process.exit(1);
}

// Solo se extraen los cuadros de los videos que usan los guiones elegidos.
const used = new Set(jobs.flatMap((j) => j.script.scenes.map((s) => s.bg?.clip).filter(Boolean)));
const clipFrames = {};
const cleanups = [];
for (const name of used) {
  if (!clipPath(name)) throw new Error(`Clip desconocido "${name}": no está en CLIPS ni en media/clips/${name}.mp4`);
  const { frames, cleanup } = extractFrames(clipPath(name));
  clipFrames[name] = frames;
  cleanups.push(cleanup);
}

const chromium = await loadChromium();
const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

for (const job of jobs) {
  const [w, hgt] = job.script.size || [W, H];
  await page.setViewportSize({ width: w, height: hgt });
  await page.goto(pathToFileURL(resolve(ENGINE)).href);
  const duration = await page.evaluate(([s, c]) => window.load(s, c), [job.script, clipFrames]);

  if (previewDir) {
    mkdirSync(previewDir, { recursive: true });
    let t = 0;
    for (const [i, s] of job.script.scenes.entries()) {
      // Momento en que ya entró todo lo de la escena (o el final, si es corta)
      await page.evaluate((x) => window.renderFrame(x), t + Math.max(0.1, s.dur - 0.05));
      await page.screenshot({ path: join(previewDir, `${job.name}-${i + 1}.jpg`), type: "jpeg", quality: 70 });
      t += s.dur;
    }
    console.log(`✔ vista previa ${job.name} (${job.script.scenes.length} escenas)`);
    continue;
  }

  mkdirSync(job.out, { recursive: true });
  if (job.carousel) {
    // Una lámina JPG por escena, en su momento final (con todo ya en pantalla).
    const dir = join(job.out, job.name);
    mkdirSync(dir, { recursive: true });
    let t = 0;
    for (const [i, s] of job.script.scenes.entries()) {
      t += s.dur;
      await page.evaluate((x) => window.renderFrame(x), t - 0.01);
      await page.screenshot({ path: join(dir, `${String(i + 1).padStart(2, "0")}.jpg`), type: "jpeg", quality: 92 });
    }
    console.log(`✔ ${dir}/ (${job.script.scenes.length} láminas)`);
  } else if (job.still && job.script.format !== "video") {
    // JPG: la API de Instagram solo acepta JPEG para historias con imagen.
    const out = join(job.out, `${job.name}.jpg`);
    await page.evaluate((x) => window.renderFrame(x), duration - 0.01);
    await page.screenshot({ path: out, type: "jpeg", quality: 92 });
    console.log(`✔ ${out}`);
  } else {
    const out = join(job.out, `${job.name}.mp4`);
    const audio = job.script.audio && existsSync(job.script.audio) ? job.script.audio : undefined;
    await renderToVideo(page, duration, out, { audio });
    console.log(`✔ ${out} (${duration.toFixed(1)}s${audio ? ", con música" : ""})`);
  }
}

await browser.close();
for (const c of cleanups) c();
