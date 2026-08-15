(() => {
  const offerSelector = "[data-maintenance-offer]";
  const statusSelector = "[data-maintenance-status]";
  const defaultStatus = "Payment is completed securely through Stripe. There is nothing to join or attend; a practical reminder is sent on each scheduled day. There is no donation option for this programme.";
  let openingCheckout = false;

  const statusElement = () => document.querySelector(statusSelector);

  const setStatus = (message, error = false) => {
    const status = statusElement();
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", error);
  };

  // `crypto.randomUUID()` is not present in some embedded and older mobile
  // browsers. The server needs a UUID-shaped id for request tracing, so keep
  // Checkout available there instead of failing before the request begins.
  const requestId = () => {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
      const value = Math.floor(Math.random() * 16);
      const nibble = character === "x" ? value : ((value & 0x3) | 0x8);
      return nibble.toString(16);
    });
  };

  const restoreCheckoutControls = () => {
    openingCheckout = false;
    document.querySelectorAll(offerSelector).forEach((button) => {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    });
    setStatus(defaultStatus);
  };

  // The design runtime may replace the price-card subtree after this deferred
  // script loads. Delegate from document instead of retaining that short-lived
  // node, so the real rendered buttons work on desktop and mobile.
  document.addEventListener("click", async (event) => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const button = target?.closest(offerSelector);
    if (!button || openingCheckout) return;

    event.preventDefault();
    const offerId = button.dataset.maintenanceOffer;
    openingCheckout = true;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    setStatus("Opening secure Stripe payment…");
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          offerId,
          eventId: offerId === "regeneration-maintenance-monthly"
            ? "regeneration-maintenance-2026-08-17-monthly"
            : "regeneration-maintenance-2026-08-17-three-month",
          requestId: requestId()
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) throw new Error(payload.error || "Secure checkout is temporarily unavailable.");
      const destination = new URL(payload.url);
      if (destination.protocol !== "https:" || destination.hostname !== "checkout.stripe.com") {
        throw new Error("The checkout destination could not be verified.");
      }
      window.location.assign(destination.href);
    } catch (error) {
      setStatus(error.message || "Secure checkout is temporarily unavailable. Please try again.", true);
      openingCheckout = false;
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  }, true);

  // Browsers commonly restore this page from their back-forward cache when a
  // visitor leaves Stripe without paying. Reset the temporary disabled state
  // so the same checkout option can always be opened again.
  window.addEventListener("pageshow", restoreCheckoutControls);
  window.addEventListener("focus", restoreCheckoutControls);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) restoreCheckoutControls();
  });

})();
