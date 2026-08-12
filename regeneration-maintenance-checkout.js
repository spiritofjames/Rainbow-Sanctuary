(() => {
  const root = document.querySelector("[data-maintenance-checkout]");
  const eligibility = document.querySelector("[data-maintenance-eligibility]");
  const status = document.querySelector("[data-maintenance-status]");
  if (!root || !eligibility || !status) return;

  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", error);
  };

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-maintenance-offer]");
    if (!button) return;
    if (!eligibility.checked) {
      eligibility.focus();
      setStatus("Please confirm that you have completed ReGeneration Level I and Level II before continuing.", true);
      return;
    }

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
      const payload = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.error || "Secure checkout is temporarily unavailable.");
      window.location.assign(payload.url);
    } catch (error) {
      setStatus(error.message || "Secure checkout is temporarily unavailable. Please try again.", true);
      button.disabled = false;
    }
  });
})();
