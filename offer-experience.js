(function offerExperience() {
  function boot() {
    const page = document.querySelector(".rs-offer-page");
    if (!page || page.dataset.experienceReady === "true") return;
    page.dataset.experienceReady = "true";
    page.classList.add("rs-experience-active");

    const progress = document.createElement("div");
    progress.className = "rs-page-progress";
    progress.setAttribute("aria-hidden", "true");
    progress.style.setProperty("--offer-accent", getComputedStyle(page).getPropertyValue("--offer-accent"));
    progress.innerHTML = "<span></span>";
    document.body.appendChild(progress);

    const progressBar = progress.firstElementChild;
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = `${max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0}%`;
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveals = [...page.querySelectorAll(".rs-reveal")];
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach((element) => element.classList.add("is-visible"));
    } else {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      reveals.forEach((element) => revealObserver.observe(element));
    }

    const navLinks = [...page.querySelectorAll(".rs-section-nav a")];
    const sections = navLinks
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);
    if (sections.length && "IntersectionObserver" in window) {
      const sectionObserver = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => {
          const current = link.getAttribute("href") === `#${visible.target.id}`;
          if (current) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      }, { rootMargin: "-18% 0px -68% 0px", threshold: [0, .2, .5] });
      sections.forEach((section) => sectionObserver.observe(section));
    }

    page.querySelectorAll(".rs-filter-button").forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        page.querySelectorAll(".rs-filter-button").forEach((candidate) => {
          candidate.setAttribute("aria-pressed", String(candidate === button));
        });
        page.querySelectorAll(".rs-filter-card").forEach((card) => {
          card.hidden = filter !== "all" && !card.dataset.category.split(" ").includes(filter);
        });
      });
    });

    page.querySelectorAll(".rs-accordion details").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (!details.open) return;
        const group = details.closest(".rs-accordion");
        group.querySelectorAll("details[open]").forEach((other) => {
          if (other !== details) other.open = false;
        });
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  new MutationObserver(boot).observe(document.documentElement, { childList: true, subtree: true });
})();
