// Genera una pista musical original (sintetizada acá mismo, sin samples ni derechos de terceros) para
// los reels, con intro que crece y un "drop" (entra la batería completa) en el segundo elegido.
//
//   node scripts/media/musica.mjs <salida.mp3> <duración s> [segundo del drop] [estilo] [--motor desde-hasta]
//
//   estilos: luminoso (pop electrónico, por defecto) · chill (lo-fi tranquilo) · groove (funky) ·
//            epico (lanzamiento, más grande)
//   --motor 2.3-3.6  suma el ruido de una cortadora a nafta en ese tramo (para el reel del domingo)
//
// La grilla de compases se ancla en el drop: el drop cae siempre al principio de un compás, con
// cualquier tempo; lo que queda antes es la intro (puede empezar a mitad de compás).
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import ffmpegPath from "ffmpeg-static";

const argv = process.argv.slice(2);
const motorAt = argv.indexOf("--motor");
const motor = motorAt >= 0 ? argv.splice(motorAt, 2)[1].split("-").map(Number) : null;
const [out, durArg, dropArg, estilo = "luminoso"] = argv;
if (!out || !durArg) {
  console.error("Uso: node scripts/media/musica.mjs <salida.mp3> <duración> [segundo del drop] [estilo] [--motor desde-hasta]");
  process.exit(1);
}

// Acordes como notas MIDI; bajo = fundamental dos octavas abajo.
const ESTILOS = {
  luminoso: { bpm: 124, chords: [[62, 66, 69], [61, 64, 69], [59, 62, 66], [59, 62, 67]], roots: [38, 45, 47, 43], arp: "16", drums: "four", bass: "octavas", pad: 0.05, pluck: 0.15, swing: 0 },
  chill: { bpm: 88, chords: [[65, 69, 72, 76], [64, 67, 71, 74], [62, 65, 69, 72], [60, 64, 67, 71]], roots: [41, 40, 38, 36], arp: "8", drums: "lofi", bass: "largo", pad: 0.07, pluck: 0.13, swing: 0.18 },
  groove: { bpm: 112, chords: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], roots: [45, 41, 36, 43], arp: "stabs", drums: "funk", bass: "sincopado", pad: 0.035, pluck: 0.17, swing: 0.08 },
  epico: { bpm: 128, chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], roots: [36, 43, 45, 41], arp: "16", drums: "four", bass: "contratiempo", pad: 0.075, pluck: 0.13, swing: 0 },
};
const S = ESTILOS[estilo];
if (!S) {
  console.error(`Estilo desconocido "${estilo}". Opciones: ${Object.keys(ESTILOS).join(", ")}`);
  process.exit(1);
}

const SR = 48000;
const DUR = Number(durArg);
const BEAT = 60 / S.bpm;
const BAR = BEAT * 4;
const DROP = dropArg ? Number(dropArg) : BAR * 2;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const midi = (n) => 440 * 2 ** ((n - 69) / 12);

let seed = 7 + Math.round(DUR * 100) + estilo.length;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
function add(i, l, r) {
  if (i >= 0 && i < N) { L[i] += l; R[i] += r; }
}
// Swing: corre las semicorcheas/corcheas "débiles" un poco hacia adelante.
const sw = (t, step, sub) => (step % 2 === 1 ? t + S.swing * sub : t);

// ——— Voces ———
function pad(t0, t1, notes, gain) {
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor((t1 - t0) * SR);
  let lpL = 0, lpR = 0;
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const env = Math.min(1, t / 0.35) * Math.min(1, (len - k) / (0.2 * SR));
    let sL = 0, sR = 0;
    for (const n of notes) {
      const f = midi(n);
      sL += ((t * f * 1.003) % 1) * 2 - 1;
      sR += ((t * f * 0.997) % 1) * 2 - 1;
    }
    lpL += 0.06 * (sL - lpL);
    lpR += 0.06 * (sR - lpR);
    add(i0 + k, lpL * env * gain, lpR * env * gain);
  }
}
function pluck(t0, note, gain, pan, decay = 9) {
  const f = midi(note);
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor((4 / decay) * SR);
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const env = Math.exp(-t * decay) * Math.min(1, t / 0.002);
    const s = Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 20) + 0.15 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * 30);
    const v = s * env * gain;
    add(i0 + k, v * (1 - pan), v * (1 + pan));
  }
}
function bass(t0, t1, note, gain) {
  const f = midi(note);
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor((t1 - t0) * SR);
  let lp = 0;
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const env = Math.min(1, t / 0.005) * Math.exp(-t * 3) * Math.min(1, (len - k) / (0.01 * SR));
    const saw = ((t * f) % 1) * 2 - 1;
    lp += 0.08 * (saw - lp);
    const s = 0.7 * Math.sin(2 * Math.PI * f * t) + 0.5 * lp;
    add(i0 + k, s * env * gain, s * env * gain);
  }
}
function kick(t0, gain, soft = false) {
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor(0.35 * SR);
  let ph = 0;
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const f = (soft ? 55 : 48) + (soft ? 70 : 120) * Math.exp(-t * 35);
    ph += (2 * Math.PI * f) / SR;
    const s = Math.sin(ph) * Math.exp(-t * (soft ? 11 : 8)) + (soft ? 0 : 0.3 * Math.exp(-t * 300) * rnd());
    add(i0 + k, s * gain, s * gain);
  }
}
function clap(t0, gain, snare = false) {
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor(0.25 * SR);
  let hp = 0, prev = 0, bp = 0;
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const n = rnd();
    hp = 0.9 * (hp + n - prev); prev = n;
    bp += 0.35 * (hp - bp);
    const env = (t < 0.01 ? 1 : t < 0.02 ? 0.6 : 1) * Math.exp(-t * (snare ? 25 : 18));
    const tone = snare ? 0.5 * Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 30) : 0;
    const s = (bp + tone) * env * gain;
    add(i0 + k, s * 1.1, s * 0.9);
  }
}
function hat(t0, gain, open = false) {
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor((open ? 0.18 : 0.05) * SR);
  let hp = 0, prev = 0;
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const n = rnd();
    hp = 0.6 * (hp + n - prev); prev = n;
    const s = hp * Math.exp(-t * (open ? 20 : 70)) * gain;
    add(i0 + k, s * 0.8, s * 1.2);
  }
}
function riser(t0, t1, gain) {
  const i0 = Math.floor(Math.max(0, t0) * SR);
  const len = Math.floor((t1 - Math.max(0, t0)) * SR);
  let lp = 0;
  for (let k = 0; k < len; k++) {
    const x = k / len;
    lp += (0.02 + 0.5 * x * x) * (rnd() - lp);
    const s = lp * x * x * gain;
    add(i0 + k, s, s);
  }
}
// Cortadora a nafta: motor de dos tiempos (serrucho grave modulado) más ruido.
function cortadora(t0, t1, gain) {
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor((t1 - t0) * SR);
  let ph = 0, lp = 0;
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const f = 52 + 6 * Math.sin(2 * Math.PI * 3 * t) + 20 * Math.min(1, t / 0.3);
    ph += f / SR;
    const saw = (ph % 1) * 2 - 1;
    const am = 0.6 + 0.4 * Math.sign(Math.sin(2 * Math.PI * f * 0.5 * t));
    lp += 0.2 * (rnd() - lp);
    const env = Math.min(1, t / 0.08) * Math.min(1, (len - k) / (0.05 * SR));
    const s = (0.8 * saw * am + 0.5 * lp) * env * gain;
    add(i0 + k, s, s);
  }
}

// ——— Arreglo, anclado en el drop ———
const firstBar = -Math.ceil(DROP / BAR);
const lastBar = Math.ceil((DUR - DROP) / BAR);
for (let b = firstBar; b < lastBar; b++) {
  const t = DROP + b * BAR;
  const c = ((b % 4) + 4) % 4;
  const inDrop = b >= 0;
  const introProg = inDrop ? 1 : Math.min(1, 1 + (b + 1) / Math.max(1, -firstBar)); // 0..1 hacia el drop
  const barEnd = t + BAR;
  const notes = S.chords[c];
  if (barEnd > 0) pad(Math.max(0, t), Math.min(DUR, barEnd + 0.1), notes, inDrop ? S.pad : S.pad * (0.7 + 0.4 * introProg));
  const g = inDrop ? S.pluck : S.pluck * (0.6 + 0.35 * introProg);

  // Melodía / armonía
  if (S.arp === "16" || S.arp === "8") {
    const steps = S.arp === "16" ? 16 : 8;
    const arp = [...notes.map((n) => n + 12), notes[1] + 24, notes[0] + 24];
    for (let s = 0; s < steps; s++) {
      const tt = sw(t + (s * BAR) / steps, s, BAR / steps);
      if (tt < 0 || tt >= DUR) continue;
      if (!inDrop && introProg < 0.4 && s % 2 === 1) continue;
      pluck(tt, arp[(s * 3) % arp.length], g * (s % 4 === 0 ? 1.2 : 1), s % 2 ? 0.35 : -0.35, S.arp === "8" ? 6 : 9);
    }
  } else {
    // stabs: acorde corto en contratiempos, estilo funk
    for (const off of [0.5, 1.5, 2.75, 3.5]) {
      const tt = t + off * BEAT;
      if (tt < 0 || tt >= DUR) continue;
      notes.forEach((n, j) => pluck(tt, n + 12, g * 0.7, j % 2 ? 0.3 : -0.3, 14));
    }
  }

  // Bajo
  if (inDrop) {
    if (S.bass === "octavas") for (let q = 0; q < 8; q++) bass(t + (q * BEAT) / 2, t + ((q + 1) * BEAT) / 2 - 0.01, S.roots[c] + (q % 2 ? 12 : 0), 0.2);
    if (S.bass === "contratiempo") for (let q = 0; q < 4; q++) bass(t + (q + 0.5) * BEAT, t + (q + 0.95) * BEAT, S.roots[c] + 12, 0.24);
    if (S.bass === "largo") { bass(t, t + 2 * BEAT - 0.02, S.roots[c], 0.28); bass(t + 2.5 * BEAT, t + 3.9 * BEAT, S.roots[c], 0.22); }
    if (S.bass === "sincopado") for (const [a, d, o] of [[0, 0.45, 0], [0.75, 0.2, 0], [1.5, 0.4, 12], [2.5, 0.45, 0], [3.25, 0.2, 7], [3.5, 0.4, 12]]) bass(t + a * BEAT, t + (a + d) * BEAT, S.roots[c] + o, 0.24);
  }

  // Batería
  for (let q = 0; q < 8; q++) {
    const tt = sw(t + (q * BEAT) / 2, q, BEAT / 2);
    if (tt < 0 || tt >= DUR) continue;
    if (inDrop || introProg > 0.5) hat(tt, (q % 2 ? 0.15 : 0.07) * (S.drums === "lofi" ? 0.7 : 1), inDrop && q === 7 && S.drums !== "lofi");
  }
  for (let q = 0; q < 4; q++) {
    const tt = t + q * BEAT;
    if (tt < 0 || tt >= DUR) continue;
    if (inDrop) {
      if (S.drums === "four") kick(tt, 0.72);
      if (S.drums === "lofi" && (q === 0 || q === 2)) kick(tt + (q === 2 ? BEAT / 2 : 0), 0.7, true);
      if (S.drums === "funk" && (q === 0 || q === 2)) kick(tt, 0.72);
      if (q % 2 === 1) clap(tt, S.drums === "lofi" ? 0.35 : 0.5, S.drums !== "four");
    } else if (introProg === 1 && q % 2 === 0) {
      kick(tt, 0.4, S.drums === "lofi");
    }
  }
  if (inDrop && S.drums === "funk") kick(t + 2.75 * BEAT, 0.5);
}
if (DROP > BEAT * 2) riser(DROP - Math.min(BAR, DROP), DROP, S.drums === "lofi" ? 0.18 : 0.35);
kick(DROP, 0.95, S.drums === "lofi");
if (motor) cortadora(motor[0], motor[1], 0.55);

// ——— Master: saturación suave, fade out y normalización ———
let peak = 0;
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, (N - i) / (1.0 * SR)) * Math.min(1, i / (0.05 * SR));
  L[i] = Math.tanh(L[i] * 1.4) * fade;
  R[i] = Math.tanh(R[i] * 1.4) * fade;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const gain = 0.89 / peak;
const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  pcm.writeInt16LE(Math.round(L[i] * gain * 32767), i * 4);
  pcm.writeInt16LE(Math.round(R[i] * gain * 32767), i * 4 + 2);
}
const dir = mkdtempSync(join(tmpdir(), "musica-"));
const raw = join(dir, "pista.raw");
writeFileSync(raw, pcm);
mkdirSync(dirname(out), { recursive: true });
execFileSync(ffmpegPath, ["-y", "-hide_banner", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "2", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "libmp3lame", "-b:a", "192k", out]);
rmSync(dir, { recursive: true, force: true });
console.log(`✔ ${out} (${DUR}s, ${estilo}, ${S.bpm} bpm, drop en ${DROP.toFixed(2)}s${motor ? `, cortadora ${motor.join("-")}s` : ""})`);
