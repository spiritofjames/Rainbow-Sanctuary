/*
 * Final-input configuration for Rainbow Sanctuary.
 * Replace empty values only after James/Stephanie confirm them.
 */
window.RAINBOW_SANCTUARY_CONFIG = {
  form: {
    endpoint: "/api/crm/intake",
    method: "POST",
    provider: "PSN Operations Hub",
    photoProvider: "HubSpot",
    photoRetention: "30 days"
  },
  scheduling: {
    provider: "",
    acceptedApplicantUrl: ""
  },
  contact: {
    email: "",
    phone: "",
    instagram: ""
  },
  legal: {
    entityName: "",
    registeredAddress: "",
    jurisdiction: "",
    governingLaw: "",
    privacyEmail: "privacy@rainbowsanctuary.life",
    legalEmail: "",
    accessibilityEmail: "",
    effectiveDate: "13 July 2026",
    lastReviewed: "13 July 2026",
    privacyPolicyVersion: "9 August 2026",
    enquiryRetention: "",
    accessibilityResponseTime: "five business days",
    hostingProvider: "",
    formProvider: "",
    paymentProvider: ""
  },
  pricing: {
    "group-healing": "USD 22 total · payment processing included",
    "spiral-i": "USD 1,460 · Early Bird USD 1,045 · processing included",
    "spiral-ii": "USD 1,670 · Early Bird USD 1,355 · processing included",
    "spiral-iii": "USD 1,670 · Early Bird USD 1,460 · processing included",
    "spiral-iv": "USD 1,670 · Early Bird USD 1,460 · processing included",
    "regeneration": "Level I USD 3,125 · Level II USD 2,500 · processing included",
    "earth-healer-training": "Level I USD 525 · Level II USD 730 · processing included",
    "rainbow-light-codes": "",
    "crystal-healing": "USD 940 total · payment processing included",
    "intuitive-perception-training": "USD 940 total · payment processing included",
    "holographic-healing": "",
    "adult-potential-development": "USD 1,670 total · payment processing included",
    "unlock-the-potential": "",
    "childrens-potential-coach-certification": "USD 7,710 package · payment processing included",
    "one-to-one-sessions": "",
    "personal-karma-reconciliation": "",
    "family-information-field-restoration": "",
    "dna-activation": ""
  },
  earlyBirdPricing: {
    "spiral-i": { standard: "USD 1,460", earlyBird: "USD 1,045", deadline: "" },
    "spiral-ii": { standard: "USD 1,670", earlyBird: "USD 1,355", deadline: "" },
    "spiral-iii": { standard: "USD 1,670", earlyBird: "USD 1,460", deadline: "" },
    "spiral-iv": { standard: "USD 1,670", earlyBird: "USD 1,460", deadline: "" }
  },
  events: {
    feedUrl: "",
    staticFallbackApproved: true,
    staticGeneratedAt: "2026-07-25T10:00:00.000Z",
    staticCacheVersion: "events-1",
    // Beijing is the single authoring time zone for Rainbow Sanctuary's supported group pathways.
    timezone: "Asia/Shanghai",
    groupHealing: {
      frequency: "Twice monthly",
      duration: "Approximately 60 minutes",
      price: "USD 22",
      checkoutEndpoint: "/api/stripe/create-checkout-session",
      checkoutUrl: ""
    },
    privateSchedules: {
      "144-stages-maintenance": {
        timezone: "Asia/Shanghai",
        startDateTime: "2026-08-17T23:00:00+08:00",
        firstCycle: { frequency: "weekly", sessions: 13 },
        afterFirstCycle: { frequency: "twice-monthly", status: "requires-team-approved-dates" },
        deliveryMode: "remote-no-attendance",
        operationsCalendar: "private-only"
      }
    },
    publicCalendarUrl: "",
    items: [
      {
        id: "group-healing-2026-08-22",
        title: "Grounding & Renewal",
        category: "group",
        startDate: "2026-08-22",
        startDateTime: "2026-08-22T20:00:00+08:00",
        time: "20:00",
        timezone: "Asia/Singapore",
        timezoneLabel: "Singapore time",
        location: "Online",
        venue: "Zoom",
        summary: "A guided Group Healing session for grounding, rest, and renewal.",
        duration: "Approximately 60 minutes",
        price: "USD 22",
        // Protected staging uses Stripe test mode for generated Stage 1 CRM acceptance.
        // Do not promote this status to main until live checkout is separately approved.
        status: "open",
        registrationUrl: "/group-healing#choose-session",
        checkoutUrl: ""
      },
      {
        id: "autism-family-support-2026-08-18",
        title: "Autism & Family Support",
        category: "family",
        startDate: "2026-08-18",
        startDateTime: "2026-08-18T23:00:00+08:00",
        timezone: "Asia/Shanghai",
        timezoneLabel: "Beijing time",
        location: "Remote preparation",
        venue: "No live attendance required",
        summary: "A free, scheduled, non-clinical wellbeing practice for autistic people and families.",
        price: "Free · optional contribution is separate",
        status: "interest",
        registrationUrl: "/autism-family-support"
      },
      {
        id: "autism-family-support-2026-08-25",
        title: "Autism & Family Support",
        category: "family",
        startDate: "2026-08-25",
        startDateTime: "2026-08-25T23:00:00+08:00",
        timezone: "Asia/Shanghai",
        timezoneLabel: "Beijing time",
        location: "Remote preparation",
        venue: "No live attendance required",
        summary: "A free, scheduled, non-clinical wellbeing practice for autistic people and families.",
        price: "Free · optional contribution is separate",
        status: "interest",
        registrationUrl: "/autism-family-support"
      },
      {
        id: "autism-family-support-2026-09-01",
        title: "Autism & Family Support",
        category: "family",
        startDate: "2026-09-01",
        startDateTime: "2026-09-01T23:00:00+08:00",
        timezone: "Asia/Shanghai",
        timezoneLabel: "Beijing time",
        location: "Remote preparation",
        venue: "No live attendance required",
        summary: "A free, scheduled, non-clinical wellbeing practice for autistic people and families.",
        price: "Free · optional contribution is separate",
        status: "interest",
        registrationUrl: "/autism-family-support"
      },
      {
        id: "young-people-wellbeing-2026-09-01",
        title: "Young People’s Wellbeing Support",
        category: "group",
        startDate: "2026-09-01",
        startDateTime: "2026-09-01T23:00:00+08:00",
        timezone: "Asia/Shanghai",
        timezoneLabel: "Beijing time",
        location: "Remote preparation",
        venue: "Review required before enrolment",
        summary: "A reviewed, non-clinical monthly wellbeing pathway for young people up to age 25.",
        price: "Free · optional contribution is separate",
        status: "interest",
        registrationUrl: "/young-people-wellbeing"
      },
      {
        id: "young-people-wellbeing-2026-10-06",
        title: "Young People’s Wellbeing Support",
        category: "group",
        startDate: "2026-10-06",
        startDateTime: "2026-10-06T23:00:00+08:00",
        timezone: "Asia/Shanghai",
        timezoneLabel: "Beijing time",
        location: "Remote preparation",
        venue: "Review required before enrolment",
        summary: "A reviewed, non-clinical monthly wellbeing pathway for young people up to age 25.",
        price: "Free · optional contribution is separate",
        status: "interest",
        registrationUrl: "/young-people-wellbeing"
      },
      {
        id: "144-stages-maintenance-2026-08-17",
        title: "144 Stages Maintenance",
        category: "group",
        startDate: "2026-08-17",
        startDateTime: "2026-08-17T23:00:00+08:00",
        timezone: "Asia/Shanghai",
        timezoneLabel: "Beijing time",
        location: "Private pathway",
        venue: "Accepted participants only",
        summary: "A scheduled private maintenance session. Details are sent only to accepted participants.",
        price: "USD 50 per confirmed session",
        status: "scheduled",
        registrationUrl: "/144-stages-maintenance"
      },
      {
        id: "awakening-inner-light-2026",
        title: "Awakening Your Inner Light",
        category: "retreat",
        startDate: "2026-10-01",
        endDate: "2026-10-07",
        location: "Bocas del Toro, Panama",
        venue: "Jungle sanctuary",
        summary: "A seven-day, six-night plant-medicine retreat with preparation, facilitated ceremonies, daily practices, and integration support.",
        price: "USD 3,500 per person",
        earlyBirdPrice: "USD 3,000 per person",
        earlyBirdDeadline: "2026-09-01",
        deposit: "50% deposit required for the early-bird rate",
        status: "interest",
        registrationUrl: "/awakening-your-inner-light-2026"
      }
      /*
      {
        id: "group-healing-2026-08-01",
        title: "Grounding & Renewal",
        category: "group",
        startDate: "2026-08-01",
        time: "18:00",
        timezone: "Asia/Makassar",
        location: "Online",
        venue: "Zoom",
        summary: "A guided Group Healing session for grounding, rest, and renewal.",
        price: "USD 22",
        status: "open",
        checkoutUrl: "https://buy.stripe.com/REPLACE_WITH_PAYMENT_LINK"
      },
      {
        id: "event-unique-id",
        title: "Confirmed event title",
        category: "group", // group | retreat | adult | family | community
        startDate: "2026-10-12",
        endDate: "2026-10-15",
        time: "18:00",
        timezone: "Asia/Makassar",
        location: "Online",
        venue: "Zoom",
        summary: "One factual sentence describing the event.",
        status: "open", // open | interest | full | cancelled
        registrationUrl: "https://..."
      }
      */
    ]
  },
  images: {
    "home-spiral": {
      src: "./assets/editorial/home-spiral-editorial.jpg",
      alt: "Adults in a quiet reflective workshop",
      position: "52% 40%"
    },
    "home-family": {
      src: "./assets/editorial/home-family-editorial.jpg",
      alt: "A parent accompanying a child in a creative activity",
      position: "50% 39%"
    },
    "home-community": {
      src: "./assets/editorial/home-community-editorial.jpg",
      alt: "Adults sharing tea at a small tropical gathering",
      position: "50% 45%"
    },
    "testimonial-madley": { src: "", alt: "Madley Pondor" },
    "testimonial-irene": { src: "", alt: "Irene" },
    "testimonial-leann": { src: "", alt: "Leann" },
    "testimonial-jashley": { src: "", alt: "Jashley" }
  }
};

(function loadPersonaFaqSystem() {
  if (!document.querySelector('link[href*="persona-faqs.css"]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "./persona-faqs.css?v=20260723-1";
    document.head.appendChild(stylesheet);
  }
  if (!document.querySelector('script[src*="persona-faqs.js"]')) {
    const script = document.createElement("script");
    script.src = "./persona-faqs.js?v=20260723-1";
    script.defer = true;
    document.head.appendChild(script);
  }
})();

(function showPaymentReturnStatus() {
  const parameters = new URLSearchParams(window.location.search);
  const checkoutStatus = parameters.get("checkout");
  if (checkoutStatus !== "success" && checkoutStatus !== "cancelled") return;

  const render = () => {
    if (document.querySelector(".rs-commerce-return")) return;
    const notice = document.createElement("aside");
    notice.className = `rs-commerce-return rs-commerce-return--${checkoutStatus} rs-floating-notice rs-dismissible-notice`;
    notice.setAttribute("role", checkoutStatus === "success" ? "status" : "alert");
    notice.innerHTML = checkoutStatus === "success"
      ? "<strong>Thank you.</strong> Stripe is confirming your payment. We will email the next steps after the payment has been verified."
      : "<strong>Payment not completed.</strong> No purchase was confirmed. You may use the original secure payment link when you are ready, or contact payments@rainbowsanctuary.life.";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "rs-notice-close";
    close.setAttribute("aria-label", "Dismiss payment notice");
    close.textContent = "×";
    close.addEventListener("click", () => notice.remove());
    notice.appendChild(close);
    const main = document.querySelector("main") || document.body;
    main.prepend(notice);
    notice.scrollIntoView({ block: "start" });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    render();
  }
})();

(function applyConfirmedInputs() {
  const config = window.RAINBOW_SANCTUARY_CONFIG;

  function apply(root) {
    const selectWithSelf = (selector) => [
      ...(root.matches && root.matches(selector) ? [root] : []),
      ...root.querySelectorAll(selector)
    ];

    // Keep visitor-facing time copy consistent without changing the ISO schedule data.
    // Limit this to rendered page content so scripts and configuration remain untouched.
    selectWithSelf("main, footer").forEach((section) => {
      const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      textNodes.forEach((node) => {
        node.nodeValue = node.nodeValue
          .replace(/23:00 Beijing time \(UTC\+8\)/g, "11:00 PM Beijing time (UTC+8)")
          .replace(/23:00 Beijing \(UTC\+8\)/g, "11:00 PM Beijing time (UTC+8)")
          .replace(/23:00 Beijing time/g, "11:00 PM Beijing time")
          .replace(/22:00 Beijing time/g, "10:00 PM Beijing time");
      });
    });

    selectWithSelf("[data-price-key]").forEach((element) => {
      const value = config.pricing[element.getAttribute("data-price-key")];
      if (value) element.textContent = value;
    });

    selectWithSelf("[data-early-bird-key]").forEach((element) => {
      const value = config.earlyBirdPricing[element.getAttribute("data-early-bird-key")];
      if (!value) return;
      const standard = element.querySelector(".rs-price-standard strong");
      const earlyBird = element.querySelector(".rs-price-early-bird strong");
      const deadline = element.querySelector(".rs-price-deadline");
      if (standard && value.standard) standard.textContent = value.standard;
      if (earlyBird && value.earlyBird) earlyBird.textContent = value.earlyBird;
      if (deadline) deadline.textContent = value.deadline
        ? `Register by ${value.deadline}`
        : "Deadline to be announced";
    });

    selectWithSelf("[data-image-key]").forEach((element) => {
      const value = config.images[element.getAttribute("data-image-key")];
      if (!value || !value.src || element.dataset.imageApplied === "true") return;

      const image = document.createElement("img");
      image.src = value.src;
      image.alt = value.alt || "";
      image.loading = element.getAttribute("data-image-priority") === "true" ? "eager" : "lazy";
      image.decoding = "async";
      image.style.width = "100%";
      image.style.height = "100%";
      image.style.objectFit = "cover";
      image.style.objectPosition = value.position || "center";
      element.dataset.imageApplied = "true";
      if (element.matches("image-slot")) {
        element.replaceWith(image);
      } else {
        element.replaceChildren(image);
      }
    });

    selectWithSelf("[data-legal-key]").forEach((element) => {
      const value = config.legal && config.legal[element.getAttribute("data-legal-key")];
      if (value) element.textContent = value;
    });

    selectWithSelf("[data-legal-email]").forEach((element) => {
      const value = config.legal && config.legal[element.getAttribute("data-legal-email")];
      if (!value) return;
      element.textContent = value;
      element.setAttribute("href", `mailto:${value}`);
    });

    selectWithSelf(".rs-disclaimer").forEach((element) => element.remove());
    selectWithSelf("details").forEach((element) => {
      const question = element.querySelector("summary")?.textContent?.trim();
      if (question === "Is this medical or psychological treatment?") element.remove();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => apply(document), { once: true });
  } else {
    apply(document);
  }
  setTimeout(() => apply(document), 0);
  setTimeout(() => apply(document), 250);

  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) apply(node);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
