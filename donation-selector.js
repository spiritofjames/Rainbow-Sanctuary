(function donationSelector() {
  const form = document.querySelector("[data-donation-form]");
  if (!form) return;

  const input = form.querySelector("[data-donation-input]");
  const range = form.querySelector("[data-donation-range]");
  const total = form.querySelector("[data-donation-total]");
  const status = form.querySelector("[data-donation-status]");
  const submit = form.querySelector("button[type=submit]");
  const presets = [...form.querySelectorAll("[data-donation-amount]")];
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const minimum = 5;
  const maximum = 10000;

  function amount() {
    const value = Number(input.value);
    return Number.isFinite(value) ? Math.round(value) : 0;
  }
  function paint() {
    const value = Math.max(minimum, Math.min(maximum, amount() || minimum));
    total.textContent = money.format(value);
    range.value = Math.min(1000, Math.max(minimum, value));
    presets.forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.donationAmount) === value)));
    status.textContent = "";
    status.dataset.state = "";
  }
  presets.forEach((button) => button.addEventListener("click", () => { input.value = button.dataset.donationAmount; paint(); }));
  input.addEventListener("input", paint);
  range.addEventListener("input", () => { input.value = range.value; paint(); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = amount();
    if (value < minimum || value > maximum) {
      status.textContent = `Please choose an amount between ${money.format(minimum)} and ${money.format(maximum)}.`;
      status.dataset.state = "error";
      input.focus();
      return;
    }
    submit.disabled = true;
    status.textContent = "Preparing secure checkout…";
    status.dataset.state = "ready";
    try {
      const response = await fetch("/api/stripe/create-donation-checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amountMinor: value * 100, requestId: crypto.randomUUID() }) });
      const payload = await response.json();
      if (!response.ok || !payload.url || !/^https:\/\/checkout\.stripe\.com\//.test(payload.url)) throw new Error(payload.error || "Secure checkout is temporarily unavailable.");
      window.location.assign(payload.url);
    } catch (error) {
      status.textContent = error.message || "Secure checkout is temporarily unavailable.";
      status.dataset.state = "error";
      submit.disabled = false;
    }
  });
  paint();
})();
