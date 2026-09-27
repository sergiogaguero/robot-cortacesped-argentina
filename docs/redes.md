# Redes: reels, historias y publicación automática

Todo lo que sale en Instagram está en el repo:

| Qué | Dónde |
|---|---|
| Guiones de los reels | `scripts/media/reels/videos/*.json` |
| Guiones de las historias | `scripts/media/reels/historias/*.json` |
| Guiones de los carruseles (feed, 1080×1350) | `scripts/media/reels/carruseles/*.json` — una lámina por escena |
| Videos propios (entregas, clientes) | `media/clips/<nombre>.mp4` → se usan como `"clip": "<nombre>"` |
| Motor que los anima | `scripts/media/reels/engine.html` |
| Videos e imágenes listos | `public/redes/` (se publican con el sitio en `/redes/…`) |
| Calendario (fecha, hora, texto) | `social/calendario.json` |
| Publicador | `scripts/social/publish.mjs` + `.github/workflows/redes.yml` |

## Hacer un reel nuevo

1. Copiar un guion parecido de `scripts/media/reels/videos/` y cambiar textos y tomas.
2. `npm run media:reels -- --preview /tmp/preview 11-mi-reel` para ver un cuadro por escena.
3. `npm run media:reels -- 11-mi-reel` → `public/redes/reels/11-mi-reel.mp4`.
4. Agregarlo a `social/calendario.json` con su fecha, hora y texto.
5. Commit y push a `master`: Vercel publica el archivo y el workflow lo sube a Instagram a la hora indicada.

### Formato del guion

```jsonc
{
  "title": "Nombre interno",
  "scenes": [
    {
      "dur": 2.0,                 // segundos
      "cut": true,                // corte seco en vez de fundido (opcional)
      "bg": { "clip": "comercial", "from": 7.0, "speed": 0.8, "focus": 0.4 },
      //     clip: "comercial" (media/terramow-comercial.mp4), "hero" (media/hero-original.mp4)
      //     o cualquier video propio guardado en media/clips/<nombre>.mp4
      //     o { "image": "src/assets/step-mapping.jpg" } o { "style": "glow" | "black" }
      "shade": "bottom",          // bottom | top | both | dark | none: sombra para que se lea el texto
      "align": "center",          // centra los bloques (opcional)
      "product": "src/assets/products/v1000.png",   // foto del producto flotando (opcional)
      "top":    [ /* elementos */ ],
      "center": [ /* elementos */ ],
      "bottom": [ /* elementos */ ]
    }
  ]
}
```

Elementos (`{"type": …}`): `eyebrow`, `title` (`size`: xl, l, m, s), `lead`, `note`, `pill`, `mega`,
`logo`, `photo`, `chips` (`items`), `ticks` (`items`; un ítem que empieza con `✗ ` sale en rojo),
`counter` (`to`, `prefix`, `suffix`, `label`), `bars` (`items` con `label`, `value`, `display`, `hi`),
`table` (`head`, `rows`, `hi` = columna resaltada), `qa` (`q`, `a`, `detail`), `step` (`n`, `text`),
`rotator` (`items`), `wa` (botón de WhatsApp), `trust`, `space` (`h`).
En los textos, `<em>…</em>` va en verde y `<s>…</s>` en rojo. Cada elemento entra solo, uno después del
otro; `at` fija el segundo exacto de entrada.

Los textos y cifras salen del sitio (fichas de producto, FAQ y blog). Si algo cambia ahí, cambiarlo
también en los guiones.

## Publicación automática en Instagram y Facebook

El workflow `Redes` corre cada 30 minutos, lee `social/calendario.json` y publica lo que tenga
`"auto": true` y ya haya llegado a su hora, en Instagram y en la página de Facebook vinculada
(`"facebook": false` en un post, o en la raíz del calendario, lo deja solo en Instagram). Tipos: `reel`,
`story` y `carousel` (este último con `files`: la lista de láminas). Un error en Facebook avisa pero no
frena Instagram; el resumen de cada corrida en Actions muestra una tabla con el estado de todo. La API de Instagram no permite stickers (encuestas, preguntas,
quiz, links), así que las historias interactivas piden "Respondé esta historia": las respuestas llegan
como mensaje directo. Si alguna vez querés una historia para subir a mano, poné `"auto": false` y un campo
`manual` con la instrucción.

### Configuración (una sola vez)

1. **Cuenta de Instagram profesional** (Empresa o Creador) vinculada a una **página de Facebook**.
2. En [developers.facebook.com](https://developers.facebook.com/) crear una app de tipo **Empresa** y
   agregarle el producto **Instagram** (API con inicio de sesión de Facebook).
3. En **Meta Business Suite → Configuración → Usuarios del sistema**, crear un usuario del sistema
   (administrador), asignarle la página, la cuenta de Instagram y la app, y **generar un token** con los
   permisos `instagram_basic`, `instagram_content_publish`, `pages_show_list`,
   `pages_read_engagement`, `business_management` y, para publicar en Facebook, `pages_manage_posts`.
   El token de un usuario del sistema no vence. Si el negocio tiene menos de 7 días, Meta no deja crear
   usuarios del sistema administradores: usar rol Empleado y darle rol de administrador en la app
   (developers.facebook.com → Roles de la app).
4. Averiguar el ID de la cuenta de Instagram:
   `https://graph.facebook.com/v23.0/me/accounts?fields=instagram_business_account&access_token=TOKEN`
   (es el número de `instagram_business_account.id`).
5. En GitHub: **Settings → Secrets and variables → Actions**, crear `IG_USER_ID` e `IG_ACCESS_TOKEN`.
6. Probar: **Actions → Redes → Run workflow** con la casilla de prueba tildada. Tiene que decir
   "Conectado a Instagram como @…" y "Archivos publicados".

### A tener en cuenta

- Instagram descarga los archivos desde `https://www.robotscortacesped.com.ar/redes/…`: el sitio tiene
  que estar publicado con esos archivos **antes** de la hora del post.
- GitHub solo ejecuta los workflows programados desde `master`, y los pausa si el repo pasa 60 días sin
  commits (se reactivan desde la pestaña Actions).
- Los reels salen **sin música**: la API no da acceso a la biblioteca de audio de Instagram. Si un guion
  tiene `"audio": "media/musica/tema.mp3"`, el render la mezcla (usar solo música libre de derechos).
- Si una corrida falla, la siguiente reintenta hasta 6 horas después de la hora pactada; pasado eso,
  el post se saltea para que no salga a destiempo.
