(() => {
  "use strict";

  const selector = [
    'a[style*="var(--rs-cta)"]',
    'button[style*="var(--rs-cta)"]',
    ".rs-button--primary",
    ".rs-about-button--primary",
  ].join(",");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const decorated = new WeakSet();
  let pointerFrame = 0;
  let pendingPointer = null;
  let decorateFrame = 0;

  function decorate(root = document) {
    const elements = [];
    if (root instanceof Element && root.matches(selector)) elements.push(root);
    if (root.querySelectorAll) elements.push(...root.querySelectorAll(selector));

    for (const element of elements) {
      if (decorated.has(element)) continue;
      decorated.add(element);
      element.classList.add("rs-cta-interactive");
      if (!reducedMotion.matches) element.classList.add("rs-cta-enter");
    }
  }

  function paintPointer() {
    pointerFrame = 0;
    if (!pendingPointer || !precisePointer.matches) return;
    const { element, clientX, clientY } = pendingPointer;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--rs-glow-x", `${clientX - rect.left}px`);
    element.style.setProperty("--rs-glow-y", `${clientY - rect.top}px`);
  }

  document.addEventListener("pointermove", (event) => {
    const element = event.target.closest?.(".rs-cta-interactive");
    if (!element || !precisePointer.matches) return;
    pendingPointer = { element, clientX: event.clientX, clientY: event.clientY };
    if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
  }, { passive: true });

  document.addEventListener("pointerout", (event) => {
    const element = event.target.closest?.(".rs-cta-interactive");
    if (!element || element.contains(event.relatedTarget)) return;
    element.style.setProperty("--rs-glow-x", "50%");
    element.style.setProperty("--rs-glow-y", "50%");
  }, { passive: true });

  function start() {
    decorate();
    const observer = new MutationObserver(() => {
      if (decorateFrame) return;
      decorateFrame = requestAnimationFrame(() => {
        decorateFrame = 0;
        decorate(document);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    requestAnimationFrame(() => decorate(document));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
