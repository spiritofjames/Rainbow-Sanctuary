// Participant films are never requested until a visitor chooses Play.
const VIDEO_TITLES = new Map([
  ["C6KVdON7Ju0", "German Sozzi’s retreat reflection"],
  ["TKcncu9DIEc", "Garlon’s retreat reflection"],
]);

let activeStop = null;

export function mountTestimonialVideo(card) {
  const title = VIDEO_TITLES.get(card.dataset.videoId);
  const poster = card.querySelector("[data-testimonial-poster]");
  const embed = card.querySelector("[data-testimonial-embed]");
  const play = card.querySelector("[data-testimonial-play]");
  const fallback = card.querySelector("[data-testimonial-fallback]");
  const stop = card.querySelector("[data-testimonial-stop]");
  const status = card.querySelector("[data-testimonial-status]");
  if (!title || ![poster, embed, play, fallback, stop, status].every(Boolean)) return false;

  const doc = card.ownerDocument;
  let frame = null;

  const unload = (restoreFocus = false) => {
    if (!frame) return;
    frame.remove();
    frame = null;
    if (activeStop === unload) activeStop = null;
    embed.hidden = true;
    poster.hidden = false;
    stop.hidden = true;
    card.dataset.videoLoaded = "false";
    status.textContent = "Video stopped. Select Play to watch again.";
    if (restoreFocus) play.focus();
  };

  play.addEventListener("click", () => {
    if (frame) return;
    if (activeStop) activeStop();
    const next = doc.createElement("iframe");
    next.title = title;
    next.referrerPolicy = "strict-origin-when-cross-origin";
    next.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
    next.allowFullscreen = true;
    next.src = `https://www.youtube-nocookie.com/embed/${card.dataset.videoId}?rel=0&playsinline=1&autoplay=1`;
    next.addEventListener("error", () => {
      if (frame !== next) return;
      unload(true);
      status.textContent = "The video could not load here. Please use the Open on YouTube link.";
    });
    frame = next;
    activeStop = unload;
    embed.appendChild(next);
    poster.hidden = true;
    embed.hidden = false;
    stop.hidden = false;
    card.dataset.videoLoaded = "true";
    status.textContent = "Loading video. If playback does not begin, press Play in the player.";
    next.focus();
  });

  stop.addEventListener("click", () => unload(true));
  doc.addEventListener("visibilitychange", () => {
    if (doc.hidden) unload();
  });
  fallback.hidden = true;
  play.hidden = false;
  card.dataset.videoReady = "true";
  card.dataset.videoLoaded = "false";
  return true;
}

if (typeof document !== "undefined") {
  const mounted = new WeakSet();
  const mountCards = () => {
    for (const card of document.querySelectorAll("[data-testimonial-video]")) {
      if (card.closest("x-dc") || mounted.has(card)) continue;
      if (mountTestimonialVideo(card)) mounted.add(card);
    }
  };
  const start = () => {
    mountCards();
    new MutationObserver(mountCards).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
