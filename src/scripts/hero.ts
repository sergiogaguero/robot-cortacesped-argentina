// Carga y reproduce el video del hero solo en desktop y sin "reducir movimiento".
// En móvil no se descarga ni un byte: el <video> no tiene <source> hasta que hace falta.
const video = document.getElementById("hero-video") as HTMLVideoElement | null;
const desktopQuery = window.matchMedia("(min-width: 1024px)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let enabled = false;

function enableVideo(): void {
  if (enabled || !video) return;
  enabled = true;
  const sources: Array<[string, string | undefined]> = [
    ["video/webm", video.dataset.webm],
    ["video/mp4", video.dataset.mp4],
  ];
  for (const [type, src] of sources) {
    if (!src) continue;
    const source = document.createElement("source");
    source.type = type;
    source.src = src;
    video.appendChild(source);
  }
  video.addEventListener("canplay", () => video.classList.remove("hidden"), { once: true });
  video.load();
  video.play().catch(() => {
    /* autoplay bloqueado: queda la imagen */
  });
}

if (video && !reduceMotion) {
  if (desktopQuery.matches) enableVideo();
  // Si el viewport pasa a desktop después de esta carga (ej. se agranda la ventana o se rota
  // una tablet) y todavía no hay <source>, se inyectan recién ahí. Una vez habilitado, no vuelve
  // a quitarse el video si el viewport achica de nuevo.
  desktopQuery.addEventListener("change", (e) => {
    if (e.matches) enableVideo();
  });
}
