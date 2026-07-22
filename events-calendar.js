(function () {
  const categoryNames = { group: "Group Healing", retreat: "Retreat", adult: "Adult workshop", family: "Children & Family", community: "Community" };
  const statusNames = { open: "Registration open", interest: "Register interest", full: "Currently full", cancelled: "Cancelled" };
  const config = window.RAINBOW_SANCTUARY_CONFIG?.events || { items: [] };
  const items = Array.isArray(config.items) ? config.items.filter(validEvent).slice() : [];
  const today = startOfDay(new Date());
  const firstUpcoming = items.map(event => eventDate(event.startDate)).filter(date => date >= today).sort((a, b) => a - b)[0];
  let visibleMonth = new Date((firstUpcoming || today).getFullYear(), (firstUpcoming || today).getMonth(), 1);
  const requestedFilter = new URLSearchParams(window.location.search).get("filter");
  let activeFilter = requestedFilter && categoryNames[requestedFilter] ? requestedFilter : "all";

  function validEvent(event) { return event && event.id && event.title && event.startDate && categoryNames[event.category]; }
  function eventDate(value) { return new Date(value + "T12:00:00"); }
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
  function dateRange(event) {
    const start = eventDate(event.startDate);
    const end = event.endDate ? eventDate(event.endDate) : null;
    const options = { day: "numeric", month: "short", year: "numeric" };
    if (!end || sameDate(start, end)) return start.toLocaleDateString("en", options);
    return start.toLocaleDateString("en", { day:"numeric", month:"short" }) + " – " + end.toLocaleDateString("en", options);
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
      const dayEvents = events.filter(event => sameDate(eventDate(event.startDate), date));
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
    const events = filteredItems().filter(event => eventDate(event.endDate || event.startDate) >= today && event.status !== "cancelled").sort((a, b) => eventDate(a.startDate) - eventDate(b.startDate));
    list.innerHTML = events.map(event => {
      const start = eventDate(event.startDate);
      const location = [event.venue, event.location].filter(Boolean).map(escapeHtml).join(" · ") || "Location to be confirmed";
      const registrationUrl = safeUrl(event.registrationUrl);
      const action = registrationUrl ? `<a href="${escapeHtml(registrationUrl)}">${escapeHtml(statusNames[event.status] || "View details")} →</a>` : "";
      const deadline = event.earlyBirdDeadline ? eventDate(event.earlyBirdDeadline).toLocaleDateString("en", { day:"numeric", month:"short", year:"numeric" }) : "";
      const priceLines = [
        event.earlyBirdPrice ? `Early Bird: ${event.earlyBirdPrice}${deadline ? ` until ${deadline}` : ""}` : "",
        event.price ? `Standard: ${event.price}` : "",
        event.deposit || ""
      ].filter(Boolean);
      const pricing = priceLines.length ? `<div class="rs-event-card__pricing">${priceLines.map(line => `<span>${escapeHtml(line)}</span>`).join("")}</div>` : "";
      return `<article class="rs-event-card"><div class="rs-event-date"><strong>${start.getDate()}</strong><span>${start.toLocaleDateString("en", { month:"short" })}</span></div><div><span class="rs-event-card__category">${escapeHtml(categoryNames[event.category])} · ${escapeHtml(dateRange(event))}</span><h4>${escapeHtml(event.title)}</h4><p>${location}</p>${event.summary ? `<p>${escapeHtml(event.summary)}</p>` : ""}${pricing}${action}</div></article>`;
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
