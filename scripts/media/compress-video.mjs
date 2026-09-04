import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import ffmpegPath from "ffmpeg-static";

const INPUT = "media/hero-original.mp4";
const OUT_DIR = "public/videos";
const LIMIT = 600 * 1024;
const SECONDS = 10;
// El original es vertical (810x1080, 3:4): usar scale=1280:-2 lo escalaría
// hacia arriba. Mantenemos el ancho original (sin upscaling) y bajamos a 24fps.
const FILTER = "scale=-2:1080,fps=24";

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
