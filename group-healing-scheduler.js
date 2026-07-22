(function () {
  const config = window.RAINBOW_SANCTUARY_CONFIG?.events || {};
  const sessions = Array.isArray(config.items)
    ? config.items.filter((item) => item && item.category === "group" && item.startDate && item.status !== "cancelled")
    : [];

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function safeUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function formatDate(value) {
    return new Date(value + "T12:00:00").toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  function init() {
    const list = document.getElementById("group-session-list");
    const empty = document.getElementById("group-session-empty");
    if (!list || !empty || list.closest("x-dc")) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = sessions
      .filter((item) => new Date((item.endDate || item.startDate) + "T12:00:00") >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    if (!upcoming.length) return true;
    list.innerHTML = upcoming.map((item) => {
      const url = safeUrl(item.registrationUrl) || safeUrl(config.groupHealing?.registrationUrl) || `Book-Consultation.dc.html?reason=group-healing&event=${encodeURIComponent(item.id)}`;
      const time = item.time ? `${escapeHtml(item.time)} · ` : "";
      const timezone = escapeHtml(item.timezone || config.timezone || "Timezone to be confirmed");
      return `<article class="rs-session-card"><div><span>${escapeHtml(formatDate(item.startDate))}</span><h3>${escapeHtml(item.title)}</h3><p>${time}${timezone} · Zoom</p></div><a class="rs-entry-button rs-entry-button--primary rs-cta-final" href="${escapeHtml(url)}">Choose this session</a></article>`;
    }).join("");
    empty.hidden = true;
    return true;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  if (!init()) {
    const observer = new MutationObserver(() => {
      if (init()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
