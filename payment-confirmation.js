(function paymentConfirmation() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id") || "";
  const internalTest = params.get("internal_test") === "1";
  const contributionReturn = params.get("contribution") === "1";
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
    const offer = result.contribution ? "Optional contribution" : (result.programmeName || knownOfferNames[result.offer] || "Rainbow Sanctuary programme");
    const amount = formatAmount(result.amount, result.currency);
    details.innerHTML = `<div><dt>Payment status</dt><dd>Paid</dd></div><div><dt>Programme</dt><dd>${offer}</dd></div>${amount ? `<div><dt>Total paid</dt><dd>${amount}</dd></div>` : ""}`;
    details.classList.remove("is-hidden");
  }

  function ordinaryPaymentCopy(result) {
    if (result.offer === "group-healing") {
      return {
        title: "Your Group Healing place is confirmed.",
        summary: "Your Zoom access and session details are being sent to the email address used at checkout.",
        nextHeading: "Your session details",
        nextText: "Your confirmation email contains your private Zoom link, the session date and time, and an Add to Calendar link. We will send a reminder one hour before the session. No WhatsApp follow-up is required for this booking.",
        helpText: "If you cannot find your confirmation within 10 minutes, check spam or contact bookings@rainbowsanctuary.life."
      };
    }

    if (String(result.offer || "").startsWith("regeneration-maintenance-")) {
      return {
        title: "Your ReGeneration Maintenance place is confirmed.",
        summary: "Your confirmation and the complete set of included dates are being sent to the email address used at checkout.",
        nextHeading: "Your next steps",
        nextText: "Your email confirms your commitment and includes the relevant dates and practical reminders. There is no Zoom call or live attendance for this programme.",
        helpText: "If you cannot find your confirmation within 10 minutes, check spam or contact bookings@rainbowsanctuary.life."
      };
    }

    return {
      title: "Your payment has been received.",
      summary: "Your purchase is confirmed. Programme or scheduling details will be sent to the email address used at checkout.",
      nextHeading: "What happens next",
      nextText: "Please check your email for your confirmation and next steps. If a direct conversation is needed for your chosen programme, the Rainbow Sanctuary team will contact you using the details you provided.",
      helpText: "If you cannot find your confirmation within 10 minutes, check spam or contact bookings@rainbowsanctuary.life."
    };
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

      if (contributionReturn || result.contribution) {
        title.textContent = "Thank you for supporting access.";
        summary.textContent = "Your optional contribution has been received. Stripe will send your receipt to the email address used at checkout.";
        next.querySelector("h2").textContent = "What happens next";
        next.querySelector("p").textContent = "Your contribution helps Rainbow Sanctuary keep selected group pathways accessible. It does not reserve a place or require any next step from you.";
        showDetails(result);
        next.classList.remove("is-hidden");
        return;
      }

      const copy = ordinaryPaymentCopy(result);
      title.textContent = copy.title;
      summary.textContent = copy.summary;
      next.querySelector("h2").textContent = copy.nextHeading;
      next.querySelector("p").textContent = copy.nextText;
      help.textContent = copy.helpText;
      showDetails(result);
      next.classList.remove("is-hidden");
    } catch (_) {
      title.textContent = "We’re confirming your payment.";
      summary.textContent = "Stripe returned you safely. If the confirmation takes longer than a few minutes, check your email receipt or contact us for help.";
    }
  }

  verify();
})();
