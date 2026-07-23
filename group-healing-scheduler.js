(function groupHealingBooking() {
  const eventsConfig = window.RAINBOW_SANCTUARY_CONFIG?.events || {};
  const groupConfig = eventsConfig.groupHealing || {};
  const sessions = Array.isArray(eventsConfig.items)
    ? eventsConfig.items
      .filter((item) => item && item.category === "group" && item.startDate && item.status !== "cancelled")
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
    : [];

  const today = startOfDay(new Date());
  const upcoming = sessions.filter((item) => eventDate(item.endDate || item.startDate) >= today);
  const firstUpcoming = upcoming.map((item) => eventDate(item.startDate)).sort((a, b) => a - b)[0];
  let visibleMonth = new Date((firstUpcoming || today).getFullYear(), (firstUpcoming || today).getMonth(), 1);
  let selectedId = "";
  let initialized = false;

  function eventDate(value) { return new Date(`${value}T12:00:00`); }
  function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
  function sameDate(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function escapeHtml(value) { return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]); }
  function formatDate(value) { return eventDate(value).toLocaleDateString("en", { weekday:"long", day:"numeric", month:"long", year:"numeric" }); }

  function safeUrl(value) {
    if (!value || !String(value).trim()) return "";
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === "https:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function checkoutUrl(item) {
    const raw = safeUrl(item.checkoutUrl) || safeUrl(groupConfig.checkoutUrl);
    if (!raw) return "";
    const url = new URL(raw);
    if (url.hostname === "buy.stripe.com" && item.id) url.searchParams.set("client_reference_id", item.id);
    return url.href;
  }

  function isBookable(item) {
    return item.status === "open" && Boolean(checkoutUrl(item));
  }

  function selectSession(id) {
    const item = upcoming.find((candidate) => candidate.id === id);
    if (!item) return;
    selectedId = id;
    const title = document.getElementById("group-checkout-title");
    const details = document.getElementById("group-checkout-details");
    const link = document.getElementById("group-checkout-link");
    const status = document.getElementById("group-checkout-status");
    const time = item.time || "Time to be confirmed";
    const timezone = item.timezone || eventsConfig.timezone || "Timezone to be confirmed";
    const url = checkoutUrl(item);

    title.textContent = item.title;
    details.textContent = `${formatDate(item.startDate)} · ${time} · ${timezone} · Zoom`;
    document.querySelectorAll("[data-group-session]").forEach((button) => {
      const selected = button.dataset.groupSession === id;
      button.setAttribute("aria-pressed", String(selected));
      button.closest(".rs-session-card")?.classList.toggle("is-selected", selected);
    });
    document.querySelectorAll("[data-group-calendar-session]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.groupCalendarSession === id));
    });

    if (url && item.status === "open") {
      link.href = url;
      link.hidden = false;
      link.removeAttribute("aria-disabled");
      status.textContent = "You will complete the $20 payment securely through Stripe. Confirmation and Zoom access follow registration.";
    } else {
      link.hidden = true;
      link.removeAttribute("href");
      status.textContent = item.status === "full"
        ? "This session is currently full. Choose another highlighted date."
        : "This date is visible, but checkout is not open yet. No consultation or enquiry is required.";
    }
  }

  function renderCalendar() {
    const grid = document.getElementById("group-calendar-grid");
    const label = document.getElementById("group-calendar-label");
    if (!grid || !label) return;
    label.textContent = visibleMonth.toLocaleDateString("en", { month:"long", year:"numeric" });
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset);
    const cells = [];

    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      const outside = date.getMonth() !== visibleMonth.getMonth();
      const daySessions = upcoming.filter((item) => sameDate(eventDate(item.startDate), date));
      const item = daySessions[0];
      const active = item && isBookable(item);
      const selected = item && item.id === selectedId;
      const labelText = date.toLocaleDateString("en", { weekday:"long", day:"numeric", month:"long" });
      const content = item
        ? `<button type="button" data-group-calendar-session="${escapeHtml(item.id)}" aria-pressed="${selected}" ${active ? "" : "disabled"} aria-label="${escapeHtml(`${labelText}, ${item.title}${active ? ", available" : ", not yet bookable"}`)}"><span>${date.getDate()}</span><i aria-hidden="true"></i></button>`
        : `<span aria-label="${escapeHtml(labelText)}">${date.getDate()}</span>`;
      cells.push(`<div class="rs-booking-day${outside ? " rs-booking-day--outside" : ""}${item ? " rs-booking-day--session" : ""}${active ? " rs-booking-day--available" : ""}" role="gridcell">${content}</div>`);
    }
    grid.innerHTML = cells.join("");
    grid.querySelectorAll("[data-group-calendar-session]").forEach((button) => {
      button.addEventListener("click", () => selectSession(button.dataset.groupCalendarSession));
    });
  }

  function renderSessionList() {
    const list = document.getElementById("group-session-list");
    const empty = document.getElementById("group-session-empty");
    if (!list || !empty) return;
    if (!upcoming.length) {
      list.innerHTML = "";
      empty.hidden = false;
      const title = document.getElementById("group-checkout-title");
      const details = document.getElementById("group-checkout-details");
      const status = document.getElementById("group-checkout-status");
      if (title) title.textContent = "New dates are being prepared";
      if (details) details.textContent = "Confirmed twice-monthly sessions will appear in this calendar as soon as booking opens.";
      if (status) status.textContent = "No consultation or enquiry is required. Return here to choose, pay, and register directly.";
      return;
    }

    list.innerHTML = upcoming.map((item) => {
      const time = item.time || "Time to be confirmed";
      const timezone = item.timezone || eventsConfig.timezone || "Timezone to be confirmed";
      const available = isBookable(item);
      const status = item.status === "full" ? "Full" : available ? "Available" : "Checkout opening soon";
      return `<article class="rs-session-card"><div><span>${escapeHtml(formatDate(item.startDate))}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(time)} · ${escapeHtml(timezone)} · Zoom</p><small>${escapeHtml(status)} · ${escapeHtml(item.price || groupConfig.price || "USD 20")}</small></div><button class="rs-entry-button${available ? " rs-entry-button--primary" : ""}" type="button" data-group-session="${escapeHtml(item.id)}" aria-pressed="false" ${available ? "" : "disabled"}>${available ? "Choose this session" : status}</button></article>`;
    }).join("");
    empty.hidden = true;
    list.querySelectorAll("[data-group-session]").forEach((button) => {
      button.addEventListener("click", () => selectSession(button.dataset.groupSession));
    });
  }

  function init() {
    if (initialized) return true;
    const grid = document.getElementById("group-calendar-grid");
    const list = document.getElementById("group-session-list");
    if (!grid || !list || grid.closest("x-dc")) return false;
    initialized = true;

    document.getElementById("group-calendar-prev")?.addEventListener("click", () => {
      visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
      renderCalendar();
    });
    document.getElementById("group-calendar-next")?.addEventListener("click", () => {
      visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
      renderCalendar();
    });

    renderCalendar();
    renderSessionList();
    const firstBookable = upcoming.find(isBookable);
    if (firstBookable) selectSession(firstBookable.id);
    return true;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true });
  if (!init()) {
    const observer = new MutationObserver(() => {
      if (init()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
  }
})();
