/*
 * Final-input configuration for Rainbow Sanctuary.
 * Replace empty values only after James/Stephanie confirm them.
 */
window.RAINBOW_SANCTUARY_CONFIG = {
  form: {
    endpoint: "",
    method: "POST",
    provider: "",
    photoRetention: ""
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
    privacyEmail: "",
    legalEmail: "",
    accessibilityEmail: "",
    effectiveDate: "13 July 2026",
    lastReviewed: "13 July 2026",
    enquiryRetention: "",
    accessibilityResponseTime: "five business days",
    hostingProvider: "",
    formProvider: "",
    paymentProvider: ""
  },
  pricing: {
    "spiral-i": "",
    "spiral-ii": "",
    "spiral-iii": "",
    "spiral-iv": "",
    "regeneration": "",
    "earth-healer-training": "",
    "rainbow-light-codes": "",
    "crystal-healing": "",
    "intuitive-perception-training": "",
    "holographic-healing": "",
    "adult-potential-development": "",
    "unlock-the-potential": "",
    "childrens-potential-coach-certification": "",
    "one-to-one-sessions": "",
    "personal-karma-reconciliation": "",
    "family-information-field-restoration": "",
    "dna-activation": ""
  },
  events: {
    timezone: "Asia/Makassar",
    publicCalendarUrl: "",
    items: [
      /*
      {
        id: "event-unique-id",
        title: "Confirmed event title",
        category: "retreat", // retreat | adult | family | community
        startDate: "2026-10-12",
        endDate: "2026-10-15",
        location: "City, Country",
        venue: "Confirmed venue",
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

(function applyConfirmedInputs() {
  const config = window.RAINBOW_SANCTUARY_CONFIG;

  function apply(root) {
    const selectWithSelf = (selector) => [
      ...(root.matches && root.matches(selector) ? [root] : []),
      ...root.querySelectorAll(selector)
    ];

    selectWithSelf("[data-price-key]").forEach((element) => {
      const value = config.pricing[element.getAttribute("data-price-key")];
      if (value) element.textContent = value;
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => apply(document), { once: true });
  } else {
    apply(document);
  }

  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) apply(node);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
