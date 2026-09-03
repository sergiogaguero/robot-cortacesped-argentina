const bar = document.getElementById("sticky-bar");
const priceBlock = document.getElementById("price-block");
const float = document.getElementById("wa-float");

if (bar && priceBlock) {
  let lastY = window.scrollY;
  let passedPrice = false;

  const update = (): void => {
    const goingUp = window.scrollY < lastY - 4;
    lastY = window.scrollY;
    const show = passedPrice && !goingUp;
    bar.classList.toggle("translate-y-full", !show);
    bar.setAttribute("aria-hidden", String(!show));
    float?.classList.toggle("hidden", show);
  };

  new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      passedPrice = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      update();
    },
    { threshold: 0 },
  ).observe(priceBlock);

  window.addEventListener("scroll", update, { passive: true });
}
