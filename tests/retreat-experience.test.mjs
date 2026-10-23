import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import vm from "node:vm";
import { initIntegrationSlider, initMamaGaiaSlider } from "../retreat-integration-slider.js";
import { initRetreatGallery } from "../retreat-gallery.js";
import { initStorySong } from "../retreat-story-song.js";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const page = read("Awakening-Your-Inner-Light-2026.dc.html");

test("experience narrative preserves music, genuine guest voices and separate host attribution", () => {
  const order = ["listen", "is-this-for-me", "what-brings-you", "guest-reflections", "mama-gaia", "week", "integration", "participant-stories", "first-time", "facilitators", "setting", "practical-details", "application", "previous-retreat", "hanan-perspective"];
  let previous = -1;
  for (const id of order) {
    const position = page.indexOf(`id="${id}"`);
    assert.ok(position > previous, `${id} appears once in narrative order`);
    assert.equal(page.split(`id="${id}"`).length, 2);
    previous = position;
  }
  assert.match(page.slice(previous, page.indexOf("</main>")), /Why we gather/);
  assert.doesNotMatch(page.slice(previous, page.indexOf("</main>")), /<section\b/);
  const voices = page.slice(page.indexOf('id="guest-reflections"'), page.indexOf('id="week"'));
  const attributedQuotes = [...voices.matchAll(/<blockquote><p>(.*?)<\/p><\/blockquote><figcaption><strong>(.*?)<\/strong><span>Retreat participant<\/span><\/figcaption>/g)]
    .map((match) => [match[2], match[1]]);
  assert.deepEqual(attributedQuotes, [
    ["Jan", "“So last night the theme was unity, and I really felt we are one family. … It was so much love but contained. It was like embodied. … In every cell in the body, I was feeling held and contained.”"],
    ["Ivan", "“It felt more introspective. I felt like I was looking inside myself a lot more. … I connected within myself and then connected with you all. … It’s just a really special group of people. I think I’m really glad I connected with everyone.”"],
    ["Chloe", "“Last night’s session was beautiful. … It’s like you’re not efforting at all. The mat, the floor, Mother Earth is supporting the whole body, so I didn’t have to do anything. … Thank you for your music. That really helped.”"],
    ["Rachel", "“I want to say thank you to both of you. … It felt very safe. It felt like there was something holding me, and the also the attention that you are giving to us. When I started to freak out, I came to you, and you gave me a reassurance.”"],
    ["Garlon", "“Forgave myself for anything, whatever last night. I think it, you know, it literally happened. Versus you just thinking to yourself, I forgive myself. … The medicine responds to you and opens it all up to you and say, let me show you something.”"],
    ["Ryan", "“Try to come from a place of your heart and try to come from a place of love. … That resonated with me. … That’s like a practical change that I can make in my life.”"],
  ]);
  for (const [, quote] of attributedQuotes) assert.ok(quote.split(/\s+/).length >= 30, "each voice includes a substantive excerpt");
  assert.match(voices, /ellipses mark omissions/);
  assert.doesNotMatch(voices, /kept anonymous/);
  assert.doesNotMatch(voices, /data-speaker|00:\d\d|private-source|sharing-circle-after/);
  assert.match(page, /Retreat co-host/);
  assert.match(page, /not an independent guest review/);
  assert.match(page, /not a prediction of yours/);
});

test("curated gallery presents all 22 real photographs in one mixed-ratio collage", () => {
  const gallery = page.slice(page.indexOf('id="previous-retreat"'), page.indexOf('id="hanan-perspective"'));
  assert.match(gallery, /aria-labelledby="previous-retreat-title"/);
  assert.match(gallery, /A glimpse of retreat life/);
  assert.match(gallery, /not a confirmed December venue/);
  assert.match(gallery, /include photographs from the October 2026 gathering and its preparations/);
  assert.match(gallery, /role="list" aria-label="Curated photographs of retreat life and Bocas del Toro surroundings"/);
  assert.doesNotMatch(gallery, /awaiting-approved-content|Photographs coming soon|data-gallery-state/);
  const figures = [...gallery.matchAll(/<figure role="listitem">([\s\S]*?)<\/figure>/g)];
  assert.equal(figures.length, 22);
  const seen = new Set();
  for (const [index, [, figure]] of figures.entries()) {
    const href = figure.match(/href="\.\/([^"]+)"/)?.[1];
    const src = figure.match(/<img src="\.\/([^"]+)"/)?.[1];
    assert.ok(href && src, `photo ${index + 1} has delivery images`);
    assert.ok(!seen.has(href), `${href} is unique`);
    seen.add(href);
    assert.match(figure, /alt="[^"]+" width="\d+" height="\d+" loading="lazy" decoding="async"/);
    assert.match(figure, /<figcaption>[^<]+<\/figcaption>/);
    for (const path of [href, src]) {
      const asset = new URL(`../${path}`, import.meta.url);
      assert.ok(existsSync(asset), `${path} exists`);
      assert.ok(statSync(asset).size > 0, `${path} is nonempty`);
    }
    if (href.includes('/gallery/curated/')) {
      assert.match(src, /-640\.webp$/);
      assert.match(href, /-1200\.webp$/);
      assert.ok(statSync(new URL(`../${href}`, import.meta.url)).size < 750_000);
    }
  }
  assert.equal([...seen].filter((path) => path.includes('/gallery/curated/')).length, 20);
  assert.match(gallery, /rainbow-sanctuary-panama-1920\.jpg/);
  assert.match(gallery, /journey\/playa-bluff-aerial\.jpg/);
  assert.match(gallery, /22 selected photographs, together in one collage/);
  assert.doesNotMatch(gallery, /data-gallery-filter|data-gallery-filters|data-gallery-expand|data-gallery-category|Choose a theme/);
  assert.match(gallery, /<dialog class="rs-retreat-gallery-viewer" data-gallery-viewer/);
  assert.match(gallery, /data-gallery-prev aria-label="Previous photograph"/);
  assert.match(gallery, /data-gallery-next aria-label="Next photograph"/);
  assert.match(page, /retreat-gallery\.js\?v=20261022-2/);
  assert.doesNotMatch(gallery, /\/Collage\/|\/Testimonials\/|\.mp4|59 photographs/);
  const css = read("retreat-event.css");
  assert.match(css, /\.rs-retreat-gallery-list\{columns:2;column-gap:10px\}/);
  assert.match(css, /\.rs-retreat-gallery-list figure\{[^}]*break-inside:avoid/);
  assert.match(css, /\.rs-retreat-gallery-list img\{display:block;width:100%;height:auto\}/);
  assert.match(css, /@media\(min-width:1100px\)\{\.rs-retreat-gallery-list\{columns:3/);
  assert.doesNotMatch(css, /data-gallery-collapsed|rs-retreat-gallery-filters/);
});

test("curated gallery navigates every photograph and restores focus", () => {
  const listeners = new Map();
  const element = (name) => ({
    name,
    dataset: {},
    textContent: "",
    addEventListener(type, callback) { listeners.set(`${name}:${type}`, callback); },
    removeAttribute(key) { delete this[key]; },
    focus() { this.focused = true; },
  });
  const list = element("list");
  const viewer = element("viewer");
  viewer.showModal = () => { viewer.open = true; };
  viewer.close = () => { viewer.open = false; listeners.get("viewer:close")(); };
  const image = element("image");
  const caption = element("caption");
  const counter = element("counter");
  const previous = element("previous");
  const next = element("next");
  const close = element("close");
  const photos = Array.from({ length: 3 }, (_, index) => {
    const link = element(`link${index}`);
    link.href = `https://example.test/photo-${index}.webp`;
    return { querySelector(selector) {
      if (selector === "a") return link;
      if (selector === "img") return { alt: `Photograph ${index}` };
      if (selector === "figcaption") return { textContent: `Caption ${index}` };
      return null;
    }, link };
  });
  list.querySelectorAll = () => photos;
  const nodes = new Map([["[data-gallery-list]", list], ["[data-gallery-viewer]", viewer], ["[data-gallery-image]", image], ["[data-gallery-caption]", caption], ["[data-gallery-counter]", counter], ["[data-gallery-prev]", previous], ["[data-gallery-next]", next], ["[data-gallery-close]", close]]);
  const root = { dataset: {}, querySelector(selector) { return nodes.get(selector); } };
  initRetreatGallery(root);
  assert.equal(root.dataset.galleryReady, "true");
  let prevented = false;
  listeners.get("list:click")({ target: { closest: () => photos[1].link }, preventDefault() { prevented = true; } });
  assert.ok(prevented && viewer.open && close.focused);
  assert.equal(counter.textContent, "Photo 2 of 3");
  listeners.get("next:click")();
  assert.equal(counter.textContent, "Photo 3 of 3");
  listeners.get("next:click")();
  assert.equal(counter.textContent, "Photo 1 of 3");
  listeners.get("viewer:keydown")({ key: "ArrowLeft", preventDefault() {} });
  assert.equal(counter.textContent, "Photo 3 of 3");
  listeners.get("viewer:touchstart")({ touches: [{ clientX: 100, clientY: 100 }] });
  listeners.get("viewer:touchend")({ changedTouches: [{ clientX: 20, clientY: 100 }] });
  assert.equal(counter.textContent, "Photo 1 of 3");
  listeners.get("close:click")();
  assert.ok(!viewer.open && photos[1].link.focused);
  assert.equal(image.src, undefined);
  listeners.get("list:click")({ target: { closest: () => photos[2].link }, preventDefault() {} });
  assert.equal(counter.textContent, "Photo 3 of 3");
  listeners.get("next:click")();
  assert.equal(counter.textContent, "Photo 1 of 3");
  listeners.get("close:click")();
});

test("the gathering uses the owner-selected responsive illustration, separate from visitor concerns", () => {
  const section = page.slice(page.indexOf('id="is-this-for-me"'), page.indexOf('id="what-brings-you"'));
  assert.equal((section.match(/class="rs-retreat-gathering-photo"/g) || []).length, 1);
  assert.match(section, /gathering-circle-600.jpg 600w/);
  assert.match(section, /gathering-circle-1200.jpg 1200w/);
  assert.match(section, /width="1200" height="534" loading="lazy" decoding="async"/);
  assert.match(section, /alt="Illustrative scene of people seated together in a tropical open-air pavilion"/);
  assert.match(section, /<figcaption>Illustration of a shared retreat circle in an open-air pavilion<\/figcaption>/);
  assert.doesNotMatch(section, /rs-retreat-intentions/);
  for (const width of [600, 1200]) {
    const asset = new URL(`../assets/retreats/awakening-inner-light-december-2026/journey/gathering-circle-${width}.jpg`, import.meta.url);
    assert.ok(statSync(asset).size > 0 && statSync(asset).size < 300_000);
  }
  assert.match(read("retreat-event.css"), /\.rs-retreat-gathering-photo img\{display:block;width:100%;height:auto;border-radius:20px/);
  assert.doesNotMatch(read("Awakening-Your-Inner-Light-October-2026.dc.html"), /gathering-circle-1200|what-brings-you/);
});

test("a real Playa Bluff aerial photograph bridges the gathering and visitor concerns without implying a confirmed venue", () => {
  const bridge = page.slice(page.indexOf('class="rs-retreat-landscape-bridge"'), page.indexOf('id="what-brings-you"'));
  assert.match(bridge, /playa-bluff-aerial\.jpg/);
  assert.match(bridge, /Aerial view of forest meeting the beach and sea along Playa Bluff/);
  assert.match(bridge, /wider Playa Bluff area, not a confirmed December venue/);
  const asset = new URL('../assets/retreats/awakening-inner-light-december-2026/journey/playa-bluff-aerial.jpg', import.meta.url);
  assert.ok(statSync(asset).size > 0 && statSync(asset).size < 1_000_000);
  assert.match(read('retreat-event.css'), /\.rs-retreat-landscape-bridge__inner\{display:grid/);
});

test("visitor concerns are empathetic editorial invitations, not invented testimonials or treatment promises", () => {
  const section = page.slice(page.indexOf('id="what-brings-you"'), page.indexOf('id="guest-reflections"'));
  assert.match(section, /aria-labelledby="what-brings-you-title"/);
  assert.match(section, /Space for what<br>you are carrying/);
  const questions = section.match(/<ul class="rs-retreat-questions"[^>]*>([\s\S]*?)<\/ul>/)?.[1];
  assert.ok(questions);
  assert.equal((questions.match(/<li>/g) || []).length, 6);
  assert.equal((questions.match(/class="rs-retreat-questions__icon" aria-hidden="true"/g) || []).length, 6);
  for (const heading of ['Outgrowing your surroundings', 'Looking for your people', 'When emotions take the wheel', 'Patterns that are hard to leave', 'Uncertain what comes next', 'Seeking deeper renewal']) {
    assert.ok(questions.includes(`<h3>${heading}</h3>`));
  }
  assert.match(section, /emotional-awareness practice and reflection/);
  assert.match(section, /not a substitute for addiction care or other professional support/);
  assert.doesNotMatch(section, /<blockquote|\b(?:Ethel|Jan|Ivan|Rachel|Chloe|Garlon|Ryan)\b|private-source|sharing-circle-after|data-speaker|\d\d:\d\d:\d\d/);
  assert.doesNotMatch(section, /cure|guarantee|miracle|heal(?:s|ed)? (?:your|all)|only chance|last hope/i);
  assert.match(section, /Curious and cautious can exist together/);
  assert.match(section, /Ask about preparation, personal limits, and the support available/);
  assert.match(section, /not medical care or addiction treatment/);
  assert.match(section, /an enquiry is not confirmation/);
  assert.match(section, /href="#application">Talk with us about the retreat/);
  assert.match(section, /href="#integration">Explore the integration approach/);
  assert.match(read("retreat-event.css"), /@media\(min-width:720px\)[^\n]*\.rs-retreat-questions\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test("written testimonials use the six supplied photos with correct participant mapping", () => {
  const voices = page.slice(page.indexOf('id="guest-reflections"'), page.indexOf('id="week"'));
  const cards = [...voices.matchAll(/<figure class="rs-retreat-reflection">(.*?)<\/figure>/g)];
  assert.equal(cards.length, 6);
  const heights = { Jan: 1058, Ivan: 853, Chloe: 853, Rachel: 853, Garlon: 853, Ryan: 1055 };
  assert.deepEqual(cards.map(([, card]) => card.match(/<figcaption><strong>(.*?)<\/strong>/)[1]), Object.keys(heights));
  for (const [, card] of cards) {
    const name = card.match(/<figcaption><strong>(.*?)<\/strong>/)[1];
    const slug = name.toLowerCase();
    const src = `./assets/retreats/awakening-inner-light-december-2026/testimonials/${slug}.jpg`;
    assert.ok(card.includes(`class="rs-retreat-reflection__portrait" data-portrait-for="${slug}" data-media-status="approved-photo">`));
    const images = [...card.matchAll(/<img\b[^>]*>/g)];
    assert.equal(images.length, 1, `${name} has exactly one portrait`);
    assert.ok(images[0][0].includes(`src="${src}"`));
    assert.ok(images[0][0].includes(`alt="${name}, retreat participant"`));
    assert.ok(images[0][0].includes(`width="480" height="${heights[name]}"`));
    assert.match(images[0][0], /loading="lazy" decoding="async"/);
    assert.doesNotMatch(card, /aria-hidden|awaiting-approved-photo|photo coming|picture here|upload photo/i);
    const asset = new URL(`../${src}`, import.meta.url);
    assert.ok(existsSync(asset), `${name} photo exists`);
    assert.ok(statSync(asset).size > 0 && statSync(asset).size < 100_000, `${name} photo stays below 100 kB`);
  }
  assert.doesNotMatch(page, /garland/i);
  const css = read("retreat-event.css");
  assert.match(css, /\.rs-retreat-reflection__portrait\{[^}]*aspect-ratio:1;[^}]*border-radius:20px/);
  assert.match(css, /\.rs-retreat-reflection__portrait img\{[^}]*object-fit:cover/);
  for (const name of Object.keys(heights)) {
    assert.ok(css.includes(`.rs-retreat-reflection__portrait[data-portrait-for="${name.toLowerCase()}"] img{object-position:center `));
  }
  assert.match(css, /@media\(min-width:1100px\)\{\s*\.rs-retreat-reflection\{[^}]*grid-template-columns:160px minmax\(0,1fr\)/);
});

test("Mama Gaia section uses selected nature imagery without promising outcomes or the December venue", () => {
  const section = page.slice(page.indexOf('id="mama-gaia"'), page.indexOf('id="week"'));
  assert.match(section, /Feel the power of Mama Gaia/);
  assert.match(section, /Plant medicine can be powerful in its own right/);
  assert.match(section, /jungle canopy, sea air, and mountains on the horizon/);
  assert.match(section, /James describes his first steps here as an awakening felt through the body/);
  assert.match(section, /Experiences of energy, healing, or activation are personal, not guaranteed outcomes/);
  assert.match(section, /They do not identify the December venue or promise a particular wildlife encounter/);
  assert.doesNotMatch(section, /cellular healing|healing happens|guaranteed activation/i);
  const slides = [...section.matchAll(/<figure class="rs-retreat-mama-slide" data-photo-slide>([\s\S]*?)<\/figure>/g)];
  assert.equal(slides.length, 13);
  const names = ["coastal-palms", "jungle-canopy", "jungle-path", "jungle-meets-sea", "coastal-hills", "towering-trees", "rainforest-light", "lagoon", "toucan", "sloth", "howler-monkey", "butterfly", "caiman"];
  for (const [index, [, slide]] of slides.entries()) {
    assert.match(slide, /alt="[^"]+" width="1440" height="\d+" loading="lazy" decoding="async"/);
    assert.match(slide, /<figcaption>[^<]+<\/figcaption>/);
    for (const width of [640, 1440]) {
      const filename = `assets/retreats/awakening-inner-light-december-2026/mama-gaia/${names[index]}-${width}.webp`;
      assert.ok(slide.includes(filename), `${filename} referenced`);
      const asset = new URL(`../${filename}`, import.meta.url);
      assert.ok(existsSync(asset), `${filename} exists`);
      assert.ok(statSync(asset).size < 550_000, `${filename} is web-sized`);
    }
  }
  assert.match(section, /data-photo-viewport role="region"[^>]*tabindex="0"/);
  assert.match(section, /data-photo-status aria-live="polite">Photo 1 of 13/);
  assert.match(section, /data-photo-prev[^>]*disabled/);
  const css = read("retreat-event.css");
  assert.match(css, /\.rs-retreat-mama-slider__viewport\{[^}]*scroll-snap-type:x mandatory/);
  assert.match(css, /\.rs-retreat-mama-slider__buttons button\{[^}]*width:48px;height:48px/);
});

test("compact desktop facilitator portraits align with card text without replacing the mobile photo treatment", () => {
  const css = read("retreat-event.css");
  assert.match(css, /\.rs-retreat-facilitators img\{display:block;width:100%;height:auto;aspect-ratio:4\/5;object-fit:cover;object-position:center 24%\}/);
  assert.match(css, /\.rs-retreat-facilitators article>div\{padding:26px\}/);
  assert.match(css, /@media\(min-width:980px\)\{\s*\.rs-retreat-facilitators--compact-desktop article\{align-content:start\}\s*\.rs-retreat-facilitators--compact-desktop picture\{width:min\(calc\(100% - 52px\),260px\);min-height:0;margin-block:28px 0;margin-inline:26px auto;overflow:hidden;border-radius:20px\}/);
  assert.match(page, /class="rs-retreat-facilitators rs-retreat-facilitators--compact-desktop"/);
  assert.doesNotMatch(read("Awakening-Your-Inner-Light-October-2026.dc.html"), /rs-retreat-facilitators--compact-desktop/);
});

test("the four journey stages show the selected responsive visuals with clear provenance", () => {
  const week = page.slice(page.indexOf('id="week"'), page.indexOf('id="integration"'));
  const arc = week.match(/<ol class="rs-retreat-arc rs-retreat-arc--visual"[^>]*>([\s\S]*?)<\/ol>/)?.[1];
  assert.ok(arc, "December uses the isolated photo-led arc");
  const cards = [...arc.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match) => match[1]);
  const stages = [
    ["Before arrival", "preparation-call", "Prepare with context", "Illustrative one-to-one video preparation call"],
    ["Arrival", "arrival-pavilion", "Settle into place and relationship", "Illustrative scene of guests arriving"],
    ["During the week", "herb-ritual", "Ceremony, practice, and rest", "Illustrative portrait of a participant holding herbs"],
    ["Before returning home", "reflect-integrate", "Reflect and integrate", "Retreat participants reflecting together"],
  ];
  assert.equal(cards.length, stages.length);
  for (const [index, [stage, asset, heading, alt]] of stages.entries()) {
    const card = cards[index];
    assert.ok(card.includes(`<span class="rs-retreat-arc__stage">${stage}</span>`));
    assert.ok(card.includes(`<h3>${heading}</h3>`));
    const images = [...card.matchAll(/<img\b[^>]*>/g)];
    assert.equal(images.length, 1);
    assert.ok(images[0][0].includes(`alt="${alt}`));
    assert.match(images[0][0], /width="720" height="\d+" loading="lazy" decoding="async"/);
    assert.match(images[0][0], /sizes="/);
    for (const width of [360, 720]) {
      const relative = `assets/retreats/awakening-inner-light-december-2026/journey/${asset}-${width}.jpg`;
      assert.ok(card.includes(`${relative} ${width}w`));
      assert.ok(statSync(new URL(`../${relative}`, import.meta.url)).size < 110_000);
    }
  }
  assert.match(week, /aria-describedby="journey-photo-context"/);
  assert.match(week, /id="journey-photo-context"[^>]*>The preparation, arrival, and ritual images illustrate those stages; the reflection photograph is from a past gathering/);
  assert.match(week, /They do not confirm the December venue or programme/);
  assert.doesNotMatch(arc, /arc-(?:prepare|arrival|week|return)-real/);
  assert.doesNotMatch(arc, /https?:|drive\.google/);
  assert.doesNotMatch(read("Awakening-Your-Inner-Light-October-2026.dc.html"), /rs-retreat-arc--visual|journey\//);
  const css = read("retreat-event.css");
  assert.match(css, /\.rs-retreat-arc--visual::before\{display:none\}/);
  assert.match(css, /\.rs-retreat-arc--visual li\{[^}]*padding:0/);
  assert.match(css, /\.rs-retreat-arc--visual li>img\{[^}]*aspect-ratio:4\/3/);
  assert.match(css, /@media\(min-width:600px\)\{\s*\.rs-retreat-arc--visual\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(min-width:980px\)\{\s*\.rs-retreat-arc--visual\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});

test("Beyond the ceremony space owns the four requested photographs; integration keeps Ethel's reflection", () => {
  const week = page.slice(page.indexOf('id="week"'), page.indexOf('id="integration"'));
  const section = page.slice(page.indexOf('id="integration"'), page.indexOf('id="participant-stories"'));
  const slider = week.slice(week.indexOf('class="rs-retreat-integration-slider"'));
  assert.ok(week.indexOf('id="beyond-ceremony-title"') < week.indexOf('class="rs-retreat-integration-slider"'));
  assert.doesNotMatch(section, /data-integration-slider/);
  const photographs = [...slider.matchAll(/<figure class="rs-retreat-integration-photo">([\s\S]*?)<\/figure>/g)].map((match) => match[1]);
  assert.equal(photographs.length, 4);
  assert.match(slider, /data-integration-viewport role="region" aria-label="Beyond the ceremony space: four photographs of practice and connection" tabindex="0"/);
  assert.match(slider, /data-integration-status aria-live="polite">Photo 1 of 4/);
  assert.match(slider, /data-integration-prev aria-controls="integration-photo-slides"[^>]*disabled/);
  assert.match(slider, /data-integration-next aria-controls="integration-photo-slides"/);
  assert.match(page, /retreat-integration-slider\.js\?v=20261022-1/);
  const names = ["beyond-stephanie-guided", "beyond-movement", "beyond-sharing", "beyond-group-practice"];
  for (const [index, photograph] of photographs.entries()) {
    const extension = "webp";
    assert.match(photograph, new RegExp(`${names[index]}-720\\.${extension} 720w`));
    assert.match(photograph, new RegExp(`${names[index]}-1600\\.${extension} 1600w`));
    assert.match(photograph, /alt="[^"]+" width="1600" height="\d+" loading="lazy" decoding="async"/);
    assert.match(photograph, /<figcaption>[^<]+<\/figcaption>/);
    for (const width of [720, 1600]) {
      const asset = new URL(`../assets/retreats/awakening-inner-light-december-2026/journey/${names[index]}-${width}.${extension}`, import.meta.url);
      assert.ok(statSync(asset).size < 300_000);
    }
  }
  assert.doesNotMatch(slider, /Collage\/|cacao_2K|campfire_2K/);
  const reflection = section.match(/<figure class="rs-retreat-team-reflection rs-retreat-team-reflection--portrait">([\s\S]*?)<\/figure>/)?.[1];
  assert.ok(reflection);
  assert.match(reflection, /journey\/ethel-480.jpg" alt="Ethel, retreat organiser and caregiver" width="480" height="640" loading="lazy" decoding="async"/);
  assert.ok(reflection.includes('“My bigger integration is to let my emotion flow. … But in this space every integration comes and teaches you something, and lets you see patterns. And that is what you need to bring home.”'));
  assert.match(reflection, /<strong>Ethel<\/strong><span>Retreat organiser &amp; caregiver · Personal reflection<\/span>/);
  assert.doesNotMatch(reflection, /Retreat participant|Retreat guest/);
  assert.ok(statSync(new URL('../assets/retreats/awakening-inner-light-december-2026/journey/ethel-480.jpg', import.meta.url)).size < 300_000);
  const css = read("retreat-event.css");
  assert.match(css, /\.rs-retreat-integration-slider__viewport\{[^}]*scroll-snap-type:x mandatory/);
  assert.match(css, /\.rs-retreat-integration-photo img\{display:block;width:100%;height:auto;aspect-ratio:16\/9;object-fit:cover/);
  assert.match(css, /\.rs-retreat-integration-slider__buttons button\{[^}]*width:48px;height:48px/);
  assert.match(css, /\.rs-retreat-team-reflection__portrait\{[^}]*aspect-ratio:1;[^}]*border-radius:20px/);
});

test("integration slider supports buttons, swiping and keyboard navigation without autoplay", () => {
  const listeners = {};
  const slides = [0, 100, 200, 300].map((offsetLeft) => ({ offsetLeft }));
  const viewport = {
    scrollLeft: 0,
    querySelectorAll: () => slides,
    addEventListener: (name, handler) => { listeners[name] = handler; },
    scrollTo: ({ left }) => { viewport.scrollLeft = left; listeners.scroll(); },
  };
  const previous = { addEventListener: (_name, handler) => { listeners.previous = handler; } };
  const next = { addEventListener: (_name, handler) => { listeners.next = handler; } };
  const status = { textContent: "" };
  const elements = { "[data-integration-viewport]": viewport, "[data-integration-prev]": previous, "[data-integration-next]": next, "[data-integration-status]": status };
  const root = { dataset: {}, querySelector: (selector) => elements[selector] };
  initIntegrationSlider(root);
  assert.equal(root.dataset.sliderReady, "true");
  assert.equal(status.textContent, "Photo 1 of 4");
  assert.equal(previous.disabled, true);
  listeners.next();
  assert.equal(viewport.scrollLeft, 100);
  assert.equal(status.textContent, "Photo 2 of 4");
  viewport.scrollLeft = 200;
  listeners.scroll();
  assert.equal(status.textContent, "Photo 3 of 4");
  let prevented = false;
  listeners.keydown({ key: "End", preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(status.textContent, "Photo 4 of 4");
  assert.equal(next.disabled, true);
  listeners.previous();
  assert.equal(status.textContent, "Photo 3 of 4");
});

test("Mama Gaia slider supports arrow controls, swipe position and keyboard navigation", () => {
  const listeners = {};
  const slides = [0, 120, 240].map((offsetLeft) => ({ offsetLeft }));
  const viewport = {
    scrollLeft: 0,
    querySelectorAll: () => slides,
    addEventListener: (name, handler) => { listeners[name] = handler; },
    scrollTo: ({ left, behavior }) => { viewport.scrollLeft = left; viewport.behavior = behavior; listeners.scroll(); },
  };
  const previous = { addEventListener: (_name, handler) => { listeners.previous = handler; } };
  const next = { addEventListener: (_name, handler) => { listeners.next = handler; } };
  const status = { textContent: "" };
  const elements = { "[data-photo-viewport]": viewport, "[data-photo-prev]": previous, "[data-photo-next]": next, "[data-photo-status]": status };
  const root = { dataset: {}, querySelector: (selector) => elements[selector] };
  initMamaGaiaSlider(root);
  assert.equal(root.dataset.sliderReady, "true");
  assert.equal(status.textContent, "Photo 1 of 3");
  listeners.next();
  assert.equal(viewport.scrollLeft, 120);
  assert.equal(status.textContent, "Photo 2 of 3");
  viewport.scrollLeft = 240;
  listeners.scroll();
  assert.equal(status.textContent, "Photo 3 of 3");
  assert.equal(next.disabled, true);
  listeners.keydown({ key: "Home", preventDefault() {} });
  assert.equal(status.textContent, "Photo 1 of 3");
  assert.equal(previous.disabled, true);
});

test("first-person co-host story, team attribution and integration remain transparent", () => {
  const story = page.slice(page.indexOf('id="first-time"'), page.indexOf('id="facilitators"'));
  assert.match(story, /My first ayahuasca retreat was here in October/);
  assert.match(story, /I arrived during a difficult period/);
  assert.match(story, /edited from James’s own words/);
  assert.match(story, /A song from my journey/);
  assert.match(story, /Sonqoypi Bobinsana/);
  assert.match(story, /Hatun Ahayu · Choose how to listen/);
  assert.match(story, /data-story-song/);
  assert.match(story, /sonqoypi-bobinsana-cover-800\.webp/);
  assert.match(story, /sonqoypi-bobinsana-cover-800\.jpg/);
  for (const extension of ["webp", "jpg"]) {
    const art = new URL(`../assets/retreats/awakening-inner-light-december-2026/music/sonqoypi-bobinsana-cover-800.${extension}`, import.meta.url);
    assert.ok(existsSync(art) && statSync(art).size < 300_000, `${extension} cover is optimized and present`);
  }
  assert.match(story, /href="https:\/\/open\.spotify\.com\/track\/2WxJlY7NsAqeQ52lJMJYwU" target="_blank" rel="noopener noreferrer"/);
  assert.match(story, /data-spotify-load[^>]*hidden/);
  assert.match(story, /data-spotify-embed hidden/);
  assert.match(story, /cookie-policy#optional-spotify/);
  assert.match(page, /retreat-story-song\.js\?v=20261022-1/);
  assert.match(read("retreat-event.css"), /@container \(min-width:540px\)\{\.rs-retreat-story-song__main\{grid-template-columns:/);
  assert.match(read("Cookie-Policy.dc.html"), /id="optional-spotify"/);
  assert.match(read("Privacy-Policy.dc.html"), /id="optional-spotify"/);
  assert.doesNotMatch(story, /<iframe\b|autoplay=/);
  assert.doesNotMatch(story, /James’s first ayahuasca|He arrived|He describes|For James,/);
  const integration = page.slice(page.indexOf('id="integration"'), page.indexOf('id="participant-stories"'));
  assert.match(integration, /<strong>Ethel<\/strong><span>Retreat organiser &amp; caregiver/);
  assert.match(integration, /Stephanie and James/);
  assert.match(integration, /any support after the retreat, its scope/);
  assert.doesNotMatch(integration, /Retreat guest|Retreat participant<\/span>/);
});

test("Spotify player loads only on an explicit choice and can be closed", () => {
  const handlers = new Map();
  const button = {
    hidden: true,
    textContent: "",
    addEventListener(type, handler) { handlers.set(type, handler); },
    setAttribute(name, value) { this[name] = value; },
  };
  const slot = {
    hidden: true,
    children: [],
    replaceChildren(...nodes) { this.children = nodes; },
  };
  const status = { textContent: "" };
  const nodes = new Map([
    ["[data-spotify-load]", button],
    ["[data-spotify-embed]", slot],
    ["[data-spotify-status]", status],
  ]);
  const root = {
    dataset: {},
    querySelector(selector) { return nodes.get(selector); },
    ownerDocument: { createElement(tag) { assert.equal(tag, "iframe"); return {}; } },
  };
  initStorySong(root);
  assert.equal(button.hidden, false);
  assert.equal(slot.children.length, 0, "no third-party frame before visitor choice");
  handlers.get("click")();
  assert.equal(slot.children.length, 1);
  assert.equal(slot.children[0].src, "https://open.spotify.com/embed/track/2WxJlY7NsAqeQ52lJMJYwU");
  assert.equal(slot.children[0].loading, "lazy");
  assert.equal(slot.hidden, false);
  assert.equal(button["aria-expanded"], "true");
  handlers.get("click")();
  assert.equal(slot.children.length, 0);
  assert.equal(slot.hidden, true);
  assert.equal(button["aria-expanded"], "false");
});

test("tradition and setting copy do not invent precise credentials, cures or included excursions", () => {
  assert.match(page, /learning and initiation with maestros, shamans, and curanderos/);
  assert.match(page, /In reflections after a past gathering, he described experience across “thousands of ceremonies\.”/);
  assert.doesNotMatch(page, /3,?000\+|hundreds of initiations|healed people from anything|doctors say it.s impossible|guaranteed (?:healing|transformation)|all received the answers/i);
  assert.match(page, /not medical care or addiction treatment/);
  const setting = page.slice(page.indexOf('id="setting"'), page.indexOf('id="practical-details"'));
  assert.match(setting, /Where the jungle<br>meets the sea/);
  assert.match(setting, /any additional costs will be confirmed individually/);
  assert.match(setting, /not all included in the retreat price/);
  assert.doesNotMatch(setting, /no cars|car-free|safe swimming|luxury facilities/i);
});

test("participant reflections use the two supplied films and local covers without eager embeds", () => {
  const slots = [...page.matchAll(/data-retreat-video-slot="([^"]+)" data-media-status="awaiting-approved-clip"/g)].map((match) => match[1]);
  assert.deepEqual(slots, []);
  assert.doesNotMatch(page, /<(?:video|iframe)\b|src=""|href="#"/);
  assert.doesNotMatch(page, /Participant films coming soon|Films coming soon/);
  assert.match(page, /data-media-status="approved-youtube" data-video-id="bqe-GyjWn4U"/);
  assert.doesNotMatch(page, /His forthcoming film|Conversation with Hanan · Film coming soon/);
  const participantFilms = page.slice(page.indexOf('id="participant-stories"'), page.indexOf('id="first-time"'));
  assert.equal((participantFilms.match(/data-testimonial-video data-video-id=/g) || []).length, 2);
  assert.match(participantFilms, /data-video-id="C6KVdON7Ju0"/);
  assert.match(participantFilms, /data-video-id="TKcncu9DIEc"/);
  assert.match(participantFilms, /German Sozzi/);
  assert.match(participantFilms, /Garlon/);
  assert.match(participantFilms, /german-video-still\.jpg/);
  assert.match(participantFilms, /garlon-video-still\.jpg/);
  assert.match(participantFilms, /they do not start as you scroll/);
  assert.match(participantFilms, /data-testimonial-play hidden="\{\{ true \}\}"/);
  assert.match(participantFilms, /data-testimonial-stop hidden="\{\{ true \}\}"/);
  assert.match(page, /type="module" src="\.\/retreat-testimonial-videos\.js\?v=/);
  for (const match of page.matchAll(/(?:src|srcset)="(\.\/assets\/retreats\/[^" ]+)"/g)) {
    assert.ok(existsSync(new URL(`../${match[1]}`, import.meta.url)), `asset exists: ${match[1]}`);
  }
});

test("setting features the supplied shoreline photo without cropping and with responsive lazy loading", () => {
  const setting = page.slice(page.indexOf('id="setting"'), page.indexOf('id="practical-details"'));
  assert.equal((setting.match(/class="rs-retreat-land-photo"/g) || []).length, 1);
  assert.ok(setting.indexOf('class="rs-retreat-land-intro"') < setting.indexOf('class="rs-retreat-land-photo"'));
  assert.ok(setting.indexOf('class="rs-retreat-land-photo"') < setting.indexOf('class="rs-retreat-land-notes"'));
  assert.match(setting, /rainbow-sanctuary-panama-960.jpg 960w/);
  assert.match(setting, /rainbow-sanctuary-panama-1920.jpg 1920w/);
  assert.match(setting, /width="1920" height="1079" loading="lazy" decoding="async"/);
  assert.match(setting, /alt="Aerial view of dense jungle beside a white-sand shoreline and turquoise water/);
  assert.match(read("retreat-event.css"), /\.rs-retreat-land-photo img\{display:block;width:100%;height:auto\}/);
  for (const size of [960, 1920]) {
    assert.ok(existsSync(new URL(`../assets/retreats/awakening-inner-light-december-2026/rainbow-sanctuary-panama-${size}.jpg`, import.meta.url)));
  }
});

function mountFaq({ pathname, pageKey, explicitSlot = true }) {
  let section;
  let schema;
  let placement;
  const slot = { replaceWith: (node) => { section = node; placement = "slot"; } };
  const main = {
    dataset: pageKey ? { rsFaqPage: pageKey } : {},
    children: [],
    querySelector: (selector) => selector === "[data-rs-faq-slot]" && explicitSlot ? slot : null,
    appendChild: (node) => { section = node; placement = "append"; },
  };
  const document = {
    readyState: "complete",
    documentElement: {},
    head: { appendChild: (node) => { schema = JSON.parse(node.textContent); } },
    querySelector: (selector) => selector === "main" ? main : null,
    createElement: () => ({ dataset: {}, setAttribute() {}, querySelectorAll: () => [] }),
  };
  vm.runInNewContext(read("persona-faqs.js"), {
    window: {}, document, location: { pathname },
    MutationObserver: class { observe() {} },
  });
  return { section, schema, placement };
}

test("retreat FAQs are present without JavaScript before the closing application and film", () => {
  const faq = page.slice(page.indexOf('id="frequently-asked-questions"'), page.indexOf('id="application"'));
  assert.match(faq, /December plan is a seven-day, six-night/);
  assert.doesNotMatch(faq, /three guided plant-medicine ceremonies|three meals daily/);
  assert.match(faq, /What is the price\?/);
  assert.ok(page.indexOf('id="frequently-asked-questions"') < page.indexOf('id="hanan-perspective"'));
  assert.equal(mountFaq({ pathname: "/awakening-your-inner-light-2026" }).section, undefined);
});

test("local retreat preview uses the explicit FAQ page key and other clean routes retain default placement", () => {
  const preview = mountFaq({ pathname: "/Awakening-Your-Inner-Light-2026.dc.html", pageKey: "/awakening-your-inner-light-2026" });
  assert.equal(preview.section, undefined, "the preview already contains the generated static FAQ");
  const other = mountFaq({ pathname: "/apply", explicitSlot: false });
  assert.equal(other.placement, "append");
  assert.match(other.section.innerHTML, /Is this form a booking or an enquiry/);
  assert.equal(mountFaq({ pathname: "/not-a-program", explicitSlot: false }).section, undefined);
});
