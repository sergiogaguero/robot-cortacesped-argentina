const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu-mobile");

function setOpen(open: boolean): void {
  if (!toggle || !menu) return;
  menu.classList.toggle("hidden", !open);
  menu.classList.toggle("flex", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  toggle.querySelector(".menu-icon-open")?.classList.toggle("hidden", open);
  toggle.querySelector(".menu-icon-close")?.classList.toggle("hidden", !open);
}

if (toggle && menu) {
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}
