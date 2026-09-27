// Arma el Centro de redes: la página (artifact de claude.ai) que muestra el calendario con vistas
// previas, el estado de cada publicación en Instagram y Facebook, y deja pedirle cambios a Claude.
//
//   node scripts/social/centro/build.mjs [salida]   (por defecto .centro/)
//
// Lee social/calendario.json, los guiones (para los títulos) y social/centro.json (estado
// sincronizado desde GitHub Actions, salud del sistema e historial de cambios). Genera
// <salida>/centro-redes.html y las vistas previas livianas en <salida>/p/ (videos a 540 px).
// Claude la publica con el tool Artifact y la vuelve a publicar cada vez que algo cambia.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import ffmpegPath from "ffmpeg-static";

const OUT = process.argv[2] ?? ".centro";
const cal = JSON.parse(readFileSync("social/calendario.json", "utf8"));
const meta = JSON.parse(readFileSync("social/centro.json", "utf8"));
const estado = meta.estado ?? {};
const EXTRA = { tiempo: "Video: el tiempo que te devuelve", terramow: "Video: presentación del V1000" };
const SRC = { reels: "videos", historias: "historias", carruseles: "carruseles" };

function titulo(p, file) {
  const [kind, name] = file.split("/");
  const slug = name.replace(/\.\w+$/, "");
  if (kind === "extra") return EXTRA[slug] ?? slug;
  const t = JSON.parse(readFileSync(`scripts/media/reels/${SRC[kind]}/${slug}.json`, "utf8")).title;
  return p.type === "story" && kind === "reels" ? `El reel en historias: ${t}` : t;
}

// Vista previa liviana, solo si falta o el original es más nuevo.
function preview(file) {
  const src = join("public/redes", file);
  const dst = join(OUT, "p", file);
  const stale = !existsSync(dst) || statSync(dst).mtimeMs < statSync(src).mtimeMs;
  mkdirSync(dirname(dst), { recursive: true });
  const ff = (...a) => execFileSync(ffmpegPath, ["-y", "-hide_banner", "-loglevel", "error", ...a]);
  if (file.endsWith(".mp4")) {
    const poster = dst.replace(/\.mp4$/, ".jpg");
    if (stale) {
      ff("-i", src, "-vf", "scale=540:-2", "-c:v", "libx264", "-crf", "27", "-preset", "veryfast", "-an", "-movflags", "+faststart", dst);
      ff("-ss", "1.3", "-i", src, "-frames:v", "1", "-vf", "scale=270:-2", "-q:v", "4", poster);
    }
    return { media: `p/${file}`, thumb: `p/${file.replace(/\.mp4$/, ".jpg")}` };
  }
  if (stale) ff("-i", src, "-vf", "scale=540:-2", "-q:v", "4", dst);
  return { media: `p/${file}`, thumb: `p/${file}` };
}

const posts = cal.posts.map((p) => {
  const files = p.files ?? [p.file];
  const prev = files.map(preview);
  return {
    id: p.id,
    when: p.when,
    type: p.type,
    title: titulo(p, files[0]),
    caption: p.caption ?? "",
    media: prev.map((x) => x.media),
    thumb: prev[0].thumb,
    facebook: cal.facebook !== false && p.facebook !== false,
    status: { ig: estado[p.id] ?? {}, fb: estado[`${p.id}#fb`] ?? {} },
  };
});

const data = { syncedAt: meta.syncedAt, health: meta.health, changelog: meta.changelog, posts };
const template = readFileSync(new URL("./template.html", import.meta.url), "utf8");
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "centro-redes.html"), template.replace("__DATA__", () => JSON.stringify(data)));
console.log(`✔ ${join(OUT, "centro-redes.html")} (${posts.length} publicaciones)`);
