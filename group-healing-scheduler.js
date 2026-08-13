(function groupHealingBooking() {
  const eventsConfig = window.RAINBOW_SANCTUARY_CONFIG?.events || {};
  const groupConfig = eventsConfig.groupHealing || {};
  const viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const now = new Date();
  const today = startOfDay(now);
  let sessions = [];
  let upcoming = [];
  let feedState = { generatedAt: eventsConfig.staticGeneratedAt || "", source: "approved-static", status: "degraded" };
  let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let chosenDateId = "";
  let selectedId = "";
  let initialized = false;

  function applyFeed(result) {
    feedState = result || feedState;
    sessions = Array.isArray(result?.items)
      ? result.items
        .filter((item) => item && item.category === "group" && item.startDate && item.status !== "cancelled")
        .sort((a, b) => eventInstant(a) - eventInstant(b))
      : [];
    upcoming = sessions.filter((item) => eventInstant(item) >= now || eventDate(item.endDate || item.startDate) >= today);
    const first = upcoming[0] ? calendarDate(upcoming[0]) : today;
    visibleMonth = new Date(first.getFullYear(), first.getMonth(), 1);
  }

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
      timeZone: viewerTimeZone, hour:"numeric", minute:"2-digit", hour12:true
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
    const time = new Intl.DateTimeFormat("en", { timeZone: zone, hour:"numeric", minute:"2-digit", hour12:true }).format(eventInstant(item));
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

  function checkoutEndpoint() {
    const value = String(groupConfig.checkoutEndpoint || "").trim();
    return value.startsWith("/") ? value : "";
  }

  function isBookable(item) {
    return item.status === "open" && Boolean(checkoutEndpoint() || checkoutUrl(item));
  }
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
    const feedNotice = document.createElement("p");
    feedNotice.className = "rs-timezone-notice";
    feedNotice.setAttribute("role", "status");
    feedNotice.innerHTML = feedState.status === "ready"
      ? `<span aria-hidden="true">✓</span><span>Live CRM schedule · updated ${escapeHtml(new Date(feedState.generatedAt).toLocaleString("en"))}.</span>`
      : feedState.status === "degraded"
        ? `<span aria-hidden="true">◷</span><span>Showing the ${feedState.source === "last-known-safe" ? "last known safe schedule" : "approved static schedule"} · timestamp ${escapeHtml(new Date(feedState.generatedAt).toLocaleString("en"))}.</span>`
        : `<span aria-hidden="true">!</span><span>The public schedule is unavailable. No unverified dates are being shown.</span>`;
    heading.appendChild(feedNotice);
  }

  function showTimeOptions(id) {
    const item = upcoming.find((candidate) => candidate.id === id);
    if (!item) return;
    chosenDateId = id;
    selectedId = "";
    const title = document.getElementById("group-checkout-title");
    const details = document.getElementById("group-checkout-details");
    const options = document.getElementById("group-time-options");
    const summary = document.getElementById("group-booking-summary");

    title.textContent = "Choose an available time";
    details.innerHTML = `<span class="rs-group-session-time"><small>Selected date</small>${escapeHtml(localDate(item))}</span><span class="rs-group-session-format"><small>Time zone</small>Times shown in ${escapeHtml(readableZone(viewerTimeZone))}.</span>`;
    options.classList.remove("is-hidden");
    options.innerHTML = `<span>Available time</span><button type="button" data-group-time="${escapeHtml(item.id)}" aria-pressed="false"><strong>${escapeHtml(localTime(item))}</strong><small>${escapeHtml(zoneOffset(eventInstant(item), viewerTimeZone) || readableZone(viewerTimeZone))}</small></button>`;
    summary.classList.add("is-hidden");
    options.querySelector("[data-group-time]")?.addEventListener("click", () => selectSession(id));
    renderCalendar();
  }

  function selectSession(id) {
    const item = upcoming.find((candidate) => candidate.id === id);
    if (!item) return;
    selectedId = id;
    const title = document.getElementById("group-checkout-title");
    const details = document.getElementById("group-checkout-details");
    const link = document.getElementById("group-checkout-link");
    const status = document.getElementById("group-checkout-status");
    const summary = document.getElementById("group-booking-summary");
    const url = checkoutUrl(item);

    title.textContent = item.title;
    details.innerHTML = `<span class="rs-group-session-time"><small>Selected date &amp; time</small>${escapeHtml(localDateTime(item))}</span><span class="rs-group-session-format"><small>Format</small>Live Zoom session</span><span class="rs-group-session-format"><small>Original schedule</small>${escapeHtml(sourceDateTime(item))}</span>`;
    summary.classList.remove("is-hidden");
    document.querySelectorAll("[data-group-time]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.groupTime === id));
    });
    document.querySelectorAll("[data-group-calendar-session]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.groupCalendarSession === chosenDateId));
    });

    if ((checkoutEndpoint() || url) && item.status === "open") {
      if (url) link.href = url;
      else link.removeAttribute("href");
      link.dataset.checkoutEventId = item.id;
      link.classList.remove("is-hidden");
      link.removeAttribute("aria-disabled");
      link.removeAttribute("tabindex");
      link.classList.remove("rs-checkout-link--pending");
      link.textContent = "Continue to secure checkout";
      status.textContent = "Complete the $22 total securely through Stripe. Payment processing is included. The booking is non-refundable and non-transferable; one reschedule may be requested at least 24 hours before the session.";
    } else {
      delete link.dataset.checkoutEventId;
      link.classList.toggle("is-hidden", item.status === "full");
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
      link.classList.toggle("rs-checkout-link--pending", item.status !== "full");
      link.textContent = "Continue to registration";
      status.textContent = item.status === "full"
        ? "This session is currently full. Choose another highlighted date."
        : "Online registration for this confirmed date is opening soon. Once available, this button will continue directly to secure $22 total payment—no consultation required.";
    }
  }

  async function beginCheckout(event) {
    const link = event.currentTarget;
    const eventId = link.dataset.checkoutEventId;
    const endpoint = checkoutEndpoint();
    if (!eventId || !endpoint) return;

    event.preventDefault();
    if (link.getAttribute("aria-busy") === "true") return;

    const status = document.getElementById("group-checkout-status");
    const originalText = link.textContent;
    link.setAttribute("aria-busy", "true");
    link.setAttribute("aria-disabled", "true");
    link.textContent = "Opening secure checkout…";
    if (status) status.textContent = "Preparing your Stripe checkout. Please keep this page open.";

    try {
      const response = await window.fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify({
          eventId,
          offerId: "group-healing",
          requestId: window.crypto.randomUUID()
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) {
        const isStaleSession = /registration is not open/i.test(String(result.error || ""));
        throw new Error(isStaleSession
          ? "This session is no longer available. Refresh the page to see the currently open dates."
          : (result.error || "Secure checkout is temporarily unavailable."));
      }
      const destination = new URL(result.url);
      if (destination.protocol !== "https:" || destination.hostname !== "checkout.stripe.com") {
        throw new Error("The checkout destination could not be verified.");
      }
      window.location.assign(destination.href);
    } catch (error) {
      link.removeAttribute("aria-busy");
      link.removeAttribute("aria-disabled");
      link.textContent = originalText;
      if (status) status.textContent = `${error.message} No payment was taken. Please try again.`;
    }
  }

  function showCheckoutReturnStatus() {
    const parameters = new URLSearchParams(window.location.search);
    const outcome = parameters.get("checkout");
    const isInternalTest = parameters.get("internal_test") === "1";
    if (!["success", "cancelled"].includes(outcome)) return;
    const heading = document.querySelector("#choose-session .rs-entry-heading");
    if (!heading || heading.querySelector(".rs-checkout-return")) return;
    const message = document.createElement("p");
    message.className = "rs-timezone-notice rs-checkout-return" + (outcome === "cancelled" ? " rs-floating-notice rs-dismissible-notice" : "");
    message.setAttribute("role", outcome === "success" ? "status" : "alert");
    message.innerHTML = isInternalTest && outcome === "success"
      ? "<span aria-hidden=\"true\">✓</span><span><strong>Internal test payment received.</strong> This verifies the Stripe Checkout return experience only; no booking, programme place, client record, or Rainbow Sanctuary confirmation email was created.</span>"
      : isInternalTest
        ? "<span aria-hidden=\"true\">↩</span><span><strong>Internal test checkout was cancelled.</strong> No payment was taken and no booking was created.</span>"
      : outcome === "success"
      ? "<span aria-hidden=\"true\">✓</span><span><strong>Payment received.</strong> Stripe will email your receipt. Registration details will follow separately.</span>"
      : "<span aria-hidden=\"true\">↩</span><span><strong>Checkout was cancelled.</strong> No payment was taken; your selected session has not been reserved.</span>";
    if (outcome === "cancelled") {
      const close = document.createElement("button");
      close.type = "button";
      close.className = "rs-notice-close";
      close.setAttribute("aria-label", "Dismiss checkout notice");
      close.textContent = "×";
      close.addEventListener("click", () => message.remove());
      message.appendChild(close);
    }
    heading.appendChild(message);
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
      const selected = item && item.id === chosenDateId;
      const labelText = date.toLocaleDateString("en", { weekday:"long", day:"numeric", month:"long" });
      const content = item
        ? `<button type="button" data-group-calendar-session="${escapeHtml(item.id)}" aria-pressed="${selected}" aria-label="${escapeHtml(`${labelText}, ${item.title}, ${sessionStatus(item)}`)}"><span>${date.getDate()}</span><i aria-hidden="true"></i></button>`
        : `<span aria-label="${escapeHtml(labelText)}">${date.getDate()}</span>`;
      cells.push(`<div class="rs-booking-day${outside ? " rs-booking-day--outside" : ""}${item ? " rs-booking-day--session" : ""}${bookable ? " rs-booking-day--available" : ""}" role="gridcell">${content}</div>`);
    }
    grid.innerHTML = cells.join("");
    grid.querySelectorAll("[data-group-calendar-session]").forEach((button) => {
      button.addEventListener("click", () => showTimeOptions(button.dataset.groupCalendarSession));
    });
  }

  function renderAvailabilityState() {
    const empty = document.getElementById("group-session-empty");
    if (!empty) return;
    if (!upcoming.length) {
      empty.classList.remove("is-hidden");
      const title = document.getElementById("group-checkout-title");
      const details = document.getElementById("group-checkout-details");
      const status = document.getElementById("group-checkout-status");
      if (title) title.textContent = "New dates are being prepared";
      if (details) details.textContent = "Confirmed twice-monthly sessions will appear in this calendar as soon as booking opens.";
      if (status) status.textContent = "No consultation or enquiry is required. Return here to choose, pay, and register directly.";
      return;
    }
    empty.classList.add("is-hidden");
  }

  function init() {
    if (initialized) return true;
    const grid = document.getElementById("group-calendar-grid");
    if (!grid || grid.closest("x-dc")) return false;
    initialized = true;
    addTimezoneNotice();
    showCheckoutReturnStatus();
    document.getElementById("group-checkout-link")?.addEventListener("click", beginCheckout);

    document.getElementById("group-calendar-prev")?.addEventListener("click", () => {
      visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
      renderCalendar();
    });
    document.getElementById("group-calendar-next")?.addEventListener("click", () => {
      visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
      renderCalendar();
    });

    renderCalendar();
    renderAvailabilityState();
    return true;
  }

  function start(result) {
    applyFeed(result);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true });
    if (!init()) {
      const observer = new MutationObserver(() => {
        if (init()) observer.disconnect();
      });
      observer.observe(document.documentElement, { childList:true, subtree:true });
    }
  }

  Promise.resolve(window.RAINBOW_PUBLIC_EVENTS_READY)
    .then(start)
    .catch(() => start({ items: [], source: "none", status: "unavailable" }));
})();
