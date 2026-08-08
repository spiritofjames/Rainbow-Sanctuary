(function rainbowOfferCheckout() {
  const config = window.RAINBOW_SANCTUARY_CONFIG?.commerce || {};
  const endpoint = String(config.checkoutEndpoint || "/api/stripe/create-checkout-session");
  const catalogEndpoint = String(config.catalogEndpoint || "/api/stripe/catalog");

  function formatMoney(amountMinor, currency) {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(amountMinor / 100);
  }

  function safeButton(label, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `rs-button rs-cta-interactive rs-cta-enter rs-cta-final ${className}`.trim();
    button.textContent = label;
    return button;
  }

  async function openCheckout(variant, button, status) {
    if (!variant?.checkoutAvailable || button.getAttribute("aria-busy") === "true") return;
    const original = button.textContent;
    button.setAttribute("aria-busy", "true");
    button.disabled = true;
    button.textContent = "Opening secure checkout…";
    status.textContent = "Preparing your Stripe checkout. No payment has been taken yet.";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify({
          offerId: variant.id,
          requestId: crypto.randomUUID()
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) {
        throw new Error(result.error || "Secure checkout is temporarily unavailable.");
      }
      const destination = new URL(result.url);
      if (destination.protocol !== "https:" || destination.hostname !== "checkout.stripe.com") {
        throw new Error("The checkout destination could not be verified.");
      }
      window.location.assign(destination.href);
    } catch (error) {
      button.removeAttribute("aria-busy");
      button.disabled = false;
      button.textContent = original;
      status.textContent = `${error.message} No payment was taken.`;
    }
  }

  function buildVariantDialog(offer, status) {
    const dialog = document.createElement("dialog");
    dialog.className = "rs-purchase-dialog";
    dialog.setAttribute("aria-labelledby", "rs-purchase-dialog-title");
    const panel = document.createElement("div");
    panel.className = "rs-purchase-dialog__panel";
    panel.innerHTML = `
      <div class="rs-purchase-dialog__head">
        <div>
          <span class="rs-entry-kicker">Secure programme payment</span>
          <h2 id="rs-purchase-dialog-title">${offer.name}</h2>
        </div>
        <button type="button" class="rs-purchase-dialog__close" aria-label="Close payment options">×</button>
      </div>
      <p>Choose the programme option confirmed for you. Payment processing is already included in the total shown.</p>
      <div class="rs-purchase-dialog__options"></div>
      <p class="rs-commerce-note">Programme scheduling and participation details are confirmed separately. Mandatory consumer rights remain unaffected.</p>
    `;
    dialog.appendChild(panel);
    document.body.appendChild(dialog);

    panel.querySelector(".rs-purchase-dialog__close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    const options = panel.querySelector(".rs-purchase-dialog__options");
    for (const variant of offer.variants) {
      const option = safeButton(
        `${variant.name} · ${formatMoney(variant.amountMinor, variant.currency)}`,
        "rs-purchase-dialog__option"
      );
      option.disabled = !variant.checkoutAvailable;
      if (!variant.checkoutAvailable) option.textContent += " · Not currently open";
      option.addEventListener("click", () => openCheckout(variant, option, status));
      options.appendChild(option);
    }
    return dialog;
  }

  function applyOffer(offer, processingLabel, taxLabel) {
    if (!offer || offer.id === "group-healing") return;
    const actions = document.querySelector(".rs-offer-hero__actions");
    if (!actions || actions.querySelector("[data-rs-purchase]")) return;
    const price = document.querySelector(`[data-price-key="${offer.priceKey}"]`);
    if (price) {
      price.textContent = offer.variants
        .map((variant) => {
          const option = variant.name.split("—").pop().trim();
          return `${option} ${formatMoney(variant.amountMinor, variant.currency)}`;
        })
        .join(" · ");
      price.setAttribute("aria-label", `${offer.name} prices; ${processingLabel}`);
    }

    const available = offer.variants.filter((variant) => variant.checkoutAvailable);
    const purchase = safeButton(
      available.length ? "Purchase securely" : "Purchase opening soon",
      "rs-button--purchase"
    );
    purchase.dataset.rsPurchase = offer.id;
    purchase.disabled = available.length === 0;
    actions.appendChild(purchase);

    const status = document.createElement("p");
    status.className = "rs-commerce-status";
    status.setAttribute("role", "status");
    status.textContent = `${processingLabel}. ${taxLabel}`;
    actions.insertAdjacentElement("afterend", status);

    const dialog = buildVariantDialog(offer, status);
    purchase.addEventListener("click", () => {
      if (available.length === 1) openCheckout(available[0], purchase, status);
      else dialog.showModal();
    });
  }

  function checkoutReturnStatus() {
    const outcome = new URLSearchParams(window.location.search).get("checkout");
    if (!["success", "cancelled"].includes(outcome)) return;
    const actions = document.querySelector(".rs-offer-hero__actions");
    if (!actions) return;
    const message = document.createElement("p");
    message.className = "rs-commerce-return";
    message.setAttribute("role", outcome === "success" ? "status" : "alert");
    message.textContent = outcome === "success"
      ? "Payment received. Stripe sends the financial receipt, and Rainbow Sanctuary sends the programme confirmation separately."
      : "Checkout was cancelled. No payment was taken.";
    actions.insertAdjacentElement("afterend", message);
  }

  async function initialize() {
    checkoutReturnStatus();
    try {
      const response = await fetch(catalogEndpoint, { headers: { accept: "application/json" } });
      if (!response.ok) return;
      const catalog = await response.json();
      const offer = catalog.offers?.find((entry) => entry.pagePath === window.location.pathname);
      applyOffer(
        offer,
        catalog.processingLabel || "Payment processing included",
        catalog.taxLabel || "Tax treatment will be confirmed before live release."
      );
    } catch (_) {
      // Enquiry remains available if the governed payment catalogue is unavailable.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
