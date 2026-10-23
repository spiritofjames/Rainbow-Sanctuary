import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = file => readFileSync(new URL(file, root), "utf8");
const origin = "https://rainbowsanctuary.life";
const brandImage = "/assets/social/rainbow-sanctuary-share-20261023.jpg";
const decemberImage = "/assets/social/awakening-inner-light-december-2026-share-20261023.jpg";
const head = file => read(file).split("</head>")[0];
const meta = (html, key) => {
  const values = [...html.matchAll(/<meta\s+(?:property|name)="([^"]+)"\s+content="([^"]*)"[^>]*>/g)]
    .filter(match => match[1] === key).map(match => match[2]);
  assert.equal(values.length, 1, `expected one ${key} tag`);
  return values[0];
};
const graph = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .flatMap(match => JSON.parse(match[1])["@graph"] || []);

function jpegDimensions(bytes) {
  assert.equal(bytes.readUInt16BE(0), 0xffd8, "must be a JPEG, not a renamed PNG");
  for (let offset = 2; offset + 8 < bytes.length;) {
    assert.equal(bytes[offset], 0xff);
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
    }
    if ([0xd9, 0xda].includes(marker)) break;
    offset += bytes.readUInt16BE(offset);
  }
  assert.fail("JPEG dimensions not found");
}

test("branded sharing assets are lightweight 1200 x 630 JPEGs", () => {
  for (const image of [brandImage, decemberImage]) {
    const bytes = readFileSync(new URL(image.slice(1), root));
    assert.deepEqual(jpegDimensions(bytes), { width: 1200, height: 630 });
    assert.ok(bytes.length < 400_000, `${image} should stay below 400 KB`);
  }
});

test("home, events and generic pages share the brand card; December has its own card", () => {
  const expected = {
    "Home.dc.html": brandImage,
    "Events-Retreats.dc.html": brandImage,
    "Awakening-Your-Inner-Light-2026.dc.html": decemberImage,
    "Awakening-Your-Inner-Light-October-2026.dc.html": brandImage,
    "Book-Consultation.dc.html": brandImage,
    "Knowledge.dc.html": brandImage
  };
  for (const [file, image] of Object.entries(expected)) {
    const html = head(file);
    assert.equal(meta(html, "og:image"), origin + image, file);
    assert.equal(meta(html, "og:image:secure_url"), origin + image, file);
    assert.equal(meta(html, "twitter:image"), origin + image, file);
    assert.equal(meta(html, "og:image:width"), "1200");
    assert.equal(meta(html, "og:image:height"), "630");
    assert.equal(meta(html, "og:image:type"), "image/jpeg");
    assert.equal(meta(html, "twitter:card"), "summary_large_image");
    assert.equal(meta(html, "twitter:image:alt"), meta(html, "og:image:alt"));
    assert.match(meta(html, "og:image:alt"), /lotus|rooted tree/);
    assert.equal(graph(html).find(item => item.primaryImageOfPage).primaryImageOfPage.url, origin + image);
  }
});

test("all 59 discoverable pages have static, consistent OG and X metadata", () => {
  const pages = readdirSync(root).filter(file => file.endsWith(".dc.html") && read(file).includes("<!-- rs-discovery:start -->"));
  assert.equal(pages.length, 59);
  for (const file of pages) {
    const html = head(file);
    assert.equal(meta(html, "twitter:title"), meta(html, "og:title"), file);
    assert.equal(meta(html, "twitter:description"), meta(html, "og:description"), file);
    assert.equal(meta(html, "twitter:image"), meta(html, "og:image"), file);
    assert.equal(meta(html, "og:type").length > 0, true, file);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1, file);
    assert.equal(graph(html).filter(item => item.primaryImageOfPage).length, 1, file);
    assert.match(meta(html, "og:image"), /^https:\/\/rainbowsanctuary\.life\//);
    assert.ok(meta(html, "og:image:alt").length > 0);
    assert.doesNotMatch(meta(html, "og:image"), /home-sanctuary-shore-v3-poster\.jpg|rainbow-sanctuary-home-og-v1\.jpg/);
  }
});

test("sharing copy and event dates distinguish December from the October archive", () => {
  const home = head("Home.dc.html");
  assert.equal(meta(home, "og:title"), "Rainbow Sanctuary — A New World, Together");
  assert.match(meta(home, "og:description"), /Retreats, online events, healing and learning/);
  const december = head("Awakening-Your-Inner-Light-2026.dc.html");
  assert.match(meta(december, "og:title"), /December 2026/);
  assert.match(meta(december, "og:description"), /3–9 December 2026/);
  assert.doesNotMatch(meta(december, "og:description"), /October/);
  const event = graph(december).find(item => item["@type"] === "Event");
  assert.equal(event.image, origin + decemberImage);
  assert.equal(event.startDate, "2026-12-03");
  assert.equal(event.endDate, "2026-12-09");
  const archive = head("Awakening-Your-Inner-Light-October-2026.dc.html");
  assert.match(meta(archive, "og:title"), /October 2026/);
  assert.equal(graph(archive).find(item => item["@type"] === "Event").startDate, "2026-10-01");
  assert.doesNotMatch(meta(archive, "og:image"), /december/);
});

test("topic-specific editorial images remain distinct from the generic brand card", () => {
  for (const file of ["About-Stephanie.dc.html", "Children-Family.dc.html", "Bigger-Vision.dc.html"]) {
    assert.notEqual(meta(head(file), "og:image"), origin + brandImage, file);
  }
});
