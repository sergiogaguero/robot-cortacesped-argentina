// Publica en Instagram (y en la página de Facebook) los reels, historias y carruseles del calendario
// (social/calendario.json) cuando les llega la hora. Pensado para correr cada 30 minutos desde
// GitHub Actions (.github/workflows/redes.yml).
//
//   node scripts/social/publish.mjs                → publica lo que corresponda ahora
//   node scripts/social/publish.mjs --dry-run      → solo muestra qué publicaría
//   node scripts/social/publish.mjs --now 2026-09-28T19:40:00-03:00 --dry-run   → simula otra hora
//   node scripts/social/publish.mjs --check        → verifica el token y que los archivos estén publicados
//
// Variables de entorno (secretos del repo en GitHub):
//   IG_USER_ID       ID de la cuenta profesional de Instagram (no es el @usuario)
//   IG_ACCESS_TOKEN  token del usuario del sistema (ver docs/redes.md). Para Facebook necesita además
//                    pages_manage_posts; sin ese permiso, Instagram sigue publicando y Facebook avisa.
//
// Guarda lo ya publicado en social/.estado.json (en Actions vive en la caché, no se commitea), así
// una publicación nunca sale dos veces: la clave es el id del post (Instagram) o "<id>#fb" (Facebook).
// Si una corrida se pierde, la siguiente la recupera, siempre que no hayan pasado más de
// MAX_ATRASO_HS: pasado ese margen se saltea en vez de salir a destiempo.
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const VERSION = process.env.GRAPH_VERSION || "v23.0";
const GRAPH = `https://graph.facebook.com/${VERSION}`;
const RUPLOAD = `https://rupload.facebook.com/video-upload/${VERSION}`;
const CALENDARIO = "social/calendario.json";
const ESTADO = "social/.estado.json";
const MAX_ATRASO_HS = 6;
const ESPERA_MAX_MS = 10 * 60 * 1000;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const check = args.includes("--check");
const nowArg = args.indexOf("--now");
const now = nowArg >= 0 ? new Date(args[nowArg + 1]) : new Date();

const calendario = JSON.parse(readFileSync(CALENDARIO, "utf8"));
const { baseUrl, posts } = calendario;
const estado = existsSync(ESTADO) ? JSON.parse(readFileSync(ESTADO, "utf8")) : {};
const { IG_USER_ID, IG_ACCESS_TOKEN } = process.env;

const archivos = (p) => (p.files ?? [p.file]).map((f) => `${baseUrl}/${f}`);
const conFacebook = (p) => calendario.facebook !== false && p.facebook !== false;
const enVentana = (p) => {
  const when = new Date(p.when);
  return p.auto && when <= now && now - when <= MAX_ATRASO_HS * 3600 * 1000;
};
// Trabajos pendientes: cada post en cada red que todavía no salió.
const pendientes = posts.filter(enVentana).flatMap((p) => [
  ...(estado[p.id]?.publicado ? [] : [{ p, red: "instagram", key: p.id }]),
  ...(conFacebook(p) && !estado[`${p.id}#fb`]?.publicado ? [{ p, red: "facebook", key: `${p.id}#fb` }] : []),
]);

async function graph(method, path, params = {}, token = IG_ACCESS_TOKEN) {
  const body = new URLSearchParams({ ...params, access_token: token });
  const url = method === "GET" ? `${GRAPH}/${path}?${body}` : `${GRAPH}/${path}`;
  const res = await fetch(url, method === "GET" ? {} : { method, body });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`${path}: ${json.error?.message ?? res.status}`);
  return json;
}

// Instagram y Facebook bajan los archivos desde el sitio: si todavía no están publicados, avisar claro.
async function verificarArchivos(p) {
  for (const url of archivos(p)) {
    const head = await fetch(url, { method: "HEAD" });
    if (!head.ok) throw new Error(`${url} responde ${head.status}: ¿está publicado el sitio con public/redes/?`);
  }
}

// ——— Instagram ———
async function esperarContenedor(id, nombre) {
  const inicio = Date.now();
  for (;;) {
    const { status_code: status } = await graph("GET", id, { fields: "status_code" });
    if (status === "FINISHED") return;
    if (status === "ERROR" || status === "EXPIRED") throw new Error(`Instagram rechazó ${nombre} (${status})`);
    if (Date.now() - inicio > ESPERA_MAX_MS) throw new Error(`${nombre} sigue procesándose después de 10 min`);
    await new Promise((r) => setTimeout(r, 10_000));
  }
}

async function publicarInstagram(p) {
  const [url, ...resto] = archivos(p);
  const esVideo = url.endsWith(".mp4");
  let params;
  if (p.type === "carousel") {
    const hijos = [];
    for (const u of [url, ...resto]) {
      const { id } = await graph("POST", `${IG_USER_ID}/media`, { image_url: u, is_carousel_item: "true" });
      await esperarContenedor(id, u);
      hijos.push(id);
    }
    params = { media_type: "CAROUSEL", children: hijos.join(","), caption: p.caption ?? "" };
  } else if (p.type === "reel") {
    params = { media_type: "REELS", video_url: url, caption: p.caption ?? "", share_to_feed: "true" };
  } else {
    params = { media_type: "STORIES", ...(esVideo ? { video_url: url } : { image_url: url }) };
  }
  const { id: creationId } = await graph("POST", `${IG_USER_ID}/media`, params);
  await esperarContenedor(creationId, p.id);
  const { id } = await graph("POST", `${IG_USER_ID}/media_publish`, { creation_id: creationId });
  return id;
}

// ——— Facebook (la página vinculada a la cuenta de Instagram) ———
let pagina;
async function paginaFacebook() {
  if (pagina !== undefined) return pagina;
  const { data } = await graph("GET", "me/accounts", { fields: "id,name,access_token,instagram_business_account" });
  pagina = data.find((pg) => pg.instagram_business_account?.id === IG_USER_ID) ?? null;
  if (!pagina) throw new Error("no encuentro la página de Facebook vinculada a esta cuenta de Instagram");
  return pagina;
}

// Videos: se crea la subida, Facebook baja el archivo desde la URL y se cierra la subida.
async function subirVideo(pg, edge, url, finish) {
  const { video_id: videoId, upload_url: uploadUrl } = await graph("POST", `${pg.id}/${edge}`, { upload_phase: "start" }, pg.access_token);
  const res = await fetch(uploadUrl ?? `${RUPLOAD}/${videoId}`, {
    method: "POST",
    headers: { Authorization: `OAuth ${pg.access_token}`, file_url: url },
  });
  const up = await res.json().catch(() => ({}));
  if (!res.ok || up.error) throw new Error(`subida de ${url}: ${up.error?.message ?? up.debug_info?.message ?? res.status}`);
  const fin = await graph("POST", `${pg.id}/${edge}`, { upload_phase: "finish", video_id: videoId, ...finish }, pg.access_token);
  return fin.post_id ?? videoId;
}

async function fotoSinPublicar(pg, url) {
  const { id } = await graph("POST", `${pg.id}/photos`, { url, published: "false" }, pg.access_token);
  return id;
}

async function publicarFacebook(p) {
  const pg = await paginaFacebook();
  const urls = archivos(p);
  if (p.type === "reel") return subirVideo(pg, "video_reels", urls[0], { video_state: "PUBLISHED", description: p.caption ?? "" });
  if (p.type === "carousel") {
    const ids = [];
    for (const u of urls) ids.push(await fotoSinPublicar(pg, u));
    const media = Object.fromEntries(ids.map((id, i) => [`attached_media[${i}]`, JSON.stringify({ media_fbid: id })]));
    const { id } = await graph("POST", `${pg.id}/feed`, { message: p.caption ?? "", ...media }, pg.access_token);
    return id;
  }
  if (urls[0].endsWith(".mp4")) return subirVideo(pg, "video_stories", urls[0], {});
  const photoId = await fotoSinPublicar(pg, urls[0]);
  const { post_id: id } = await graph("POST", `${pg.id}/photo_stories`, { photo_id: photoId }, pg.access_token);
  return id;
}

// Prueba de configuración: el token sirve, la cuenta es la correcta y el sitio sirve los archivos.
async function verificar() {
  if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
    console.error("✖ Faltan los secretos IG_USER_ID o IG_ACCESS_TOKEN. Ver docs/redes.md.");
    process.exit(1);
  }
  try {
    const { username } = await graph("GET", IG_USER_ID, { fields: "username" });
    console.log(`✔ Conectado a Instagram como @${username}`);
  } catch (e) {
    console.error(`✖ Instagram no acepta el token o el ID: ${e.message}`);
    process.exit(1);
  }
  if (calendario.facebook !== false) {
    try {
      const pg = await paginaFacebook();
      const { data } = await graph("GET", "me/permissions").catch(() => ({ data: [] }));
      const puede = data.some((x) => x.permission === "pages_manage_posts" && x.status === "granted");
      console.log(`✔ Página de Facebook: ${pg.name}${puede ? "" : " (⚠ falta el permiso pages_manage_posts para publicar ahí)"}`);
    } catch (e) {
      console.log(`⚠ Facebook: ${e.message}. Instagram publica igual.`);
    }
  }
  const proximo = posts.find((p) => new Date(p.when) > now) ?? posts.at(-1);
  try {
    await verificarArchivos(proximo);
  } catch (e) {
    console.error(`✖ ${e.message}`);
    process.exit(1);
  }
  console.log(`✔ Archivos publicados (${archivos(proximo)[0]})`);
  console.log(`  Próxima publicación: ${proximo.id} (${proximo.when})`);
}

if (check) await verificar();
if (pendientes.length === 0) {
  console.log(`Nada para publicar (${now.toISOString()}).`);
  resumen();
  process.exit(0);
}
if (!dryRun && (!IG_USER_ID || !IG_ACCESS_TOKEN)) {
  console.error("Faltan IG_USER_ID o IG_ACCESS_TOKEN. Ver docs/redes.md.");
  process.exit(1);
}

let fallas = 0;
for (const { p, red, key } of pendientes) {
  if (dryRun) {
    console.log(`[dry-run] ${red} ${p.type} ${p.id} → ${archivos(p).join(", ")}`);
    continue;
  }
  try {
    await verificarArchivos(p);
    const mediaId = red === "instagram" ? await publicarInstagram(p) : await publicarFacebook(p);
    estado[key] = { mediaId, publicado: new Date().toISOString() };
    console.log(`✔ ${red} ${p.id} (${mediaId})`);
  } catch (e) {
    estado[key] = { ...estado[key], error: e.message, intento: new Date().toISOString() };
    delete estado[key].publicado;
    if (red === "instagram") {
      fallas++;
      console.error(`✖ instagram ${p.id}: ${e.message}`);
    } else {
      // Facebook es un extra: un error ahí no frena Instagram ni pone la corrida en rojo.
      console.log(`::warning::Facebook ${p.id}: ${e.message}`);
    }
  }
  writeFileSync(ESTADO, JSON.stringify(estado, null, 2));
}
resumen();
process.exit(fallas ? 1 : 0);

// Estado completo en una línea (lo lee la app de control) y una tabla en el resumen de la corrida.
function resumen() {
  console.log(`ESTADO_JSON ${JSON.stringify(estado)}`);
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (!file) return;
  const filas = posts
    .filter((p) => new Date(p.when) <= now)
    .map((p) => {
      const ig = estado[p.id]?.publicado ? "✅" : estado[p.id]?.error ? `❌ ${estado[p.id].error}` : "—";
      const fb = !conFacebook(p) ? "" : estado[`${p.id}#fb`]?.publicado ? "✅" : estado[`${p.id}#fb`]?.error ? `⚠️ ${estado[`${p.id}#fb`].error}` : "—";
      return `| ${p.when.slice(0, 16).replace("T", " ")} | ${p.type} | ${p.id} | ${ig} | ${fb} |`;
    });
  appendFileSync(file, ["| Fecha | Tipo | Publicación | Instagram | Facebook |", "|---|---|---|---|---|", ...filas, ""].join("\n"));
}
