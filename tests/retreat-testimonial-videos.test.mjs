import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mountTestimonialVideo } from "../retreat-testimonial-videos.js";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

function fixture(id = "C6KVdON7Ju0") {
  const nodes = new Map();
  const frames = [];
  const element = () => ({
    hidden: true, listeners: {}, children: [], textContent: "", focused: false,
    addEventListener(name, callback) { this.listeners[name] = callback; },
    appendChild(child) { this.children.push(child); child.parent = this; },
    focus() { this.focused = true; },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); },
  });
  for (const key of ["poster", "embed", "play", "fallback", "stop", "status"]) nodes.set(key, element());
  nodes.get("poster").hidden = false;
  nodes.get("fallback").hidden = false;
  const doc = {
    hidden: false, listeners: {},
    addEventListener(name, callback) { this.listeners[name] = callback; },
    createElement(tag) { assert.equal(tag, "iframe"); const frame = element(); frames.push(frame); return frame; },
  };
  const card = {
    dataset: { videoId: id },
    querySelector(selector) { return nodes.get(selector.replace(/^\[data-testimonial-|\]$/g, "")); },
    ownerDocument: doc,
  };
  return { card, nodes, frames, doc, click: (key) => nodes.get(key).listeners.click() };
}

test("testimonial films make no YouTube request before an explicit click", () => {
  const f = fixture();
  assert.equal(mountTestimonialVideo(f.card), true);
  assert.equal(f.frames.length, 0);
  assert.equal(f.nodes.get("play").hidden, false);
  assert.equal(f.nodes.get("fallback").hidden, true);
  assert.equal(f.card.dataset.videoLoaded, "false");
  f.click("play");
  assert.equal(f.frames.length, 1);
  const frame = f.frames[0];
  assert.equal(new URL(frame.src).origin, "https://www.youtube-nocookie.com");
  assert.equal(new URL(frame.src).pathname, "/embed/C6KVdON7Ju0");
  assert.equal(new URL(frame.src).searchParams.get("autoplay"), "1", "play starts only after the visitor selects Play");
  assert.equal(frame.referrerPolicy, "strict-origin-when-cross-origin");
  assert.equal(frame.allowFullscreen, true);
  assert.match(frame.title, /German Sozzi/);
  assert.equal(f.nodes.get("poster").hidden, true);
  assert.equal(f.nodes.get("embed").hidden, false);
  assert.equal(f.nodes.get("stop").hidden, false);
  f.click("play");
  assert.equal(f.frames.length, 1, "repeated clicks do not duplicate the player");
  f.click("stop");
  assert.equal(f.nodes.get("embed").children.length, 0);
  assert.equal(f.nodes.get("poster").hidden, false);
  assert.equal(f.nodes.get("play").focused, true);
});

test("starting the second reflection stops the first; hiding the page unloads playback", () => {
  const first = fixture();
  const second = fixture("TKcncu9DIEc");
  mountTestimonialVideo(first.card);
  mountTestimonialVideo(second.card);
  first.click("play");
  second.click("play");
  assert.equal(first.nodes.get("embed").children.length, 0);
  assert.equal(first.card.dataset.videoLoaded, "false");
  assert.equal(second.nodes.get("embed").children.length, 1);
  assert.match(second.frames[0].title, /Garlon/);
  second.doc.hidden = true;
  second.doc.listeners.visibilitychange();
  assert.equal(second.nodes.get("embed").children.length, 0);
  assert.equal(second.nodes.get("play").focused, false);
});

test("unknown video IDs and incomplete cards never create an embed", () => {
  const unknown = fixture("not-approved");
  assert.equal(mountTestimonialVideo(unknown.card), false);
  const incomplete = fixture();
  incomplete.nodes.delete("stop");
  assert.equal(mountTestimonialVideo(incomplete.card), false);
  assert.equal(unknown.frames.length + incomplete.frames.length, 0);
});

test("page keeps local posters, a direct fallback and no eager third-party frame", () => {
  const page = read("Awakening-Your-Inner-Light-2026.dc.html");
  const films = page.slice(page.indexOf('id="participant-stories"'), page.indexOf('id="first-time"'));
  assert.doesNotMatch(films, /<iframe|https:\/\/i\.ytimg\.com|youtube-nocookie\.com/);
  assert.match(films, /youtube\.com\/shorts\/C6KVdON7Ju0/);
  assert.match(films, /youtu\.be\/TKcncu9DIEc/);
  assert.match(films, /\/cookie-policy#optional-video/);
  assert.doesNotMatch(read("retreat-testimonial-videos.js"), /IntersectionObserver|localStorage|sessionStorage|document\.cookie|fetch\(/);
});
