(function groupHealingBooking() {
  const eventsConfig = window.RAINBOW_SANCTUARY_CONFIG?.events || {};
  const groupConfig = eventsConfig.groupHealing || {};
  const viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const sessions = Array.isArray(eventsConfig.items)
    ? eventsConfig.items
      .filter((item) => item && item.category === "group" && item.startDate && item.status !== "cancelled")
      .sort((a, b) => eventInstant(a) - eventInstant(b))
    : [];

  const now = new Date();
  const today = startOfDay(now);
  const upcoming = sessions.filter((item) => eventInstant(item) >= now || eventDate(item.endDate || item.startDate) >= today);
  const firstUpcoming = upcoming[0] ? calendarDate(upcoming[0]) : today;
  let visibleMonth = new Date(firstUpcoming.getFullYear(), firstUpcoming.getMonth(), 1);
  let selectedId = "";
  let initialized = false;

  function eventDate(value) { return new Date(`${value}T12:00:00`); }
  function eventInstant(item) {
    const instant = item?.startDateTime ? new Date(item.startDateTime) : eventDate(item?.startDate);
    return Number.isNaN(instant.getTime()) ? eventDate(item?.startDate) : instant;
  }
  function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
  function sameDate(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function escapeHtml(value) { return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]); }
  function readableZone(zone) { return String(zone || "UTC").replace(/_/g, " "); }
  function zoneOffset(date, zone) {
    try {
      return new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "shortOffset" })
        .formatToParts(date).find((part) => part.type === "timeZoneName")?.value || "";
    } catch (_) { return ""; }
  }
  function zonedParts(date, zone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(date);
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return { year: Number(value.year), month: Number(value.month), day: Number(value.day) };
  }
  function calendarDate(item) {
    if (!item?.startDateTime) return eventDate(item.startDate);
    const parts = zonedParts(eventInstant(item), viewerTimeZone);
    return new Date(parts.year, parts.month - 1, parts.day, 12);
  }
  function localDate(item) {
    if (!item?.startDateTime) return eventDate(item.startDate).toLocaleDateString("en", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
    return new Intl.DateTimeFormat("en", {
      timeZone: viewerTimeZone, weekday:"long", day:"numeric", month:"long", year:"numeric"
    }).format(eventInstant(item));
  }
  function localTime(item) {
    if (!item?.startDateTime) return item.time || "Time to be confirmed";
    return new Intl.DateTimeFormat("en", {
      timeZone: viewerTimeZone, hour:"numeric", minute:"2-digit"
    }).format(eventInstant(item));
  }
  function localDateTime(item) {
    const offset = zoneOffset(eventInstant(item), viewerTimeZone);
    return `${localDate(item)} at ${localTime(item)} (${readableZone(viewerTimeZone)}${offset ? `, ${offset}` : ""})`;
  }
  function sourceDateTime(item) {
    const zone = item.timezone || eventsConfig.timezone || "Asia/Singapore";
    const label = item.timezoneLabel || readableZone(zone);
    if (!item.startDateTime) return `${item.time || "Time to be confirmed"} · ${label}`;
    const date = new Intl.DateTimeFormat("en", {
      timeZone: zone, weekday:"long", day:"numeric", month:"long", year:"numeric"
    }).format(eventInstant(item));
    const time = new Intl.DateTimeFormat("en", { timeZone: zone, hour:"numeric", minute:"2-digit" }).format(eventInstant(item));
    const offset = zoneOffset(eventInstant(item), zone);
    return `${date} at ${time} · ${label}${offset ? ` (${offset})` : ""}`;
  }

  function safeUrl(value) {
    if (!value || !String(value).trim()) return "";
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === "https:" ? url.href : "";
    } catch (_) { return ""; }
  }

  function checkoutUrl(item) {
    const raw = safeUrl(item.checkoutUrl) || safeUrl(groupConfig.checkoutUrl);
    if (!raw) return "";
    const url = new URL(raw);
    if (url.hostname === "buy.stripe.com" && item.id) url.searchParams.set("client_reference_id", item.id);
    return url.href;
  }

  function isBookable(item) { return item.status === "open" && Boolean(checkoutUrl(item)); }
  function sessionStatus(item) {
    if (item.status === "full") return "Full";
    if (isBookable(item)) return "Available";
    return item.status === "scheduled" ? "Date confirmed · Registration opening soon" : "Checkout opening soon";
  }

  function addTimezoneNotice() {
    const heading = document.querySelector("#choose-session .rs-entry-heading");
    if (!heading || heading.querySelector(".rs-timezone-notice")) return;
    const introduction = heading.querySelector("p");
    if (introduction) introduction.textContent = "Available twice-monthly dates appear in the calendar. Select a confirmed session to see it in your time zone; direct Stripe checkout appears here when registration opens.";
    const notice = document.createElement("p");
    notice.className = "rs-timezone-notice";
    notice.innerHTML = `<span aria-hidden="true">◷</span><span>Times are automatically shown in <strong>${escapeHtml(readableZone(viewerTimeZone))}</strong>, your detected time zone. The original schedule remains visible in Singapore time (GMT+8).</span>`;
    heading.appendChild(notice);
  }

  function selectSession(id) {
    const item = upcoming.find((candidate) => candidate.id === id);
    if (!item) return;
    selectedId = id;
    const title = document.getElementById("group-checkout-title");
    const details = document.getElementById("group-checkout-details");
    const link = document.getElementById("group-checkout-link");
    const status = document.getElementById("group-checkout-status");
    const url = checkoutUrl(item);

    title.textContent = item.title;
    details.textContent = `Your time: ${localDateTime(item)} · Zoom. Scheduled as ${sourceDateTime(item)}.`;
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
      status.textContent = "Complete the $20 payment securely through Stripe. Confirmation and Zoom access follow registration.";
    } else {
      link.hidden = true;
      link.removeAttribute("href");
      status.textContent = item.status === "full"
        ? "This session is currently full. Choose another highlighted date."
        : "The date is confirmed. Direct $20 registration will open here as soon as the Stripe payment link is connected—no consultation will be required.";
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
      const daySessions = upcoming.filter((item) => sameDate(calendarDate(item), date));
      const item = daySessions[0];
      const bookable = item && isBookable(item);
      const selected = item && item.id === selectedId;
      const labelText = date.toLocaleDateString("en", { weekday:"long", day:"numeric", month:"long" });
      const content = item
        ? `<button type="button" data-group-calendar-session="${escapeHtml(item.id)}" aria-pressed="${selected}" aria-label="${escapeHtml(`${labelText}, ${item.title}, ${sessionStatus(item)}`)}"><span>${date.getDate()}</span><i aria-hidden="true"></i></button>`
        : `<span aria-label="${escapeHtml(labelText)}">${date.getDate()}</span>`;
      cells.push(`<div class="rs-booking-day${outside ? " rs-booking-day--outside" : ""}${item ? " rs-booking-day--session" : ""}${bookable ? " rs-booking-day--available" : ""}" role="gridcell">${content}</div>`);
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
      const available = isBookable(item);
      const status = sessionStatus(item);
      return `<article class="rs-session-card"><div><span>Online group session</span><h3>${escapeHtml(item.title)}</h3><p class="rs-session-local-time">Your time: ${escapeHtml(localDateTime(item))}</p><small class="rs-session-source-time">Scheduled: ${escapeHtml(sourceDateTime(item))} · Zoom</small><small>${escapeHtml(status)} · ${escapeHtml(item.price || groupConfig.price || "USD 20")}</small></div><button class="rs-entry-button${available ? " rs-entry-button--primary" : ""}" type="button" data-group-session="${escapeHtml(item.id)}" aria-pressed="false">${available ? "Choose this session" : "View session"}</button></article>`;
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
    addTimezoneNotice();

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
    if (upcoming[0]) selectSession(upcoming[0].id);
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
