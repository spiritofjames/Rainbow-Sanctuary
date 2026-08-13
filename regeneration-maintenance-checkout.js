(() => {
  const root = document.querySelector("[data-maintenance-checkout]");
  const status = document.querySelector("[data-maintenance-status]");
  if (!root || !status) return;

  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", error);
  };

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-maintenance-offer]");
    if (!button) return;
    const offerId = button.dataset.maintenanceOffer;
    button.disabled = true;
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
          requestId: crypto.randomUUID()
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
      button.disabled = false;
    }
  });
})();
