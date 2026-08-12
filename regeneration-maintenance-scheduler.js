(function regenerationMaintenanceScheduler() {
  const prefix = "regeneration-maintenance";
  const config = window.RAINBOW_SANCTUARY_CONFIG?.events?.regenerationMaintenance || {};
  const viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const today = new Date();
  let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let sessions = [];
  let selected = null;
  let initialized = false;

  const escapeHtml = (value) => String(value || "").replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]);
  const eventInstant = (item) => new Date(item.startDateTime);
  const sameDate = (left, right) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  const dateParts = (instant) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: viewerTimeZone, year:"numeric", month:"2-digit", day:"2-digit" }).formatToParts(instant).map((part) => [part.type, part.value]));
  const calendarDate = (item) => {
    const parts = dateParts(eventInstant(item));
    return new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 12);
  };
  const localDateTime = (item) => new Intl.DateTimeFormat("en", { timeZone: viewerTimeZone, weekday:"long", day:"numeric", month:"long", year:"numeric", hour:"numeric", minute:"2-digit", hour12:true, timeZoneName:"short" }).format(eventInstant(item));

  function renderDetails(item) {
    selected = item;
    const title = document.getElementById("regeneration-checkout-title");
    const details = document.getElementById("regeneration-checkout-details");
    const summary = document.getElementById("regeneration-booking-summary");
    const link = document.getElementById("regeneration-checkout-link");
    const status = document.getElementById("regeneration-checkout-status");
    if (!title || !details || !summary || !link || !status) return;
    title.textContent = item.title;
    details.innerHTML = `<span class="rs-supported-session-time"><small>Selected date & time</small>${escapeHtml(localDateTime(item))}</span><span class="rs-supported-session-format"><small>Format</small>No live attendance required</span>`;
    summary.classList.remove("is-hidden");
    link.dataset.checkoutEventId = item.id;
    link.classList.remove("is-hidden");
    link.removeAttribute("aria-disabled");
    link.textContent = "Continue to secure registration";
    status.textContent = "Complete the USD 50 payment securely through Stripe. Your confirmation and preparation details are sent by email.";
    renderCalendar();
  }

  async function beginCheckout(event) {
    event.preventDefault();
    const link = event.currentTarget;
    const eventId = link.dataset.checkoutEventId;
    if (!eventId || link.getAttribute("aria-busy") === "true") return;
    const status = document.getElementById("regeneration-checkout-status");
    const originalText = link.textContent;
    link.setAttribute("aria-busy", "true");
    link.setAttribute("aria-disabled", "true");
    link.textContent = "Opening secure checkout…";
    if (status) status.textContent = "Preparing your Stripe checkout. Please keep this page open.";
    try {
      const response = await fetch(config.checkoutEndpoint, {
        method: "POST",
        headers: { "content-type":"application/json", accept:"application/json" },
        body: JSON.stringify({ eventId, offerId: "regeneration-maintenance", requestId: crypto.randomUUID() })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || "Secure checkout is temporarily unavailable.");
      const destination = new URL(result.url);
      if (destination.protocol !== "https:" || destination.hostname !== "checkout.stripe.com") throw new Error("The checkout destination could not be verified.");
      window.location.assign(destination.href);
    } catch (error) {
      link.removeAttribute("aria-busy");
      link.removeAttribute("aria-disabled");
      link.textContent = originalText;
      if (status) status.textContent = `${error.message} No payment was taken. Please try again.`;
    }
  }

  function renderCalendar() {
    const grid = document.getElementById("regeneration-calendar-grid");
    const label = document.getElementById("regeneration-calendar-label");
    if (!grid || !label) return;
    label.textContent = visibleMonth.toLocaleDateString("en", { month:"long", year:"numeric" });
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset);
    const cells = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      const item = sessions.find((candidate) => sameDate(calendarDate(candidate), date));
      const outside = date.getMonth() !== visibleMonth.getMonth();
      const active = selected?.id === item?.id;
      const labelText = date.toLocaleDateString("en", { weekday:"long", day:"numeric", month:"long" });
      const content = item
        ? `<button type="button" data-regeneration-session="${escapeHtml(item.id)}" aria-pressed="${active}" aria-label="${escapeHtml(`${labelText}, ${item.title}, registration open`)}"><span>${date.getDate()}</span><i aria-hidden="true"></i></button>`
        : `<span aria-label="${escapeHtml(labelText)}">${date.getDate()}</span>`;
      cells.push(`<div class="rs-booking-day${outside ? " rs-booking-day--outside" : ""}${item ? " rs-booking-day--session rs-booking-day--available" : ""}" role="gridcell">${content}</div>`);
    }
    grid.innerHTML = cells.join("");
    grid.querySelectorAll("[data-regeneration-session]").forEach((button) => button.addEventListener("click", () => renderDetails(sessions.find((item) => item.id === button.dataset.regenerationSession))));
  }

  function start(feed) {
    sessions = (feed?.items || []).filter((item) => item.id?.startsWith(prefix) && item.status === "open" && item.startDateTime && eventInstant(item) >= today).sort((a, b) => eventInstant(a) - eventInstant(b));
    const first = sessions[0] ? calendarDate(sessions[0]) : today;
    visibleMonth = new Date(first.getFullYear(), first.getMonth(), 1);
    const mount = () => {
      if (initialized || !document.querySelector("#dc-root [data-regeneration-prefix]")) return false;
      initialized = true;
      document.getElementById("regeneration-calendar-prev")?.addEventListener("click", () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1); renderCalendar(); });
      document.getElementById("regeneration-calendar-next")?.addEventListener("click", () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1); renderCalendar(); });
      document.getElementById("regeneration-checkout-link")?.addEventListener("click", beginCheckout);
      renderCalendar();
      if (sessions[0]) renderDetails(sessions[0]);
      return true;
    };
    if (!mount()) {
      const observer = new MutationObserver(() => { if (mount()) observer.disconnect(); });
      observer.observe(document.documentElement, { childList:true, subtree:true });
      window.setTimeout(() => observer.disconnect(), 3000);
    }
  }

  Promise.resolve(window.RAINBOW_PUBLIC_EVENTS_READY).then(start).catch(() => start({ items: [] }));
})();
