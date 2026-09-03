// Envía un evento a GA4 por cada click en un link de WhatsApp (a[data-wa]).
// gtag solo existe si BaseLayout insertó el snippet (PUBLIC_GA_ID definido).
document.addEventListener("click", (event) => {
  const target = event.target as Element | null;
  const link = target?.closest<HTMLAnchorElement>("a[data-wa]");
  if (!link || typeof gtag !== "function") return;
  gtag("event", "contact_whatsapp", {
    location: link.dataset.wa ?? "",
    product: link.dataset.product ?? "",
    page_path: window.location.pathname,
  });
});
