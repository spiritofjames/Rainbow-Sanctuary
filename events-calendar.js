(function () {
  const categoryNames = { group: "Group Healing", retreat: "Retreat", adult: "Adult workshop", family: "Children & Family", community: "Community" };
  const statusNames = { open: "Registration open", scheduled: "View confirmed date", interest: "Register interest", full: "Currently full", cancelled: "Cancelled" };
  const config = window.RAINBOW_SANCTUARY_CONFIG?.events || { items: [] };
  const viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const items = Array.isArray(config.items) ? config.items.filter(validEvent).slice() : [];
  const today = startOfDay(new Date());
  const firstUpcomingItem = items.filter((event) => eventInstant(event) >= new Date()).sort((a, b) => eventInstant(a) - eventInstant(b))[0];
  const firstUpcoming = firstUpcomingItem ? calendarDate(firstUpcomingItem) : today;
  let visibleMonth = new Date(firstUpcoming.getFullYear(), firstUpcoming.getMonth(), 1);
  const requestedFilter = new URLSearchParams(window.location.search).get("filter");
  let activeFilter = requestedFilter && categoryNames[requestedFilter] ? requestedFilter : "all";

  function validEvent(event) { return event && event.id && event.title && event.startDate && categoryNames[event.category]; }
  function eventDate(value) { return new Date(value + "T12:00:00"); }
  function eventInstant(event) {
    const instant = event?.startDateTime ? new Date(event.startDateTime) : eventDate(event?.startDate);
    return Number.isNaN(instant.getTime()) ? eventDate(event?.startDate) : instant;
  }
  function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
  function escapeHtml(value) { return String(value || "").replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[char])); }
  function safeUrl(value) {
    if (!value || !String(value).trim()) return "";
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_) { return ""; }
  }
  function filteredItems() { return items.filter(event => activeFilter === "all" || event.category === activeFilter); }
  function sameDate(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function readableZone(zone) { return String(zone || "UTC").replace(/_/g, " "); }
  function zoneOffset(date, zone) {
    try {
      return new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "shortOffset" })
        .formatToParts(date).find((part) => part.type === "timeZoneName")?.value || "";
    } catch (_) { return ""; }
  }
  function zonedParts(date, zone) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year:"numeric", month:"2-digit", day:"2-digit" }).formatToParts(date);
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return { year:Number(value.year), month:Number(value.month), day:Number(value.day) };
  }
  function calendarDate(event) {
    if (!event?.startDateTime) return eventDate(event.startDate);
    const parts = zonedParts(eventInstant(event), viewerTimeZone);
    return new Date(parts.year, parts.month - 1, parts.day, 12);
  }
  function localDateTime(event) {
    if (!event?.startDateTime) return "";
    const instant = eventInstant(event);
    const date = new Intl.DateTimeFormat("en", { timeZone:viewerTimeZone, weekday:"short", day:"numeric", month:"short", year:"numeric" }).format(instant);
    const time = new Intl.DateTimeFormat("en", { timeZone:viewerTimeZone, hour:"numeric", minute:"2-digit" }).format(instant);
    const offset = zoneOffset(instant, viewerTimeZone);
    return `${date} at ${time} · ${readableZone(viewerTimeZone)}${offset ? ` (${offset})` : ""}`;
  }
  function sourceDateTime(event) {
    if (!event?.startDateTime) return "";
    const instant = eventInstant(event);
    const zone = event.timezone || config.timezone || "Asia/Singapore";
    const label = event.timezoneLabel || readableZone(zone);
    const date = new Intl.DateTimeFormat("en", { timeZone:zone, day:"numeric", month:"short", year:"numeric" }).format(instant);
    const time = new Intl.DateTimeFormat("en", { timeZone:zone, hour:"numeric", minute:"2-digit" }).format(instant);
    const offset = zoneOffset(instant, zone);
    return `${date} at ${time} · ${label}${offset ? ` (${offset})` : ""}`;
  }
  function dateRange(event) {
    if (event.startDateTime) return localDateTime(event).split(" at ")[0];
    const start = eventDate(event.startDate);
    const end = event.endDate ? eventDate(event.endDate) : null;
    const options = { day: "numeric", month: "short", year: "numeric" };
    if (!end || sameDate(start, end)) return start.toLocaleDateString("en", options);
    return start.toLocaleDateString("en", { day:"numeric", month:"short" }) + " – " + end.toLocaleDateString("en", options);
  }

  function addTimezoneNotice() {
    const heading = document.querySelector("#calendar .rs-events-heading");
    if (!heading || heading.querySelector(".rs-events-timezone")) return;
    const notice = document.createElement("p");
    notice.className = "rs-events-timezone";
    notice.innerHTML = `Online times are automatically shown in <strong>${escapeHtml(readableZone(viewerTimeZone))}</strong>, your detected time zone. Each event also keeps its original organizer time visible.`;
    heading.appendChild(notice);
  }

  function renderCalendar() {
    const grid = document.getElementById("events-calendar-grid");
    const label = document.getElementById("events-month-label");
    if (!grid || !label) return;
    label.textContent = visibleMonth.toLocaleDateString("en", { month:"long", year:"numeric" });
    const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const mondayOffset = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - mondayOffset);
    const events = filteredItems();
    const cells = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      const dayEvents = events.filter(event => sameDate(calendarDate(event), date));
      const outside = date.getMonth() !== visibleMonth.getMonth();
      const isToday = sameDate(date, today);
      const pills = dayEvents.map(event => `<span class="rs-calendar-pill" data-category="${event.category}" title="${escapeHtml(event.title)}">${escapeHtml(event.title)}</span>`).join("");
      cells.push(`<div class="rs-calendar-day${outside ? " rs-calendar-day--outside" : ""}${isToday ? " rs-calendar-day--today" : ""}" role="gridcell" aria-label="${date.toLocaleDateString("en", { weekday:"long", day:"numeric", month:"long" })}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ""}"><span class="rs-calendar-day__number">${date.getDate()}</span><span class="rs-calendar-day__events">${pills}</span></div>`);
    }
    grid.innerHTML = cells.join("");
  }

  function renderUpcoming() {
    const list = document.getElementById("events-upcoming-list");
    const empty = document.getElementById("events-empty");
    if (!list || !empty) return;
    const events = filteredItems().filter(event => eventInstant(event) >= new Date() && event.status !== "cancelled").sort((a, b) => eventInstant(a) - eventInstant(b));
    list.innerHTML = events.map(event => {
      const start = calendarDate(event);
      const location = [event.venue, event.location].filter(Boolean).map(escapeHtml).join(" · ") || "Location to be confirmed";
      const registrationUrl = safeUrl(event.registrationUrl);
      const action = registrationUrl ? `<a href="${escapeHtml(registrationUrl)}">${escapeHtml(statusNames[event.status] || "View details")} →</a>` : "";
      const deadline = event.earlyBirdDeadline ? eventDate(event.earlyBirdDeadline).toLocaleDateString("en", { day:"numeric", month:"short", year:"numeric" }) : "";
      const priceLines = [
        event.earlyBirdPrice ? `Early Bird: ${event.earlyBirdPrice}${deadline ? ` until ${deadline}` : ""}` : "",
        event.price ? `${event.earlyBirdPrice ? "Standard" : "Price"}: ${event.price}` : "",
        event.deposit || ""
      ].filter(Boolean);
      const pricing = priceLines.length ? `<div class="rs-event-card__pricing">${priceLines.map(line => `<span>${escapeHtml(line)}</span>`).join("")}</div>` : "";
      const timing = event.startDateTime
        ? `<p class="rs-event-card__time">Your time: ${escapeHtml(localDateTime(event))}</p><small class="rs-event-card__source-time">Scheduled: ${escapeHtml(sourceDateTime(event))}</small>`
        : "";
      return `<article class="rs-event-card"><div class="rs-event-date"><strong>${start.getDate()}</strong><span>${start.toLocaleDateString("en", { month:"short" })}</span></div><div><span class="rs-event-card__category">${escapeHtml(categoryNames[event.category])} · ${escapeHtml(dateRange(event))}</span><h4>${escapeHtml(event.title)}</h4><p>${location}</p>${timing}${event.summary ? `<p>${escapeHtml(event.summary)}</p>` : ""}${pricing}${action}</div></article>`;
    }).join("");
    empty.hidden = events.length > 0;
  }

  function render() { renderCalendar(); renderUpcoming(); }
  let initialized = false;
  function init() {
    if (initialized) return true;
    const calendarGrid = document.getElementById("events-calendar-grid");
    if (!calendarGrid || !document.getElementById("events-upcoming-list") || calendarGrid.closest("x-dc")) return false;
    initialized = true;
    addTimezoneNotice();
    document.querySelectorAll("[data-event-filter]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.eventFilter === activeFilter));
      button.addEventListener("click", function () {
        activeFilter = button.dataset.eventFilter;
        document.querySelectorAll("[data-event-filter]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
        render();
      });
    });
    document.getElementById("events-prev-month")?.addEventListener("click", () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1); renderCalendar(); });
    document.getElementById("events-next-month")?.addEventListener("click", () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1); renderCalendar(); });
    const publicLink = document.getElementById("events-calendar-link");
    const publicCalendarUrl = safeUrl(config.publicCalendarUrl);
    if (publicLink && publicCalendarUrl) {
      publicLink.href = publicCalendarUrl;
      publicLink.hidden = false;
      publicLink.style.display = "inline-flex";
    }
    render();
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
