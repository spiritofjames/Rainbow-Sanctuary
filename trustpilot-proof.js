(() => {
  const proof = document.querySelector("[data-trustpilot-proof]");
  if (!proof) return;

  const trustpilot = window.RAINBOW_SANCTUARY_CONFIG?.trustpilot;
  const score = Number(trustpilot?.score);
  const reviewCount = Number(trustpilot?.reviewCount);
  const avatars = Array.isArray(trustpilot?.avatars) ? trustpilot.avatars : [];

  const isTrustpilotUrl = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && (url.hostname === "trustpilot.com" || url.hostname.endsWith(".trustpilot.com"));
    } catch {
      return false;
    }
  };

  const validAvatars = avatars
    .filter(({ src, alt } = {}) =>
      typeof src === "string" && /^(?:\.\/|\/)assets\//.test(src) && typeof alt === "string" && alt.trim().length > 0
    )
    .slice(0, 4);

  // Fail closed: no score, count, link, or consented imagery means no proof row.
  if (
    !trustpilot?.enabled ||
    !Number.isFinite(score) || score < 1 || score > 5 ||
    !Number.isInteger(reviewCount) || reviewCount < 1 ||
    !isTrustpilotUrl(trustpilot?.profileUrl) ||
    validAvatars.length === 0
  ) return;

  const avatarGroup = proof.querySelector("[data-trustpilot-avatars]");
  const stars = proof.querySelector("[data-trustpilot-stars]");
  const scoreLabel = proof.querySelector("[data-trustpilot-score]");
  const caption = proof.querySelector("[data-trustpilot-caption]");
  if (!avatarGroup || !stars || !scoreLabel || !caption) return;

  avatarGroup.replaceChildren(...validAvatars.map(({ src, alt }) => {
    const holder = document.createElement("span");
    holder.className = "rs-hero-trustproof__person";
    const image = document.createElement("img");
    image.src = src;
    image.alt = alt.trim();
    image.width = 68;
    image.height = 68;
    image.decoding = "async";
    holder.append(image);
    return holder;
  }));

  const formattedScore = score.toFixed(1);
  const reviewLabel = `${reviewCount.toLocaleString("en-US")} Trustpilot ${reviewCount === 1 ? "review" : "reviews"}`;
  stars.style.setProperty("--rs-rating", String(score));
  scoreLabel.textContent = `${formattedScore}/5`;
  caption.textContent = `Based on ${reviewLabel}`;
  proof.href = trustpilot.profileUrl;
  proof.setAttribute("aria-label", `Trustpilot rating ${formattedScore} out of 5, based on ${reviewLabel}. Open Trustpilot profile.`);
  proof.hidden = false;
})();
