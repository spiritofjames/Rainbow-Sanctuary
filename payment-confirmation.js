(function paymentConfirmation() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id") || "";
  const internalTest = params.get("internal_test") === "1";
  const title = document.getElementById("payment-confirmation-title");
  const summary = document.getElementById("payment-confirmation-summary");
  const details = document.getElementById("payment-confirmation-details");
  const next = document.getElementById("payment-confirmation-next");
  const help = document.getElementById("payment-confirmation-help");

  const knownOfferNames = {
    "group-healing": "Online Group Healing",
    "internal-payment-test": "Internal payment-system verification"
  };

  function formatAmount(amount, currency) {
    if (!Number.isSafeInteger(amount) || !currency) return "";
    try {
      return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount / 100);
    } catch (_) {
      return "";
    }
  }

  function showDetails(result) {
    const offer = knownOfferNames[result.offer] || "Rainbow Sanctuary programme";
    const amount = formatAmount(result.amount, result.currency);
    details.innerHTML = `<div><dt>Payment status</dt><dd>Paid</dd></div><div><dt>Programme</dt><dd>${offer}</dd></div>${amount ? `<div><dt>Total paid</dt><dd>${amount}</dd></div>` : ""}`;
    details.classList.remove("is-hidden");
  }

  async function verify() {
    if (!sessionId) {
      title.textContent = "We couldn’t verify this payment return.";
      summary.textContent = "The secure payment reference is missing. If you were charged, contact us and include your Stripe receipt.";
      return;
    }

    try {
      const response = await fetch(`/api/stripe/checkout-status?session_id=${encodeURIComponent(sessionId)}`, {
        headers: { accept: "application/json" },
        cache: "no-store"
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Payment confirmation unavailable.");

      if (result.state !== "paid") {
        title.textContent = "Your payment is still being confirmed.";
        summary.textContent = "Stripe has returned you safely. We will email you once payment confirmation is complete.";
        return;
      }

      if (internalTest || result.internalTest) {
        title.textContent = "Internal payment test confirmed.";
        summary.textContent = "The USD 1 test payment was received. This test does not create a booking, programme place, client record, or Rainbow Sanctuary confirmation email.";
        help.textContent = "This internal verification is complete.";
        showDetails(result);
        return;
      }

      title.textContent = "Your payment has been received.";
      summary.textContent = "Thank you. Your place is now being prepared. A Rainbow Sanctuary team member will reach out through WhatsApp with the next steps, and we will also email your confirmation.";
      showDetails(result);
      next.classList.remove("is-hidden");
    } catch (_) {
      title.textContent = "We’re confirming your payment.";
      summary.textContent = "Stripe returned you safely. If the confirmation takes longer than a few minutes, check your email receipt or contact us for help.";
    }
  }

  verify();
})();
