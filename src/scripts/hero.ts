// Carga y reproduce el video del hero solo en desktop y sin "reducir movimiento".
// En móvil no se descarga ni un byte: el <video> no tiene <source> hasta acá.
const video = document.getElementById("hero-video") as HTMLVideoElement | null;
const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (video && isDesktop && !reduceMotion) {
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
