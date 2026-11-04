export function initRetreatGallery(root) {
  if (root.dataset.galleryReady) return;
  const list = root.querySelector("[data-gallery-list]");
  const viewer = root.querySelector("[data-gallery-viewer]");
  const image = root.querySelector("[data-gallery-image]");
  const caption = root.querySelector("[data-gallery-caption]");
  const counter = root.querySelector("[data-gallery-counter]");
  const previous = root.querySelector("[data-gallery-prev]");
  const next = root.querySelector("[data-gallery-next]");
  const close = root.querySelector("[data-gallery-close]");
  if (!list || !viewer || !image || !caption || !counter || !previous || !next || !close) return;

  const photos = [...list.querySelectorAll("figure")].map((figure) => ({
    link: figure.querySelector("a"),
    image: figure.querySelector("img"),
    caption: figure.querySelector("figcaption"),
  }));
  if (!photos.length || photos.some(({ link, image: photo, caption: label }) => !link || !photo || !label)) return;

  let current = 0;
  let opener = null;
  let touchStart = null;
  function show(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    image.src = photo.link.href;
    image.alt = photo.image.alt;
    caption.textContent = photo.caption.textContent;
    counter.textContent = `Photo ${current + 1} of ${photos.length}`;
  }

  list.addEventListener("click", (event) => {
    const link = event.target.closest?.("a");
    const index = photos.findIndex((photo) => photo.link === link);
    if (index < 0 || typeof viewer.showModal !== "function") return;
    event.preventDefault();
    opener = link;
    show(index);
    viewer.showModal();
    close.focus();
  });

  previous.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  close.addEventListener("click", () => viewer.close());
  viewer.addEventListener("close", () => {
    image.removeAttribute("src");
    opener?.focus();
  });
  viewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      show(current + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  viewer.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  viewer.addEventListener("touchend", (event) => {
    if (!touchStart || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return;
    show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  root.dataset.galleryReady = "true";
}

if (typeof document !== "undefined") {
  const mounted = new WeakSet();
  const mountGalleries = () => {
    for (const gallery of document.querySelectorAll("[data-retreat-gallery]")) {
      if (gallery.closest("x-dc") || mounted.has(gallery)) continue;
      initRetreatGallery(gallery);
      if (gallery.dataset.galleryReady) mounted.add(gallery);
    }
  };
  const start = () => {
    mountGalleries();
    new MutationObserver(mountGalleries).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
