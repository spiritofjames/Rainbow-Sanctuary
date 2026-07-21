(function homeHeroVideoController() {
  function initialize() {
    const root = document.querySelector("#dc-root");
    const video = root?.querySelector("[data-home-hero-video]");
    const button = root?.querySelector("[data-home-hero-motion-toggle]");
    const hero = video?.closest(".rs-pastel-hero");
    if (!video || !button || button.dataset.motionReady === "true") return false;

    button.dataset.motionReady = "true";
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

    function updateButton() {
      const paused = video.paused;
      button.dataset.state = paused ? "paused" : "playing";
      button.setAttribute("aria-label", paused ? "Play background motion" : "Pause background motion");
      button.querySelector("span").textContent = paused ? "Play motion" : "Pause motion";
    }

    function applyMotionPreference() {
      if (motionPreference.matches && hero?.dataset.motionOverride !== "true") {
        video.pause();
        button.hidden = false;
      } else {
        button.hidden = false;
        video.play().catch(updateButton);
      }
      updateButton();
    }

    button.addEventListener("click", () => {
      if (video.paused) {
        if (hero) hero.dataset.motionOverride = "true";
        if (video.ended) video.currentTime = 0;
        video.play().catch(updateButton);
      } else {
        video.pause();
      }
      updateButton();
    });

    video.addEventListener("play", updateButton);
    video.addEventListener("pause", updateButton);
    video.addEventListener("ended", () => {
      button.hidden = false;
      button.setAttribute("aria-label", "Replay background motion");
      button.querySelector("span").textContent = "Replay motion";
    });
    motionPreference.addEventListener?.("change", applyMotionPreference);
    applyMotionPreference();
    return true;
  }

  function boot() {
    if (initialize()) return;
    const observer = new MutationObserver(() => {
      if (initialize()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
