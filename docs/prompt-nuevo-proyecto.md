# Prompt para replicar el sistema de redes con otro producto

Copiá desde "INICIO DEL PROMPT" hasta el final y pegalo en una sesión nueva de Claude Code.
Antes de pegarlo, completá lo que está entre [corchetes].

---

INICIO DEL PROMPT

Quiero armar para **[NOMBRE DEL PRODUCTO / MARCA]** el mismo sistema de marketing en redes que ya tengo andando para mi otro negocio, en el repo `sergiogaguero/robot-cortacesped-argentina`. **Agregá ese repo a la sesión (add_repo, solo lectura) y usalo como referencia:** copiá y adaptá el código en lugar de escribirlo desde cero.

## Datos del nuevo proyecto

- Repo de trabajo: `[usuario/repo-nuevo]` (si no existe el sitio, el repo va a tener solo la parte de redes)
- Sitio web: [URL] (si hay que armarlo, decímelo y lo hacemos también)
- Web del fabricante, para sacar fotos, videos y datos: [URL]
- Rubro y público: [qué vendo, a quién y dónde; por ejemplo, Argentina, en español rioplatense con voseo]
- Productos, precios y variantes: [lista]
- Cuenta de Instagram: [@usuario], página de Facebook: [nombre]
- WhatsApp de contacto: [número]
- Palabras o afirmaciones prohibidas: [por ejemplo, no decir "oficial" ni "distribuidor autorizado" si no lo somos]
- Materiales: te adjunto [videos o fotos propios]

## Reglas de trabajo

- Mergeá directo a master/main, sin pull requests.
- Commits en español y descriptivos.
- Nunca me pidas que pegue tokens en el chat ni en capturas; los secretos los cargo yo en GitHub.
- Hablame como un experto en marketing digital y CM: recomendá horarios, formatos, frecuencia, hooks y CTAs, y explicá por qué.
- Cuando me guíes por Meta o GitHub, hacelo paso a paso y con los nombres exactos de los botones, porque la interfaz de Meta cambia seguido.

## Qué hay que construir (todo existe en el repo de referencia)

### 1. Motor de videos y piezas (`scripts/media/`)

- **`lib/render.mjs`**: Playwright (Chromium) renderiza HTML cuadro a cuadro a 30 fps en 1080×1920, lo pasa por pipe a ffmpeg-static (x264 CRF 18 + AAC) y, si no hay música, agrega una pista de audio muda. También extrae y recorta a 9:16 los cuadros de videos reales.
- **`reels/engine.html` + `reels.mjs`**: un motor de plantillas donde cada pieza es un guion JSON de escenas:
  - campos de escena: `dur`, `cut`, `bg` (clip/imagen/estilo, con `from`, `speed`, `focus`, `zoom`), `shade`, `align`, `product` y elementos en `top`/`center`/`bottom`;
  - tipos de elemento: eyebrow, title, lead, note, pill, mega, logo, photo, chips, ticks, counter, bars, table, qa, step, rotator, wa, trust;
  - salidas:
    - reels MP4 en `public/redes/reels`;
    - historias JPG o MP4 en `public/redes/historias`;
    - carruseles de 1080×1350 en `public/redes/carruseles/<nombre>/NN.jpg`;
  - soporta `--preview`.
- **`musica.mjs`**: música original sintetizada (estilos luminoso, chill, groove y épico, con el compás anclado al "drop" y loudnorm a -14 LUFS). La música de Instagram no se puede usar por API, así que cada reel lleva su pista propia (campo `audio` del guion).
- **`promo.mjs` + `promo/*.html`**: animaciones promocionales sueltas.
- **Clips propios**: comprimidos a 1080×1920 con CRF 27 en `media/clips/<nombre>.mp4`, y usables como fondo por nombre.

Cambiá la marca, los colores, las tipografías, el logo y el tono al del nuevo producto.

### 2. Contenido para las primeras 2 semanas

- Unos 16 reels: unboxing, beneficios, "ganar tiempo de vida", comparativas, POV, tips, mitos, preguntas frecuentes y los videos propios.
- Unas 20 historias: encuestas, preguntas, cuentas regresivas y la versión historia de cada reel.
- 5 carruseles: mitos, checklist, tecnologías, mantenimiento y quiénes somos.
- Tips útiles del rubro, no solo venta.
- Captions con hook, CTA a WhatsApp y hashtags locales.

### 3. Publicación automática (`scripts/social/publish.mjs` + `.github/workflows/redes.yml`)

- **`social/calendario.json`**: `{ baseUrl, facebook: true, posts: [{ id, when (ISO con zona -03:00), type: reel|story|carousel, file|files, caption, auto: true }] }`. Los archivos se sirven desde el sitio publicado (`baseUrl`).
- **Instagram Graph API v23**: crear el contenedor (REELS, STORIES o CAROUSEL con hijos `is_carousel_item`), esperar a que `status_code` quede listo y después `media_publish`.
- **Facebook Page API**:
  - reels y historias de video: `video_reels` / `video_stories`, en tres pasos (start → rupload con `file_url` → finish);
  - historias de foto: `photos` con `published=false` y después `photo_stories`;
  - carruseles: feed con `attached_media`.
  - Un error de Facebook sale como `::warning::` y no hace fallar la corrida.
- **GitHub Actions**:
  - cron `"7,37 * * * *"`, más `workflow_dispatch` con `dry_run` (`--dry-run --check`);
  - lo ya publicado se guarda en `social/.estado.json`, dentro de la caché de Actions, no en commits, para no disparar deploys;
  - una pieza cuenta como pendiente si le falta `.publicado`;
  - se publica con hasta 6 h de atraso (`MAX_ATRASO_HS`), porque GitHub demora el cron entre 20 y 80 minutos;
  - cada corrida imprime `ESTADO_JSON {...}` y una tabla en el resumen.
- **Secretos**: `IG_USER_ID` e `IG_ACCESS_TOKEN`.

### 4. Centro de redes (app de control como artifact)

- `scripts/social/centro/template.html` + `build.mjs` arman `.centro/centro-redes.html`:
  - el calendario, con un preview de cada pieza (videos a 540 px con audio a 96 kbps);
  - el estado de cada publicación en Instagram y Facebook;
  - la salud del sistema y un changelog.
- Los datos salen de `social/centro.json` (`estado`, `syncedAt`, `health`, `changelog`).
- Se publica como Artifact con la capacidad **comments**: yo comento en una pieza ("[id] agregale música") y vos aplicás el cambio, rerenderizás, pusheás a master, actualizás el changelog, republicás, me respondés en el hilo y lo resolvés.
- Documentá todo en `docs/redes.md`, igual que en el repo de referencia (secciones "Sincronizar el estado" y "Atender un pedido").

### 5. Rutina de sincronización

- Creá una rutina (trigger) en esta misma sesión con cron `CRON_TZ=America/Argentina/Buenos_Aires 7 12,21 * * *`.
- En cada disparo tiene que:
  1. leer la última corrida completada de redes.yml (línea `ESTADO_JSON` del job publicar);
  2. actualizar `centro.json`, rearmar y republicar el artifact, y pushear a master.
- Avisos:
  - si falló o no salió alguna publicación de Instagram, mandame una notificación push con cuál, por qué y la solución;
  - si todo salió bien, no me escribas;
  - cuando se termine el calendario, ofrecé armar las 2 semanas siguientes.

### 6. SEO y búsqueda con IA (si hay sitio)

- JSON-LD: Organization, WebSite, Product/AggregateOffer, BlogPosting, FAQPage, AboutPage, ItemList y HowTo.
- `robots.txt` que habilite explícitamente a los bots de IA (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, meta-externalagent).
- `llms.txt` y `llms-full.txt`.
- Páginas de preguntas frecuentes y de nosotros, un recuadro "En resumen" en las guías y guías de compra con tablas.
- Si hay varias marcas, que el sitio sea multimarca desde el principio: productos con `brand`, `variants` y `draft`.

## Configuración de Meta y GitHub (guiame en esto)

1. **Cuentas**: Instagram profesional (empresa) vinculada a la página de Facebook, desde el Centro de cuentas o Business Suite, no desde "Editar perfil".
2. **Business Manager → Usuarios del sistema**: crear el usuario "publicador" con rol **Empleado**. El rol Administrador suele quedar bloqueado por la regla de los 7 días. Asignarle la página y la cuenta de Instagram con control total.
3. **developers.facebook.com → Crear app**: tipo empresa, vinculada al portfolio. Agregar los casos de uso de Instagram (API con inicio de sesión de Facebook) **y "Administrar todo en tu página"**. Hacer al usuario del sistema administrador de la app.
4. **Generar el token del usuario del sistema** (que no vence) con estos permisos:
   - `instagram_basic`, `instagram_content_publish`;
   - `pages_show_list`, `pages_read_engagement`, **`pages_manage_posts`**;
   - `business_management`.

   Sin `pages_manage_posts`, Instagram anda pero Facebook falla con "(#200) … lack of pages_manage_posts" o "(#3) granular permission". Ese fue el error que tuvimos en el proyecto anterior.
5. **Sacar el IG_USER_ID**: el id de la cuenta de Instagram empresarial, en `GET /me/accounts?fields=instagram_business_account`.
6. **GitHub → Settings → Secrets and variables → Actions**: cargar `IG_USER_ID` e `IG_ACCESS_TOKEN`. Revisá bien el nombre; en el proyecto anterior se escribió `ID_USER_ID` por error.
7. **Probar**: correr el workflow "Redes" con `dry_run` activado, revisar el resumen y recién después dejar que publique solo.

## Errores que ya resolvimos (evitalos)

- Una entrada con error en `.estado.json` no significa que la pieza se publicó: chequeá `.publicado`.
- Las fechas van en hora argentina (-03:00). Confirmá qué día es antes de programar "mañana".
- El cron de GitHub solo corre desde la rama principal, así que el workflow tiene que estar en master.
- Los archivos tienen que estar publicados en el sitio antes de que llegue su hora, porque Meta los descarga desde una URL pública.
- Si Vercel u otro host bloquea las descargas de Meta, probá las URLs con curl.

## Orden sugerido

1. Leé el repo de referencia (sobre todo `docs/redes.md`, `scripts/media/` y `scripts/social/`) y el sitio del nuevo producto.
2. Proponeme la estrategia de contenido y el calendario de 2 semanas como experto en CM.
3. Armá el motor y las piezas, y mandame previews.
4. Configurá la publicación automática, guiándome con Meta y GitHub.
5. Publicá el Centro de redes y creá la rutina de sincronización.
6. Seguí con SEO, guías y lo que falte.

FIN DEL PROMPT
