const SPOTIFY_EMBED_URL = "https://open.spotify.com/embed/track/2WxJlY7NsAqeQ52lJMJYwU";

export function initStorySong(root) {
  if (root.dataset.spotifyReady) return;
  const button = root.querySelector("[data-spotify-load]");
  const slot = root.querySelector("[data-spotify-embed]");
  const status = root.querySelector("[data-spotify-status]");
  if (!button || !slot || !status) return;

  let loaded = false;
  button.hidden = false;
  button.addEventListener("click", () => {
    if (loaded) {
      slot.replaceChildren();
      slot.hidden = true;
      button.setAttribute("aria-expanded", "false");
      button.textContent = "Listen here on Spotify";
      status.textContent = "Spotify player closed. You can open it again or use the direct Spotify link.";
      loaded = false;
      return;
    }

    const frame = root.ownerDocument.createElement("iframe");
    frame.title = "Sonqoypi Bobinsana by Hatun Ahayu on Spotify";
    frame.src = SPOTIFY_EMBED_URL;
    frame.width = "100%";
    frame.height = "152";
    frame.loading = "lazy";
    frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    slot.replaceChildren(frame);
    slot.hidden = false;
    button.setAttribute("aria-expanded", "true");
    button.textContent = "Close Spotify player";
    status.textContent = "Spotify player loaded below. Select Play in the player to listen.";
    loaded = true;
  });
  root.dataset.spotifyReady = "true";
}

if (typeof document !== "undefined") {
  const mounted = new WeakSet();
  const mountSongs = () => {
    for (const song of document.querySelectorAll("[data-story-song]")) {
      if (song.closest("x-dc") || mounted.has(song)) continue;
      initStorySong(song);
      if (song.dataset.spotifyReady) mounted.add(song);
    }
  };
  const start = () => {
    mountSongs();
    new MutationObserver(mountSongs).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
