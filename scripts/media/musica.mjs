// Genera una pista musical original (sintetizada acá mismo, sin samples ni derechos de terceros) para
// los reels. Estilo: pop electrónico luminoso, con intro que crece y un "drop" en un segundo elegido.
//
//   node scripts/media/musica.mjs <salida.mp3> <duración en s> [segundo del drop] [bpm]
//   node scripts/media/musica.mjs media/musica/unboxing.mp3 15.6 5.8
//
// Si se da el segundo del drop, el tempo se ajusta para que el drop caiga justo al inicio de un compás.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import ffmpegPath from "ffmpeg-static";

const [out, durArg, dropArg, bpmArg] = process.argv.slice(2);
if (!out || !durArg) {
  console.error("Uso: node scripts/media/musica.mjs <salida.mp3> <duración> [segundo del drop] [bpm]");
  process.exit(1);
}
const SR = 48000;
const DUR = Number(durArg);
let bpm = Number(bpmArg) || 124;
const drop = dropArg ? Number(dropArg) : null;
if (drop) {
  // Cantidad de compases de intro más cercana al tempo pedido, y tempo exacto para esa cantidad.
  const bars = Math.max(1, Math.round((drop * bpm) / 240));
  bpm = (bars * 240) / drop;
}
const BEAT = 60 / bpm;
const BAR = BEAT * 4;
const DROP = drop ?? BAR * 2;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);

// Re mayor: D – A – Bm – G (I – V – vi – IV)
const midi = (n) => 440 * 2 ** ((n - 69) / 12);
const CHORDS = [
  [62, 66, 69], // D
  [61, 64, 69], // A (1ª inversión cerca)
  [59, 62, 66], // Bm
  [59, 62, 67], // G
];
const ROOTS = [38, 45, 47, 43];
const chordAt = (t) => Math.floor(t / BAR) % 4;

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
function add(i, l, r) {
  if (i >= 0 && i < N) { L[i] += l; R[i] += r; }
}

// ——— Voces ———
function pad(t0, t1, notes, gain) {
  const len = Math.floor((t1 - t0) * SR);
  let lpL = 0, lpR = 0;
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const env = Math.min(1, t / 0.35) * Math.min(1, (len - k) / (0.2 * SR));
    let sL = 0, sR = 0;
    for (const n of notes) {
      const f = midi(n);
      // dos serruchos levemente desafinados, uno por canal
      sL += ((t * f * 1.003) % 1) * 2 - 1;
      sR += ((t * f * 0.997) % 1) * 2 - 1;
    }
    const a = 0.06; // filtro pasabajos de un polo
    lpL += a * (sL - lpL);
    lpR += a * (sR - lpR);
    const i = Math.floor(t0 * SR) + k;
    add(i, lpL * env * gain, lpR * env * gain);
  }
}
function pluck(t0, note, gain, pan) {
  const f = midi(note);
  const len = Math.floor(0.45 * SR);
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const env = Math.exp(-t * 9);
    const s = Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 20) + 0.15 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * 30);
    const v = s * env * gain;
    add(Math.floor(t0 * SR) + k, v * (1 - pan), v * (1 + pan));
  }
}
function bass(t0, t1, note, gain) {
  const f = midi(note);
  const len = Math.floor((t1 - t0) * SR);
  let lp = 0;
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const env = Math.min(1, t / 0.005) * Math.exp(-t * 3) * Math.min(1, (len - k) / (0.01 * SR));
    const saw = ((t * f) % 1) * 2 - 1;
    lp += 0.08 * (saw - lp);
    const s = 0.7 * Math.sin(2 * Math.PI * f * t) + 0.5 * lp;
    add(Math.floor(t0 * SR) + k, s * env * gain, s * env * gain);
  }
}
function kick(t0, gain) {
  const len = Math.floor(0.35 * SR);
  let ph = 0;
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const f = 48 + 120 * Math.exp(-t * 35);
    ph += (2 * Math.PI * f) / SR;
    const s = Math.sin(ph) * Math.exp(-t * 8) + 0.3 * Math.exp(-t * 300) * rnd();
    add(Math.floor(t0 * SR) + k, s * gain, s * gain);
  }
}
function clap(t0, gain) {
  const len = Math.floor(0.25 * SR);
  let hp = 0, prev = 0, bp = 0;
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const n = rnd();
    hp = 0.9 * (hp + n - prev); prev = n;
    bp += 0.35 * (hp - bp);
    // tres golpes muy juntos, como un aplauso
    const env = (t < 0.01 ? 1 : t < 0.02 ? 0.6 : 1) * Math.exp(-t * 18);
    const s = bp * env * gain;
    add(Math.floor(t0 * SR) + k, s * 1.1, s * 0.9);
  }
}
function hat(t0, gain, open = false) {
  const len = Math.floor((open ? 0.18 : 0.05) * SR);
  let hp = 0, prev = 0;
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const n = rnd();
    hp = 0.6 * (hp + n - prev); prev = n;
    const s = hp * Math.exp(-t * (open ? 20 : 70)) * gain;
    add(Math.floor(t0 * SR) + k, s * 0.8, s * 1.2);
  }
}
function riser(t0, t1, gain) {
  const len = Math.floor((t1 - t0) * SR);
  let lp = 0;
  for (let k = 0; k < len; k++) {
    const x = k / len;
    lp += (0.02 + 0.5 * x * x) * (rnd() - lp);
    const s = lp * x * x * gain;
    add(Math.floor(t0 * SR) + k, s, s);
  }
}

// ——— Arreglo ———
const bars = Math.ceil(DUR / BAR);
for (let b = 0; b < bars; b++) {
  const t = b * BAR;
  const c = b % 4;
  const inDrop = t >= DROP - 1e-6;
  const intro = !inDrop;
  const introProg = intro ? Math.min(1, (t + BAR) / DROP) : 1; // 0..1 a lo largo de la intro
  pad(t, Math.min(DUR, t + BAR + 0.1), CHORDS[c], inDrop ? 0.05 : 0.04 + 0.03 * introProg);
  // arpegio en semicorcheas
  const arp = [...CHORDS[c].map((n) => n + 12), CHORDS[c][1] + 24, CHORDS[c][0] + 24];
  for (let s = 0; s < 16; s++) {
    const tt = t + (s * BEAT) / 4;
    if (tt >= DUR) break;
    if (intro && b === 0 && s % 2 === 1) continue; // más aireado al principio
    pluck(tt, arp[(s * 3) % arp.length], (inDrop ? 0.15 : 0.09 + 0.05 * introProg) * (s % 4 === 0 ? 1.2 : 1), s % 2 ? 0.35 : -0.35);
  }
  for (let q = 0; q < 8; q++) {
    const tt = t + (q * BEAT) / 2;
    if (tt >= DUR) break;
    if (inDrop || introProg > 0.5) hat(tt, q % 2 ? 0.16 : 0.08, inDrop && q % 2 === 1 && q === 7);
    if (inDrop) bass(tt, tt + BEAT / 2 - 0.01, ROOTS[c] + (q % 2 ? 12 : 0), 0.2);
  }
  for (let q = 0; q < 4; q++) {
    const tt = t + q * BEAT;
    if (tt >= DUR) break;
    if (inDrop) {
      kick(tt, 0.72);
      if (q % 2 === 1) clap(tt, 0.5);
    } else if (introProg === 1 && q % 2 === 0) {
      kick(tt, 0.45); // pulso suave en el último compás antes del drop
    }
  }
}
if (DROP > BAR) riser(DROP - BAR, DROP, 0.35);
kick(DROP, 1.0);

// ——— Master: compresión suave, fade out y normalización ———
let peak = 0;
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, (N - i) / (1.0 * SR)) * Math.min(1, i / (0.05 * SR));
  L[i] = Math.tanh(L[i] * 1.4) * fade;
  R[i] = Math.tanh(R[i] * 1.4) * fade;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const g = 0.89 / peak;
const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  pcm.writeInt16LE(Math.round(L[i] * g * 32767), i * 4);
  pcm.writeInt16LE(Math.round(R[i] * g * 32767), i * 4 + 2);
}
const dir = mkdtempSync(join(tmpdir(), "musica-"));
const raw = join(dir, "pista.raw");
writeFileSync(raw, pcm);
mkdirSync(dirname(out), { recursive: true });
execFileSync(ffmpegPath, ["-y", "-hide_banner", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "2", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "libmp3lame", "-b:a", "192k", out]);
rmSync(dir, { recursive: true, force: true });
console.log(`✔ ${out} (${DUR}s, ${bpm.toFixed(1)} bpm, drop en ${DROP.toFixed(2)}s)`);
