(function publicEventFeed() {
  const config = window.RAINBOW_SANCTUARY_CONFIG?.events || {};
  const cacheKey = "rainbow-public-events-v1";
  const envelopeKeys = ["cacheVersion", "events", "generatedAt"];
  const eventKeys = [
    "capacityState", "canonicalTimezone", "category", "earlyBirdLabel", "endAt",
    "hostingMode", "id", "priceLabel", "publicLocationLabel", "publicSlug",
    "publicSummary", "publicVenueLabel", "publicationState", "publicationVersion",
    "registrationUrl", "startAt", "title", "updatedAt", "visitorLocalDisplay"
  ];

  function exactKeys(value, keys) {
    return value && typeof value === "object" &&
      Object.keys(value).sort().join("|") === keys.slice().sort().join("|");
  }

  function validDate(value) {
    return typeof value === "string" && Number.isFinite(Date.parse(value));
  }

  function validEnvelope(value) {
    if (!exactKeys(value, envelopeKeys) || !/^events-\d+$/.test(value.cacheVersion) ||
        !validDate(value.generatedAt) || !Array.isArray(value.events)) return false;
    return value.events.every((event) =>
      exactKeys(event, eventKeys) &&
      typeof event.id === "string" &&
      typeof event.publicSlug === "string" &&
      typeof event.title === "string" &&
      validDate(event.startAt) &&
      ["open", "full"].includes(event.publicationState) &&
      event.visitorLocalDisplay === true
    );
  }

  function toLegacyItem(event) {
    return {
      id: event.id,
      publicSlug: event.publicSlug,
      title: event.title,
      category: event.category,
      startDate: event.startAt.slice(0, 10),
      endDate: event.endAt ? event.endAt.slice(0, 10) : "",
      startDateTime: event.startAt,
      endDateTime: event.endAt || "",
      timezone: event.canonicalTimezone,
      location: event.publicLocationLabel || "",
      venue: event.publicVenueLabel || "",
      summary: event.publicSummary,
      price: event.priceLabel || "",
      earlyBirdPrice: event.earlyBirdLabel || "",
      status: event.publicationState,
      registrationUrl: event.registrationUrl
    };
  }

  function result(envelope, source, status) {
    return {
      cacheVersion: envelope?.cacheVersion || "",
      generatedAt: envelope?.generatedAt || "",
      items: envelope ? envelope.events.map(toLegacyItem) : [],
      source,
      status
    };
  }

  function cachedEnvelope() {
    try {
      const value = JSON.parse(window.localStorage.getItem(cacheKey) || "null");
      return validEnvelope(value) ? value : null;
    } catch (_) {
      return null;
    }
  }

  function approvedStaticResult() {
    if (!config.staticFallbackApproved || !validDate(config.staticGeneratedAt)) return null;
    return {
      cacheVersion: config.staticCacheVersion || "events-0",
      generatedAt: config.staticGeneratedAt,
      items: Array.isArray(config.items) ? config.items.slice() : [],
      source: "approved-static",
      status: "degraded"
    };
  }

  async function load() {
    if (!config.feedUrl) {
      return approvedStaticResult() || result(null, "none", "unavailable");
    }
    try {
      const response = await window.fetch(config.feedUrl, {
        headers: { accept: "application/json" },
        method: "GET"
      });
      if (!response.ok) throw new Error("Public event feed unavailable.");
      const envelope = await response.json();
      if (!validEnvelope(envelope)) throw new Error("Public event feed contract mismatch.");
      window.localStorage.setItem(cacheKey, JSON.stringify(envelope));
      return result(envelope, "live", "ready");
    } catch (_) {
      const cached = cachedEnvelope();
      if (cached) return result(cached, "last-known-safe", "degraded");
      return approvedStaticResult() || result(null, "none", "unavailable");
    }
  }

  window.RAINBOW_PUBLIC_EVENTS_READY = load();
})();
