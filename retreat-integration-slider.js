function initPhotoSlider(root, selectors) {
  const viewport = root.querySelector(selectors.viewport);
  const previous = root.querySelector(selectors.previous);
  const next = root.querySelector(selectors.next);
  const status = root.querySelector(selectors.status);
  if (!viewport || !previous || !next || !status) return;

  const slides = [...viewport.querySelectorAll(selectors.slides)];
  if (slides.length < 2) return;
  let current = 0;
  const positionOf = (index) => slides[index].offsetLeft - slides[0].offsetLeft;

  function update(index) {
    current = Math.max(0, Math.min(index, slides.length - 1));
    status.textContent = `Photo ${current + 1} of ${slides.length}`;
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
  }

  function goTo(index) {
    const target = Math.max(0, Math.min(index, slides.length - 1));
    const reduceMotion = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    viewport.scrollTo({ left: positionOf(target), behavior: reduceMotion ? "auto" : "smooth" });
    update(target);
  }

  previous.addEventListener("click", () => goTo(current - 1));
  next.addEventListener("click", () => goTo(current + 1));
  viewport.addEventListener("scroll", () => {
    const nearest = slides.reduce((best, _slide, index) =>
      Math.abs(positionOf(index) - viewport.scrollLeft) < Math.abs(positionOf(best) - viewport.scrollLeft)
        ? index : best, 0);
    update(nearest);
  }, { passive: true });
  viewport.addEventListener("keydown", (event) => {
    const target = event.key === "ArrowRight" ? current + 1
      : event.key === "ArrowLeft" ? current - 1
        : event.key === "Home" ? 0
          : event.key === "End" ? slides.length - 1 : null;
    if (target === null) return;
    event.preventDefault();
    goTo(target);
  });

  root.dataset.sliderReady = "true";
  update(0);
}

export function initIntegrationSlider(root) {
  initPhotoSlider(root, {
    viewport: "[data-integration-viewport]",
    previous: "[data-integration-prev]",
    next: "[data-integration-next]",
    status: "[data-integration-status]",
    slides: ".rs-retreat-integration-photo",
  });
}

export function initMamaGaiaSlider(root) {
  initPhotoSlider(root, {
    viewport: "[data-photo-viewport]",
    previous: "[data-photo-prev]",
    next: "[data-photo-next]",
    status: "[data-photo-status]",
    slides: "[data-photo-slide]",
  });
}

if (typeof document !== "undefined") {
  const mounted = new WeakSet();
  const mountSliders = () => {
    for (const [selector, mount] of [
      ["[data-integration-slider]", initIntegrationSlider],
      ["[data-photo-slider]", initMamaGaiaSlider],
    ]) {
      for (const slider of document.querySelectorAll(selector)) {
        if (slider.closest("x-dc") || mounted.has(slider)) continue;
        mount(slider);
        if (slider.dataset.sliderReady) mounted.add(slider);
      }
    }
  };
  const start = () => {
    mountSliders();
    new MutationObserver(mountSliders).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
