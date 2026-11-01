// Preserve deep links into the previous homepage now available at /explore.
// Only known former anchors can change the path. No external destination/input.
(() => {
  const legacy = new Set(['main-content', 'find-your-path', 'find-your-path-title',
    'planetary-vision', 'contribution-title', 'review-invitation-title',
    'home-photo-spiral', 'home-photo-family', 'home-photo-community']);
  let anchor;
  try { anchor = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
  if (legacy.has(anchor)) window.location.replace(`/explore${window.location.search}#${encodeURIComponent(anchor)}`);
})();
