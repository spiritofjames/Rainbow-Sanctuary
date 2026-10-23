import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(scriptsDir, "..");
const origin = "https://rainbowsanctuary.life";
const retreatFaqs = JSON.parse(fs.readFileSync(path.join(siteDir, "data/december-retreat-faqs.json"), "utf8"));
const lastmod = "2026-07-31";
const routeLastmod = new Map([
  ["/", "2026-10-23"],
  ["/awakening-your-inner-light-2026", "2026-10-23"],
  ["/awakening-your-inner-light-october-2026", "2026-10-23"],
  ["/events", "2026-10-23"],
  ["/apply", "2026-10-22"]
]);
// Keep operational jobs in the generated Vercel configuration. Discovery
// publishing runs as part of every release, so dropping this would silently
// disable the Monday Maintenance reminder.
const crons = [
  {
    path: "/api/jobs/regeneration-maintenance-reminders",
    schedule: "15 1 * * 1"
  },
  {
    path: "/api/jobs/kids-weekly-practice-reminders",
    schedule: "0 11 * * 6"
  }
];
const headers = [
  {
    source: "/guardian/(.*)",
    headers: [
      {
        key: "X-Robots-Tag",
        value: "noindex, nofollow, noarchive"
      },
      {
        key: "Content-Security-Policy",
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self'; connect-src 'self' https://api.github.com https://github.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
      }
    ]
  },
  {
    source: "/assets/documents/awakening-your-inner-light-retreat-2026.pdf",
    headers: [
      {
        key: "X-Robots-Tag",
        value: "noindex, nofollow, noarchive"
      }
    ]
  },
  {
    source: "/(.*)",
    headers: [
      {
        key: "Content-Security-Policy",
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://www.youtube.com/iframe_api https://www.youtube.com/s/player/; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self'; connect-src 'self' https://api.github.com https://github.com; frame-src 'self' https://www.youtube-nocookie.com/embed/bqe-GyjWn4U https://www.youtube-nocookie.com/embed/C6KVdON7Ju0 https://www.youtube-nocookie.com/embed/TKcncu9DIEc https://open.spotify.com/embed/track/2WxJlY7NsAqeQ52lJMJYwU; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()"
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin"
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff"
      },
      {
        key: "X-Frame-Options",
        value: "DENY"
      }
    ]
  },
  {
    source: "/(.*)",
    has: [{ type: "host", value: "staging.rainbowsanctuary.life" }],
    headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]
  }
];

const baseRoutes = {
  "Home.dc.html": "/",
  "About-Stephanie.dc.html": "/about",
  "1-1-Sessions.dc.html": "/private-healing",
  "Accessibility-Statement.dc.html": "/accessibility",
  "Adult-Potential-Development.dc.html": "/adult-potential-development",
  "Autism-Family-Support.dc.html": "/autism-family-support",
  "Awakening-Your-Inner-Light-2026.dc.html": "/awakening-your-inner-light-2026",
  "Awakening-Your-Inner-Light-October-2026.dc.html": "/awakening-your-inner-light-october-2026",
  "Bigger-Vision.dc.html": "/bigger-vision",
  "Awakening-Academy-Foundation.dc.html": "/awakening-academy-foundation",
  "Awakening-Academy-Level-1.dc.html": "/awakening-academy-level-1",
  "Awakening-Academy-Level-2.dc.html": "/awakening-academy-level-2",
  "Book-Consultation.dc.html": "/apply",
  "Children-Family.dc.html": "/children-and-family",
  "Children-Safeguarding.dc.html": "/children-safeguarding",
  "Childrens-Potential-Coach-Certification.dc.html": "/childrens-potential-coach-certification",
  "Community-Stories.dc.html": "/community-stories",
  "Contribute.dc.html": "/contribute",
  "Cookie-Policy.dc.html": "/cookie-policy",
  "Crystal-Healing.dc.html": "/crystal-healing",
  "DNA-Activation.dc.html": "/dna-activation",
  "Earth-Healer-Training.dc.html": "/earth-healer-training",
  "Earth-Healing-Zone.dc.html": "/earth-healing-zone",
  "Events-Retreats.dc.html": "/events",
  "Family-Information-Field-Restoration.dc.html": "/family-information-field-restoration",
  "Group-Healing.dc.html": "/group-healing",
  "Online-Group-Healing.dc.html": "/online-group-healing",
  "Holographic-Healing.dc.html": "/holographic-healing",
  "Intuitive-Perception-Training.dc.html": "/intuitive-perception-training",
  "Kids-Weekly-Practice.dc.html": "/children-weekly-practice",
  "Personal-Karma-Reconciliation.dc.html": "/personal-karma-reconciliation",
  "Practitioner-Certification.dc.html": "/practitioner-certification",
  "Privacy-Policy.dc.html": "/privacy-policy",
  "Rainbow-Light-Codes.dc.html": "/rainbow-light-codes",
  "ReGeneration.dc.html": "/regeneration",
  "Spiral-I.dc.html": "/spiral-i",
  "Spiral-II.dc.html": "/spiral-ii",
  "Spiral-III.dc.html": "/spiral-iii",
  "Spiral-IV.dc.html": "/spiral-iv",
  "Spiral-Journey.dc.html": "/spiral-journey",
  "Terms-Conditions.dc.html": "/terms",
  "Unlock-The-Potential.dc.html": "/unlock-the-potential",
  "Wellbeing-Disclaimer.dc.html": "/wellbeing-disclaimer",
  "Workshops.dc.html": "/programs"
};

const knowledgeManifestPath = path.join(siteDir, "knowledge-build-manifest.json");
const knowledgeManifest = fs.existsSync(knowledgeManifestPath)
  ? JSON.parse(fs.readFileSync(knowledgeManifestPath, "utf8"))
  : { routes: {}, entries: [] };
const knowledgeRoutes = Object.fromEntries(
  Object.entries(knowledgeManifest.routes || {}).filter(([file, route]) =>
    /^Knowledge(?:-(?:Topic-)?[A-Za-z0-9-]+)?\.dc\.html$/.test(file)
    && /^\/knowledge(?:\/[a-z0-9-]+)*$/.test(route)
  )
);
const routes = { ...baseRoutes, ...knowledgeRoutes };

// Transaction returns are routable but must never be indexed or enter the sitemap.
const privateRoutes = {
  "Payment-Confirmation.dc.html": "/payment-confirmation",
  "Young-People-Wellbeing.dc.html": "/young-people-wellbeing",
  "144-Stages-Maintenance.dc.html": "/144-stages-maintenance"
};
const allRoutes = { ...routes, ...privateRoutes };

const knowledgeEntryByPath = new Map(
  (knowledgeManifest.entries || []).map((entry) => [new URL(entry.canonicalUrl).pathname, entry])
);

const pageTypes = {
  "About-Stephanie.dc.html": "AboutPage",
  "Book-Consultation.dc.html": "ContactPage",
  "Events-Retreats.dc.html": "CollectionPage"
};

// Versioned, first-party JPEGs avoid reusing cached, unbranded preview URLs.
// Keep topic-specific editorial images below; use the general card as fallback.
const brandShareImage = "/assets/social/rainbow-sanctuary-share-20261023.jpg";
const decemberShareImage = "/assets/social/awakening-inner-light-december-2026-share-20261023.jpg";
const brandedSocialImages = {
  [brandShareImage]: {
    width: 1200, height: 630, type: "image/jpeg",
    alt: "Rainbow Sanctuary lotus and luminous rooted tree. We’re building a new world. Together with you. Retreats, online events, healing and learning. Bocas del Toro, Panama — Node 01."
  },
  [decemberShareImage]: {
    width: 1200, height: 630, type: "image/jpeg",
    alt: "Rainbow Sanctuary: Awakening Your Inner Light. A seven-day plant-medicine retreat, 3–9 December 2026, Bocas del Toro, Panama. Preparation, ceremony and integration, beside a luminous rooted tree."
  }
};
const ogImages = {
  "Home.dc.html": brandShareImage,
  "About-Stephanie.dc.html": "/assets/stephanie-portrait.jpg",
  "1-1-Sessions.dc.html": "/assets/editorial/private-healing-overview.jpg",
  "Awakening-Your-Inner-Light-2026.dc.html": decemberShareImage,
  "Awakening-Your-Inner-Light-October-2026.dc.html": brandShareImage,
  "Bigger-Vision.dc.html": "/assets/editorial/psn-regenerative-future.jpg",
  "Children-Family.dc.html": "/assets/editorial/home-family-editorial.jpg",
  "Kids-Weekly-Practice.dc.html": "/assets/editorial/children-weekly-practice-preparation.jpg",
  "Community-Stories.dc.html": "/assets/editorial/home-community-editorial.jpg",
  "Contribute.dc.html": "/assets/editorial/home-community-editorial.jpg",
  "Earth-Healing-Zone.dc.html": "/assets/editorial/earth-healing-stewardship-v1.jpg",
  "Events-Retreats.dc.html": brandShareImage,
  "Group-Healing.dc.html": "/assets/editorial/group-healing-zoom.jpg",
  "Online-Group-Healing.dc.html": "/assets/editorial/group-healing-zoom.jpg",
  "Autism-Family-Support.dc.html": "/assets/editorial/autism-family-support-hero-v2.png",
  "Young-People-Wellbeing.dc.html": "/assets/editorial/young-people-wellbeing-hero-v2.png",
  "Spiral-Journey.dc.html": "/assets/editorial/home-spiral-editorial.jpg"
};

const decodeHtml = (value) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'")
  .replaceAll("&apos;", "'")
  .replaceAll("&ndash;", "–")
  .replaceAll("&mdash;", "—");

const escapeAttribute = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const extract = (source, pattern, fallback) => decodeHtml(source.match(pattern)?.[1]?.trim() || fallback);

function ensureContributionFooterLink(source) {
  return source.replace(/<footer\b[\s\S]*?<\/footer>/i, (footer) => {
    if (/href=["']\/contribute["']/i.test(footer)) return footer;
    if (/class=["'][^"']*rs-footer-legal[^"']*["']/i.test(footer)) {
      return footer.replace(
        /(<nav\b[^>]*class=["'][^"']*rs-footer-legal[^"']*["'][^>]*>[\s\S]*?)(<\/nav>)/i,
        '$1\n          <a href="/contribute">Donate to support</a>\n        $2'
      );
    }
    return footer.replace(
      /<\/footer>/i,
      '<div class="rs-footer-donate-wrap"><a href="/contribute">Donate to support</a></div>\n</footer>'
    );
  });
}

function ensureKnowledgeFooterLink(source) {
  return source.replace(/<footer\b[\s\S]*?<\/footer>/i, (footer) => {
    if (/href=["']\/knowledge["']/i.test(footer)) return footer;
    if (/class=["'][^"']*rs-footer-legal[^"']*["']/i.test(footer)) {
      return footer.replace(
        /(<nav\b[^>]*class=["'][^"']*rs-footer-legal[^"']*["'][^>]*>[\s\S]*?)(<\/nav>)/i,
        '$1\n          <a href="/knowledge">Knowledge library</a>\n        $2'
      );
    }
    return footer.replace(
      /<\/footer>/i,
      '<div class="rs-footer-knowledge-wrap"><a href="/knowledge">Knowledge library</a></div>\n</footer>'
    );
  });
}

const organization = {
  "@type": "Organization",
  "@id": `${origin}/#organization`,
  name: "Rainbow Sanctuary",
  url: `${origin}/`,
  logo: {
    "@type": "ImageObject",
    url: `${origin}/assets/brand/lotus-planetary-consciousness-original.png`
  },
  founder: {
    "@type": "Person",
    name: "Stephanie Wu",
    url: `${origin}/about`
  }
};

const website = {
  "@type": "WebSite",
  "@id": `${origin}/#website`,
  url: `${origin}/`,
  name: "Rainbow Sanctuary",
  publisher: { "@id": `${origin}/#organization` },
  inLanguage: "en"
};

function schemaFor(file, title, description, canonical, image) {
  const graph = [
    organization,
    website,
    {
      "@type": pageTypes[file] || "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: title,
      description,
      isPartOf: { "@id": `${origin}/#website` },
      about: { "@id": `${origin}/#organization` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: image
      },
      inLanguage: "en"
    }
  ];

  if (file === "Awakening-Your-Inner-Light-2026.dc.html") {
    graph.push({
      "@type": "Event",
      "@id": `${canonical}#event`,
      name: "Awakening Your Inner Light Retreat · December 2026",
      description,
      image,
      startDate: "2026-12-03",
      endDate: "2026-12-09",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      organizer: { "@id": `${origin}/#organization` },
      offers: {
        "@type": "Offer",
        price: "3500",
        priceCurrency: "USD",
        url: `${origin}/apply?reason=events&program=awakening-inner-light-december-2026`
      }
    });
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonical}#frequently-asked-questions`,
      mainEntity: retreatFaqs.map(({ question, answer }) => ({
        "@type": "Question", name: question,
        acceptedAnswer: { "@type": "Answer", text: answer }
      }))
    });
  }

  if (file === "Awakening-Your-Inner-Light-October-2026.dc.html") {
    graph.push({
      "@type": "Event",
      "@id": `${canonical}#event`,
      name: "Awakening Your Inner Light Retreat · October 2026",
      description,
      image,
      startDate: "2026-10-01",
      endDate: "2026-10-07",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: "Bocas del Toro, Panama",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Bocas del Toro",
          addressCountry: "PA"
        }
      },
      organizer: { "@id": `${origin}/#organization` }
    });
  }

  if (file === "Online-Group-Healing.dc.html") {
    graph.push({
      "@type": "Event",
      "@id": `${canonical}#event-2026-08-18`,
      name: "Grounding & Renewal — Online Group Session",
      description: "A guided online group wellbeing session for grounding, reflection, rest, and shared intention.",
      image,
      startDate: "2026-08-18T21:00:00+08:00",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      location: {
        "@type": "VirtualLocation",
        url: `${canonical}#choose-session`
      },
      organizer: { "@id": `${origin}/#organization` },
      offers: {
        "@type": "Offer",
        price: "22",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: `${canonical}#choose-session`
      }
    });
  }

  if (file === "Events-Retreats.dc.html") {
    graph.push({
      "@type": "ItemList",
      "@id": `${canonical}#events`,
      name: "Rainbow Sanctuary events and retreats",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          url: `${origin}/online-group-healing`
        },
        {
          "@type": "ListItem",
          position: 2,
          url: `${origin}/awakening-your-inner-light-2026`
        }
      ]
    });
  }

  const knowledgeEntry = knowledgeEntryByPath.get(new URL(canonical).pathname);
  if (knowledgeEntry) {
    graph.push({
      "@type": "Article",
      "@id": `${canonical}#article`,
      headline: knowledgeEntry.title,
      description: knowledgeEntry.summary,
      mainEntityOfPage: canonical,
      datePublished: knowledgeEntry.firstPublishedAt,
      dateModified: knowledgeEntry.updatedAt,
      inLanguage: knowledgeEntry.locale,
      author: { "@type": "Person", name: knowledgeEntry.author.name, jobTitle: knowledgeEntry.author.role },
      reviewedBy: { "@type": "Person", name: knowledgeEntry.reviewer.name, jobTitle: knowledgeEntry.reviewer.role },
      publisher: { "@id": `${origin}/#organization` }
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}

for (const [file, route] of Object.entries(routes)) {
  const filePath = path.join(siteDir, file);
  let source = fs.readFileSync(filePath, "utf8");

  for (const [oldFile, cleanRoute] of Object.entries(allRoutes)) {
    source = source.replaceAll(oldFile, cleanRoute);
  }
  source = ensureKnowledgeFooterLink(ensureContributionFooterLink(source));

  if (file === "Awakening-Your-Inner-Light-2026.dc.html") {
    const faq = `<!-- rs-retreat-faq:start -->
    <section id="frequently-asked-questions" class="rs-persona-faq" data-rs-persona-faq="true" aria-labelledby="rs-faq-title"><div class="rs-persona-faq__shell"><header class="rs-persona-faq__heading"><span class="rs-persona-faq__eyebrow">Questions people ask before choosing</span><h2 id="rs-faq-title">Clear answers, before you decide.</h2><p class="rs-persona-faq__intro">Your questions are part of discernment—not an obstacle to enrollment. Start with what matters most to you.</p></header><div class="rs-persona-faq__list">${retreatFaqs.map(({ question, answer }) => `<details><summary>${escapeAttribute(question)}</summary><p>${escapeAttribute(answer)}</p></details>`).join("\n")}</div></div></section>
    <!-- rs-retreat-faq:end -->`;
    if (!/<!-- rs-retreat-faq:start -->[\s\S]*?<!-- rs-retreat-faq:end -->/.test(source)) throw new Error("December FAQ publishing markers are missing.");
    source = source.replace(/<!-- rs-retreat-faq:start -->[\s\S]*?<!-- rs-retreat-faq:end -->/, faq);
  }

  const title = extract(source, /<title>([\s\S]*?)<\/title>/i, "Rainbow Sanctuary");
  const description = extract(
    source,
    /<meta\s+name="description"\s+content="([^"]*)"[^>]*>/i,
    "Rainbow Sanctuary is a global community for spiritual wellbeing, conscious development, and regenerative service."
  );
  // Keep intentionally shorter sharing copy consistent across Open Graph and X.
  const socialTitle = extract(source, /<meta\s+property="og:title"\s+content="([^"]*)"[^>]*>/i, title);
  const socialDescription = extract(source, /<meta\s+property="og:description"\s+content="([^"]*)"[^>]*>/i, description);
  const socialType = extract(source, /<meta\s+property="og:type"\s+content="([^"]*)"[^>]*>/i, "website");
  const canonical = `${origin}${route}`;
  const imagePath = ogImages[file] || brandShareImage;
  const image = `${origin}${imagePath}`;
  const socialImage = brandedSocialImages[imagePath];
  const imageAlt = socialImage?.alt || title;
  const schema = schemaFor(file, title, description, canonical, image);
  const metadata = [
    "<!-- rs-discovery:start -->",
    `<link rel="canonical" href="${canonical}">`,
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">',
    '<meta property="og:site_name" content="Rainbow Sanctuary">',
    `<meta property="og:type" content="${escapeAttribute(socialType)}">`,
    `<meta property="og:title" content="${escapeAttribute(socialTitle)}">`,
    `<meta property="og:description" content="${escapeAttribute(socialDescription)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:secure_url" content="${image}">`,
    `<meta property="og:image:alt" content="${escapeAttribute(imageAlt)}">`,
    ...(socialImage ? [
      `<meta property="og:image:width" content="${socialImage.width}">`,
      `<meta property="og:image:height" content="${socialImage.height}">`,
      `<meta property="og:image:type" content="${socialImage.type}">`
    ] : []),
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeAttribute(socialTitle)}">`,
    `<meta name="twitter:description" content="${escapeAttribute(socialDescription)}">`,
    `<meta name="twitter:image" content="${image}">`,
    `<meta name="twitter:image:alt" content="${escapeAttribute(imageAlt)}">`,
    `<script type="application/ld+json">${JSON.stringify(schema)}</script>`,
    "<!-- rs-discovery:end -->"
  ].join("\n");

  source = source.replace(/\n?<!-- rs-discovery:start -->[\s\S]*?<!-- rs-discovery:end -->\n?/g, "\n");
  // Older pages also contain hand-written sharing tags. Remove only the fields
  // owned here so crawlers cannot pick a stale first image or duplicate title.
  source = source.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, (head) => head
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:robots|og:(?:site_name|type|title|description|url|image(?::(?:secure_url|alt|width|height|type))?)|twitter:(?:card|title|description|image(?::alt)?))["'][^>]*>\s*/gi, "")
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\s*/gi, ""));
  source = source.replace("</head>", `${metadata}\n</head>`);
  source = source.replace(/[ \t]+$/gm, "");
  fs.writeFileSync(filePath, source);
}

// Keep the support invitation present even on routable, non-indexed pages.
for (const file of fs.readdirSync(siteDir).filter((name) => name.endsWith(".dc.html"))) {
  const filePath = path.join(siteDir, file);
  let source = fs.readFileSync(filePath, "utf8");
  source = ensureKnowledgeFooterLink(ensureContributionFooterLink(source)).replace(/[ \t]+$/gm, "");
  fs.writeFileSync(filePath, source);
}

for (const file of fs.readdirSync(siteDir).filter((name) => name.startsWith("SiteNav") && name.endsWith(".dc.html"))) {
  const filePath = path.join(siteDir, file);
  let source = fs.readFileSync(filePath, "utf8");
  for (const [oldFile, cleanRoute] of Object.entries(allRoutes)) {
    source = source.replaceAll(oldFile, cleanRoute);
  }
  fs.writeFileSync(filePath, source);
}

for (const file of fs.readdirSync(siteDir).filter((name) => name.endsWith(".js"))) {
  const filePath = path.join(siteDir, file);
  let source = fs.readFileSync(filePath, "utf8");
  for (const [oldFile, cleanRoute] of Object.entries(allRoutes)) {
    source = source.replaceAll(`./${oldFile}`, cleanRoute).replaceAll(oldFile, cleanRoute);
  }
  fs.writeFileSync(filePath, source);
}

const legacyCleanRouteRedirects = {
  "/kids-weekly-practice": "/children-weekly-practice"
};

const redirects = [
  ...Object.entries(allRoutes).map(([file, route]) => ({
    source: `/${file}`,
    destination: route,
    permanent: true
  })),
  ...Object.entries(legacyCleanRouteRedirects).map(([source, destination]) => ({
    source,
    destination,
    permanent: true
  }))
];

const rewrites = [
  { source: "/guardian", destination: "/guardian/index.html" },
  { source: "/knowledge/SiteNavFixed.dc.html", destination: "/SiteNavFixed.dc.html" },
  { source: "/knowledge/(.*)/SiteNavFixed.dc.html", destination: "/SiteNavFixed.dc.html" },
  ...Object.entries(allRoutes).map(([file, route]) => ({
  source: route,
  destination: `/${file}`
}))
];

fs.writeFileSync(
  path.join(siteDir, "vercel.json"),
  `${JSON.stringify({ trailingSlash: false, crons, headers, redirects, rewrites }, null, 2)}\n`
);

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...Object.values(routes).filter((route) => route !== "/knowledge/search").map((route) => {
    const entry = knowledgeEntryByPath.get(route);
    return `  <url><loc>${origin}${route}</loc><lastmod>${entry?.updatedAt || routeLastmod.get(route) || lastmod}</lastmod></url>`;
  }),
  "</urlset>",
  ""
].join("\n");
fs.writeFileSync(path.join(siteDir, "sitemap.xml"), sitemap);

const robots = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
fs.writeFileSync(path.join(siteDir, "robots.txt"), robots);

const knowledgeLlms = (knowledgeManifest.entries || []).length
  ? `\n## Knowledge library\n\n- [Knowledge home](${origin}/knowledge): Reviewed public knowledge and topic browsing\n- [Knowledge search](${origin}/knowledge/search): Search approved Rainbow Sanctuary articles\n${knowledgeManifest.entries.map((entry) => `- [${entry.title}](${entry.canonicalUrl}): ${entry.summary}`).join("\n")}\n`
  : "";

const llms = `# Rainbow Sanctuary

> Rainbow Sanctuary is a global community offering spiritual wellbeing experiences, conscious-development programs, family support, practitioner pathways, online gatherings, and in-person retreats. Its work is educational and experiential and does not replace medical or mental-health care.

## Start here

- [Home](${origin}/): Overview and current invitations
- [About Rainbow Sanctuary](${origin}/about): The platform, community, and co-founder Stephanie Wu
- [The Spiral Journey](${origin}/spiral-journey): Four progressive levels of personal and conscious development
- [Group Healing](${origin}/group-healing): Overview of shared healing pathways
- [Online Group Healing](${origin}/online-group-healing): Accessible guided Zoom sessions
- [Programs](${origin}/programs): Focused adult workshops and learning programs
- [Children and Family](${origin}/children-and-family): Programs for children, teens, and families
- [Practitioner Certification](${origin}/practitioner-certification): Responsible practitioner pathways
- [Private Healing](${origin}/private-healing): Application-led private spiritual wellbeing sessions
- [Events](${origin}/events): Upcoming online sessions, gatherings, and retreats

## Current event

- [Awakening Your Inner Light · December 2026](${origin}/awakening-your-inner-light-2026): Seven-day, six-night retreat planned for 3–9 December 2026; the investment is USD 3,500 per person, with enquiries open while the final venue and programme are confirmed
- [Awakening Your Inner Light · October 2026 history](${origin}/awakening-your-inner-light-october-2026): Factual archive of the completed 1–7 October 2026 retreat in Bocas del Toro, Panama

## Vision and community

- [Planetary Symbiosis Network](${origin}/bigger-vision): Rainbow Sanctuary's wider regenerative vision
- [Earth Healing Zone](${origin}/earth-healing-zone): Collective reflection and practical stewardship
- [Community Stories](${origin}/community-stories): Published community experiences
- [Donate to support access](${origin}/contribute): Voluntary contributions that help keep selected pathways accessible

${knowledgeLlms}

## Policies and scope

- [Wellbeing disclaimer](${origin}/wellbeing-disclaimer)
- [Children safeguarding](${origin}/children-safeguarding)
- [Privacy policy](${origin}/privacy-policy)
- [Terms and conditions](${origin}/terms)
- [Accessibility](${origin}/accessibility)

## Contact

- [Apply or enquire](${origin}/apply)

## More context

- [Extended site guide](${origin}/llms-full.txt)
`;
fs.writeFileSync(path.join(siteDir, "llms.txt"), llms);

const llmsFull = `# Rainbow Sanctuary — Extended Site Guide

## What Rainbow Sanctuary is

Rainbow Sanctuary is a global spiritual wellbeing and conscious-development community co-founded by Stephanie Wu. It brings together accessible online group experiences, a progressive four-level Spiral Journey, focused programs, children-and-family work, practitioner pathways, private sessions, retreats, and an Earth-centred regenerative vision.

The site speaks about spiritual and energetic practices as part of Rainbow Sanctuary's own framework. These offerings are educational and experiential. They are not medical diagnosis, treatment, psychotherapy, or a replacement for qualified professional care.

${knowledgeLlms}

## Recommended visitor pathways

### A gentle first experience

Online Group Healing is the lowest-commitment entry point. Sessions are held online, are open to adults without prior experience, and may be attended as standalone experiences. The published total is USD 22 per session with payment processing included. See ${origin}/online-group-healing.

### Progressive personal development

The Spiral Journey moves through four levels:

1. Spiral I — foundations of wellbeing: ${origin}/spiral-i
2. Spiral II — emotional patterns and relationships: ${origin}/spiral-ii
3. Spiral III — intuition, purpose, and direction: ${origin}/spiral-iii
4. Spiral IV — integration, leadership, and service: ${origin}/spiral-iv

The pathway overview is at ${origin}/spiral-journey.

### Focused programs

Programs include ReGeneration, Earth Healer Training, Rainbow Light Codes, Crystal Healing, Intuitive Perception Training, Holographic Healing, and Adult Potential Development. Browse them at ${origin}/programs.

### Children and families

The family area includes Unlock the Potential and the Children's Potential Coach pathway. The overview is at ${origin}/children-and-family. Safeguarding information is published at ${origin}/children-safeguarding.

### Private healing

Private sessions are application-led. Current session types include Personal Karma Reconciliation, Family Information Field Restoration, and DNA Activation. These pages use spiritual and symbolic language and maintain clear wellbeing scope. Begin at ${origin}/private-healing.

### Events and retreats

Current public opportunities are listed at ${origin}/events. Awakening Your Inner Light is planned for 3–9 December 2026 as a seven-day, six-night residential retreat at USD 3,500 per person. The active page accepts expressions of interest while the final venue, programme, safety and booking details are confirmed: ${origin}/awakening-your-inner-light-2026. The completed October 2026 retreat is preserved separately at ${origin}/awakening-your-inner-light-october-2026.

## People and community

Rainbow Sanctuary's platform and community are introduced at ${origin}/about, with emphasis on co-founder and lead facilitator Stephanie Wu. Published community stories appear at ${origin}/community-stories.

## Wider vision

Rainbow Sanctuary is connected to the Planetary Symbiosis Network, a vision for regenerative communities and conscious service. See ${origin}/bigger-vision and ${origin}/earth-healing-zone.

Voluntary contributions help Rainbow Sanctuary keep selected group pathways accessible to people and families who may not otherwise be able to participate. Giving is optional, does not reserve a place, and does not provide priority access. See ${origin}/contribute.

## Policies

The site's scope and operating boundaries are documented at:

- ${origin}/wellbeing-disclaimer
- ${origin}/children-safeguarding
- ${origin}/privacy-policy
- ${origin}/terms
- ${origin}/cookie-policy
- ${origin}/accessibility

## Contact and applications

Use ${origin}/apply for enquiries, program-fit conversations, private-session applications, and event interest.
`;
fs.writeFileSync(path.join(siteDir, "llms-full.txt"), llmsFull);

console.log(`Published ${Object.keys(routes).length} canonical routes and discovery files.`);
