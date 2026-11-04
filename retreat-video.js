// Defer YouTube until visible/explicitly played. Respect audible-autoplay denial.
export const HANAN_VIDEO_ID = "bqe-GyjWn4U";
export const HANAN_EMBED_URL = `https://www.youtube-nocookie.com/embed/${HANAN_VIDEO_ID}?rel=0&playsinline=1&autoplay=0&mute=0&enablejsapi=1`;
const apiLoads = new WeakMap();

export function loadYouTubeApi(doc) {
  const view = doc.defaultView;
  if (view?.YT?.Player) return Promise.resolve(view.YT);
  if (apiLoads.has(view)) return apiLoads.get(view);
  const pending = new Promise((resolve, reject) => {
    const script = doc.createElement("script");
    const previousReady = view.onYouTubeIframeAPIReady;
    let timer;
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      view.clearTimeout(timer);
      if (view.onYouTubeIframeAPIReady === ready) view.onYouTubeIframeAPIReady = previousReady;
      if (error) {
        script.remove();
        reject(error);
      } else resolve(view.YT);
    };
    const ready = () => {
      try { previousReady?.(); } finally {
        finish(view.YT?.Player ? null : new Error("YouTube API unavailable"));
      }
    };
    view.onYouTubeIframeAPIReady = ready;
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.addEventListener("error", () => finish(new Error("YouTube API could not load")), { once: true });
    timer = view.setTimeout(() => finish(new Error("YouTube API timed out")), 12000);
    doc.head.appendChild(script);
  });
  apiLoads.set(view, pending);
  pending.catch(() => apiLoads.delete(view));
  return pending;
}

export function mountRetreatVideo(player) {
  const poster = player.querySelector("[data-video-poster]");
  const slot = player.querySelector("[data-video-embed]");
  const load = player.querySelector("[data-video-load]");
  const close = player.querySelector("[data-video-close]");
  const sound = player.querySelector("[data-video-sound]");
  const fallback = player.querySelector("[data-video-fallback]");
  const status = player.querySelector("[data-video-status]");
  if (player.dataset.videoId !== HANAN_VIDEO_ID ||
      ![poster, slot, load, close, sound, fallback, status].every(Boolean)) return false;

  let frame = null;
  let controller = null;
  let autoAttempted = false;
  let inView = false;
  const doc = player.ownerDocument;
  const view = doc.defaultView;
  const reducedMotion = view?.matchMedia?.("(prefers-reduced-motion: reduce)");
  const saveData = () => Boolean(view?.navigator?.connection?.saveData);
  const unload = (focus = false) => {
    autoAttempted = true;
    if (!frame) return;
    const oldFrame = frame;
    frame = null;
    controller?.destroy();
    controller = null;
    oldFrame.remove();
    slot.hidden = true;
    poster.hidden = false;
    close.hidden = true;
    sound.hidden = true;
    player.dataset.videoLoaded = "false";
    status.textContent = "Video stopped. Select Play to restart; it will not autoplay again on this visit.";
    if (focus) load.focus();
  };

  const play = (manual = false) => {
    if (frame) return;
    autoAttempted = true;
    const next = player.ownerDocument.createElement("iframe");
    next.title = "Hanan’s personal invitation to the Rainbow Sanctuary retreat";
    next.referrerPolicy = "strict-origin-when-cross-origin";
    next.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
    next.allowFullscreen = true;
    const source = new URL(HANAN_EMBED_URL);
    if (/^https?:$/.test(view?.location?.protocol)) source.searchParams.set("origin", view.location.origin);
    next.src = source.href;
    next.addEventListener("error", () => {
      if (frame !== next) return;
      unload(manual);
      status.textContent = "The video could not load. Please use the Open on YouTube link.";
    });
    frame = next;
    slot.appendChild(next);
    poster.hidden = true;
    slot.hidden = false;
    close.hidden = false;
    player.dataset.videoLoaded = "true";
    status.textContent = "Loading video. Playback will try with sound; your browser may require a tap.";
    if (manual) next.focus();
    let mutedFallbackAttempted = false;
    loadYouTubeApi(doc).then((YT) => {
      if (frame !== next) return;
      controller = new YT.Player(next, { events: {
        onReady: ({ target }) => {
          if (frame !== next) return;
          target.unMute();
          target.playVideo();
        },
        onAutoplayBlocked: ({ target }) => {
          if (frame !== next) return;
          sound.hidden = false;
          if (!mutedFallbackAttempted) {
            mutedFallbackAttempted = true;
            status.textContent = "Your browser blocked playback with sound. Trying muted playback; select Turn sound on to listen.";
            target.mute();
            target.playVideo();
          } else {
            status.textContent = "Your browser requires a tap. Select Turn sound on or press Play in the video.";
          }
        },
        onStateChange: ({ target, data }) => {
          if (frame !== next || data !== 1) return;
          const muted = target.isMuted();
          sound.hidden = !muted;
          status.textContent = muted
            ? "Video is playing muted. Select Turn sound on to listen."
            : "Video is playing with sound. Use the player controls to pause or mute.";
        },
        onError: () => {
          if (frame !== next) return;
          unload(manual);
          status.textContent = "The video could not play here. Please use the Open on YouTube link.";
        },
      } });
    }).catch(() => {
      if (frame !== next) return;
      // Native YouTube controls remain usable if the optional API is blocked.
      status.textContent = "Automatic playback is unavailable. Press Play in the video or open it on YouTube.";
    });
  };
  const tryAutoplay = () => {
    if (inView && !autoAttempted && !doc.hidden && !reducedMotion?.matches && !saveData()) play();
  };
  load.addEventListener("click", () => play(true));
  close.addEventListener("click", () => unload(true));
  sound.addEventListener("click", () => {
    if (!controller) return;
    controller.unMute();
    controller.playVideo();
    sound.hidden = true;
    status.textContent = "Sound requested. Use the video’s controls to adjust the volume.";
    frame?.focus();
  });
  if (view?.IntersectionObserver) {
    const observer = new view.IntersectionObserver((entries) => {
      for (const entry of entries) {
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        if (!entry.isIntersecting && frame) unload();
        else tryAutoplay();
      }
    }, { threshold: [0, 0.5], rootMargin: "0px" });
    observer.observe(player.querySelector("[data-video-frame]") || player);
  }
  doc.addEventListener("visibilitychange", () => {
    if (doc.hidden && frame) unload();
    else tryAutoplay();
  });
  fallback.hidden = true;
  load.hidden = false;
  player.dataset.videoReady = "true";
  return true;
}

if (typeof document !== "undefined") {
  const mounted = new WeakSet();
  const mountPlayers = () => {
    for (const player of document.querySelectorAll("[data-retreat-video]")) {
      if (player.closest("x-dc") || mounted.has(player)) continue;
      if (mountRetreatVideo(player)) mounted.add(player);
    }
  };
  const start = () => {
    mountPlayers();
    new MutationObserver(mountPlayers).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
