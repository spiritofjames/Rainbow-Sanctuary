(() => {
  const selector = "[data-kids-weekly-practice-offer]";
  const statusSelector = "[data-kids-weekly-practice-status]";
  const defaultStatus = "Payment is completed securely through Stripe. Your confirmation includes the Zoom link and practical details for the first session.";
  let opening = false;
  const setStatus = (message, error = false) => {
    const status = document.querySelector(statusSelector);
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", error);
  };
  const requestId = () => globalThis.crypto?.randomUUID?.() || "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (letter) => ((Math.random() * 16 | 0) & (letter === "x" ? 15 : 3) | (letter === "x" ? 0 : 8)).toString(16));
  const restore = () => { opening = false; document.querySelectorAll(selector).forEach((button) => { button.disabled = false; button.removeAttribute("aria-busy"); }); setStatus(defaultStatus); };
  document.addEventListener("click", async (event) => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const button = target?.closest(selector);
    if (!button || opening) return;
    event.preventDefault(); opening = true; button.disabled = true; button.setAttribute("aria-busy", "true"); setStatus("Opening secure Stripe payment…");
    const offerId = button.dataset.kidsWeeklyPracticeOffer;
    try {
      const response = await fetch("/api/stripe/create-checkout-session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ offerId, eventId: offerId === "kids-weekly-practice-four-week" ? "kids-weekly-practice-2026-08-29-four-week" : "kids-weekly-practice-2026-08-29-twelve-week", requestId: requestId() }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) throw new Error(payload.error || "Secure checkout is temporarily unavailable.");
      const destination = new URL(payload.url);
      if (destination.protocol !== "https:" || destination.hostname !== "checkout.stripe.com") throw new Error("The checkout destination could not be verified.");
      window.location.assign(destination.href);
    } catch (error) { opening = false; button.disabled = false; button.removeAttribute("aria-busy"); setStatus(error.message || "Secure checkout is temporarily unavailable. Please try again.", true); }
  }, true);
  window.addEventListener("pageshow", restore); window.addEventListener("focus", restore); document.addEventListener("visibilitychange", () => { if (!document.hidden) restore(); });
})();
