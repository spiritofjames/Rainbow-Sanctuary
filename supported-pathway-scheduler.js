(function supportedPathwayScheduler() {
  const page = document.querySelector("[data-supported-prefix]");
  if (!page) return;

  const prefix = page.dataset.supportedPrefix || "";
  const applyPath = page.dataset.supportedApply || "/apply";
  const viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const today = new Date();
  let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let sessions = [];
  let selected = null;

  const escapeHtml = (value) => String(value || "").replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]);
  const sameDate = (left, right) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  const sessionDate = (item) => {
    const instant = new Date(item.startDateTime);
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: viewerTimeZone, year:"numeric", month:"2-digit", day:"2-digit" }).formatToParts(instant);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return new Date(Number(values.year), Number(values.month) - 1, Number(values.day), 12);
  };
  const localDateTime = (item) => new Intl.DateTimeFormat("en", { timeZone: viewerTimeZone, weekday:"long", day:"numeric", month:"long", year:"numeric", hour:"numeric", minute:"2-digit", timeZoneName:"short" }).format(new Date(item.startDateTime));

  function renderDetails(item) {
    const title = document.getElementById("supported-session-title");
    const details = document.getElementById("supported-session-details");
    const action = document.getElementById("supported-session-action");
    if (!title || !details || !action) return;
    selected = item;
    title.textContent = item.title;
    details.textContent = `${localDateTime(item)}. ${item.venue || "Preparation details follow review."}`;
    const parameters = new URLSearchParams({ program: prefix, event: item.id });
    action.href = `${applyPath}${applyPath.includes("?") ? "&" : "?"}${parameters.toString()}`;
    action.hidden = false;
    renderCalendar();
  }

  function renderCalendar() {
    const grid = document.getElementById("supported-calendar-grid");
    const label = document.getElementById("supported-calendar-label");
    if (!grid || !label) return;
    label.textContent = visibleMonth.toLocaleDateString("en", { month:"long", year:"numeric" });
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset);
    const cells = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      const item = sessions.find((candidate) => sameDate(sessionDate(candidate), date));
      const outside = date.getMonth() !== visibleMonth.getMonth();
      const active = selected?.id === item?.id;
      const dateLabel = date.toLocaleDateString("en", { weekday:"long", day:"numeric", month:"long" });
      const content = item
        ? `<button type="button" data-supported-session="${escapeHtml(item.id)}" aria-pressed="${active}" aria-label="${escapeHtml(`${dateLabel}, ${item.title}`)}"><span>${date.getDate()}</span><i aria-hidden="true"></i></button>`
        : `<span aria-label="${escapeHtml(dateLabel)}">${date.getDate()}</span>`;
      cells.push(`<div class="rs-booking-day${outside ? " rs-booking-day--outside" : ""}${item ? " rs-booking-day--session rs-booking-day--available" : ""}" role="gridcell">${content}</div>`);
    }
    grid.innerHTML = cells.join("");
    grid.querySelectorAll("[data-supported-session]").forEach((button) => button.addEventListener("click", () => {
      renderDetails(sessions.find((item) => item.id === button.dataset.supportedSession));
    }));
  }

  function start(feed) {
    sessions = (feed?.items || []).filter((item) => item.id?.startsWith(prefix) && item.startDateTime && item.status !== "cancelled" && new Date(item.startDateTime) >= today).sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
    const first = sessions[0] ? sessionDate(sessions[0]) : today;
    visibleMonth = new Date(first.getFullYear(), first.getMonth(), 1);
    document.getElementById("supported-calendar-prev")?.addEventListener("click", () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1); renderCalendar(); });
    document.getElementById("supported-calendar-next")?.addEventListener("click", () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1); renderCalendar(); });
    renderCalendar();
    if (sessions[0]) renderDetails(sessions[0]);
  }

  Promise.resolve(window.RAINBOW_PUBLIC_EVENTS_READY).then(start).catch(() => start({ items: [] }));
})();
