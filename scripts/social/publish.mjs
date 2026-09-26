// Publica en Instagram los reels e historias del calendario (social/calendario.json) cuando les llega
// la hora. Pensado para correr cada 30 minutos desde GitHub Actions (.github/workflows/redes.yml).
//
//   node scripts/social/publish.mjs                → publica lo que corresponda ahora
//   node scripts/social/publish.mjs --dry-run      → solo muestra qué publicaría
//   node scripts/social/publish.mjs --now 2026-09-28T19:40:00-03:00 --dry-run   → simula otra hora
//
// Variables de entorno (secretos del repo en GitHub):
//   IG_USER_ID       ID de la cuenta profesional de Instagram (no es el @usuario)
//   IG_ACCESS_TOKEN  token con instagram_basic + instagram_content_publish (ver docs/redes.md)
//
// Guarda lo ya publicado en social/.estado.json (en Actions vive en la caché, no se commitea), así
// una publicación nunca sale dos veces. Si una corrida se pierde, la siguiente la recupera, siempre
// que no hayan pasado más de MAX_ATRASO_HS: pasado ese margen se saltea en vez de salir a destiempo.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_VERSION || "v23.0"}`;
const CALENDARIO = "social/calendario.json";
const ESTADO = "social/.estado.json";
const MAX_ATRASO_HS = 6;
const ESPERA_MAX_MS = 10 * 60 * 1000;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const nowArg = args.indexOf("--now");
const now = nowArg >= 0 ? new Date(args[nowArg + 1]) : new Date();

const { baseUrl, posts } = JSON.parse(readFileSync(CALENDARIO, "utf8"));
const estado = existsSync(ESTADO) ? JSON.parse(readFileSync(ESTADO, "utf8")) : {};

const pendientes = posts.filter((p) => {
  if (!p.auto || estado[p.id]) return false;
  const when = new Date(p.when);
  return when <= now && now - when <= MAX_ATRASO_HS * 3600 * 1000;
});

const { IG_USER_ID, IG_ACCESS_TOKEN } = process.env;
if (pendientes.length === 0) {
  console.log(`Nada para publicar (${now.toISOString()}).`);
  process.exit(0);
}
if (!dryRun && (!IG_USER_ID || !IG_ACCESS_TOKEN)) {
  console.error("Faltan IG_USER_ID o IG_ACCESS_TOKEN. Ver docs/redes.md.");
  process.exit(1);
}

async function graph(method, path, params = {}) {
  const body = new URLSearchParams({ ...params, access_token: IG_ACCESS_TOKEN });
  const url = method === "GET" ? `${GRAPH}/${path}?${body}` : `${GRAPH}/${path}`;
  const res = await fetch(url, method === "GET" ? {} : { method, body });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`${path}: ${json.error?.message ?? res.status}`);
  return json;
}

async function publicar(p) {
  const url = `${baseUrl}/${p.file}`;
  // Instagram baja el archivo desde el sitio: si todavía no está publicado, avisar claro.
  const head = await fetch(url, { method: "HEAD" });
  if (!head.ok) throw new Error(`${url} responde ${head.status}: ¿está publicado el sitio con public/redes/?`);

  const esVideo = p.file.endsWith(".mp4");
  const params =
    p.type === "reel"
      ? { media_type: "REELS", video_url: url, caption: p.caption ?? "", share_to_feed: "true" }
      : { media_type: "STORIES", ...(esVideo ? { video_url: url } : { image_url: url }) };
  const { id: creationId } = await graph("POST", `${IG_USER_ID}/media`, params);

  // Instagram procesa el video antes de dejar publicarlo.
  const inicio = Date.now();
  for (;;) {
    const { status_code: status } = await graph("GET", creationId, { fields: "status_code" });
    if (status === "FINISHED") break;
    if (status === "ERROR" || status === "EXPIRED") throw new Error(`Instagram rechazó ${p.file} (${status})`);
    if (Date.now() - inicio > ESPERA_MAX_MS) throw new Error(`${p.file} sigue procesándose después de 10 min`);
    await new Promise((r) => setTimeout(r, 10_000));
  }
  const { id: mediaId } = await graph("POST", `${IG_USER_ID}/media_publish`, { creation_id: creationId });
  return mediaId;
}

let fallas = 0;
for (const p of pendientes) {
  if (dryRun) {
    console.log(`[dry-run] ${p.type} ${p.id} → ${baseUrl}/${p.file}`);
    continue;
  }
  try {
    const mediaId = await publicar(p);
    estado[p.id] = { mediaId, publicado: new Date().toISOString() };
    writeFileSync(ESTADO, JSON.stringify(estado, null, 2));
    console.log(`✔ ${p.id} (media ${mediaId})`);
  } catch (e) {
    fallas++;
    console.error(`✖ ${p.id}: ${e.message}`);
  }
}
process.exit(fallas ? 1 : 0);
