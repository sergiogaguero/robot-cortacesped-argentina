// Recorta un tema de la biblioteca de música para usarlo de fondo en un reel o una historia.
//
// Uso: node scripts/media/pista.mjs <fuente> <salida.mp3> <desde_seg> <duración_seg>
//   node scripts/media/pista.mjs media/musica/biblioteca/everything.m4a media/musica/fiestas.mp3 12.4 14.2
//
// Corta desde <desde_seg> (conviene arrancar justo en la entrada fuerte del tema: en una historia
// no hay tiempo para la intro), suma medio segundo de margen, hace un fundido de entrada corto y
// uno de salida de 1,2 s, y normaliza el volumen a -14 LUFS (el nivel que usa Instagram) para que
// todos los temas suenen parejos. Después, en el guion: "audio": "<salida.mp3>".
import { execFileSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const [src, out, fromArg, durArg] = process.argv.slice(2);
if (!src || !out || fromArg === undefined || durArg === undefined) {
  console.error("Uso: node scripts/media/pista.mjs <fuente> <salida.mp3> <desde_seg> <duración_seg>");
  process.exit(1);
}
const from = Number(fromArg);
const dur = Number(durArg) + 0.5;
const fadeOut = Math.max(0, dur - 1.2).toFixed(2);
execFileSync(ffmpegPath, [
  "-y", "-hide_banner", "-loglevel", "error",
  "-ss", String(from), "-t", String(dur), "-i", src,
  "-af", `afade=t=in:d=0.15,afade=t=out:st=${fadeOut}:d=1.2,loudnorm=I=-14:TP=-1.5:LRA=11`,
  "-ar", "48000", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "192k", out,
], { stdio: "inherit" });
console.log(`✔ ${out} (${src} desde ${from}s, ${dur.toFixed(1)}s)`);
