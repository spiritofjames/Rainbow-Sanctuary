import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mountRetreatVideo, loadYouTubeApi, HANAN_EMBED_URL } from "../retreat-video.js";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

function fixture(id = "bqe-GyjWn4U", { reducedMotion = false, saveData = false, observer = true } = {}) {
  const nodes = new Map();
  const frames = [];
  const controllers = [];
  const element = () => ({
    hidden: true, listeners: {}, children: [], textContent: "", focused: false,
    addEventListener(name, callback) { this.listeners[name] = callback; },
    appendChild(child) { this.children.push(child); child.parent = this; },
    focus() { this.focused = true; },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); },
  });
  for (const key of ["poster", "embed", "load", "close", "sound", "fallback", "status"]) nodes.set(key, element());
  nodes.get("poster").hidden = false;
  nodes.get("fallback").hidden = false;
  let onIntersection;
  const doc = {
    hidden: false, listeners: {},
    addEventListener(name, callback) { this.listeners[name] = callback; },
    createElement(tag) { assert.equal(tag, "iframe"); const frame = element(); frames.push(frame); return frame; },
    defaultView: {
      location: { protocol: "https:", origin: "https://rainbowsanctuary.life" },
      YT: { Player: class {
        constructor(frame, { events }) { this.frame = frame; this.events = events; this.calls = []; this.muted = false; controllers.push(this); }
        unMute() { this.calls.push("unMute"); this.muted = false; }
        mute() { this.calls.push("mute"); this.muted = true; }
        playVideo() { this.calls.push("play"); }
        isMuted() { return this.muted; }
        destroy() { this.calls.push("destroy"); this.frame.remove(); }
        emit(name, data) { this.events[name]({ target: this, data }); }
      } },
      matchMedia() { return { matches: reducedMotion }; },
      navigator: { connection: { saveData } },
      IntersectionObserver: observer ? class {
        constructor(callback, options) { onIntersection = callback; assert.deepEqual(options.threshold, [0, 0.5]); }
        observe() {}
      } : undefined,
    },
  };
  const player = {
    dataset: { videoId: id },
    querySelector(selector) { return nodes.get(selector.replace(/^\[data-video-|\]$/g, "")); },
    ownerDocument: doc,
  };
  return { player, nodes, frames, controllers, doc, enter: (ratio) => onIntersection?.([{isIntersecting: ratio > 0, intersectionRatio: ratio}]), click: (key) => nodes.get(key).listeners.click() };
}

test("manual playback uses the approved API-enabled source and accessible native controls", () => {
  const f = fixture();
  assert.equal(mountRetreatVideo(f.player), true);
  assert.equal(f.frames.length, 0);
  assert.equal(f.nodes.get("load").hidden, false);
  assert.equal(f.nodes.get("fallback").hidden, true);
  f.click("load");
  assert.equal(f.frames.length, 1);
  const frame = f.frames[0];
  assert.equal(frame.src, HANAN_EMBED_URL + "&origin=https%3A%2F%2Frainbowsanctuary.life");
  assert.equal(new URL(frame.src).origin, "https://www.youtube-nocookie.com");
  assert.equal(new URL(frame.src).searchParams.get("autoplay"), "0", "API attaches before the autoplay attempt so denial is observable");
  assert.equal(new URL(frame.src).searchParams.get("mute"), "0");
  assert.equal(new URL(frame.src).searchParams.get("enablejsapi"), "1");
  assert.match(frame.allow, /autoplay/);
  assert.equal(frame.referrerPolicy, "strict-origin-when-cross-origin");
  assert.equal(frame.allowFullscreen, true);
  assert.match(frame.title, /Hanan/);
  assert.equal(frame.focused, true);
  assert.equal(f.nodes.get("poster").hidden, true);
  assert.equal(f.nodes.get("embed").hidden, false);
  f.click("load");
  assert.equal(f.frames.length, 1, "repeat activation cannot create a second player");
});

test("autoplay begins at half visibility once, never steals focus, and stops fully offscreen", () => {
  const f = fixture();
  mountRetreatVideo(f.player);
  assert.equal(f.frames.length, 0);
  f.enter(0.49);
  assert.equal(f.frames.length, 0);
  f.enter(0.5);
  assert.equal(f.frames.length, 1);
  assert.equal(f.frames[0].focused, false);
  f.enter(0.2);
  assert.equal(f.nodes.get("embed").children.length, 1);
  f.enter(0);
  assert.equal(f.nodes.get("embed").children.length, 0);
  assert.equal(f.nodes.get("load").focused, false);
  f.enter(1);
  assert.equal(f.frames.length, 1, "scrolling back cannot restart a stopped video");
  f.click("load");
  assert.equal(f.frames.length, 2, "manual restart remains available");
});

test("reduced motion, data saving, and unsupported observation preserve manual playback", () => {
  for (const options of [{reducedMotion:true}, {saveData:true}, {observer:false}]) {
    const f = fixture("bqe-GyjWn4U", options);
    mountRetreatVideo(f.player);
    f.enter(1);
    assert.equal(f.frames.length, 0);
    f.click("load");
    assert.equal(f.frames.length, 1);
  }
});

test("hidden documents defer autoplay and hiding an active tab stops it without refocusing", () => {
  const f = fixture();
  mountRetreatVideo(f.player);
  f.doc.hidden = true;
  f.enter(1);
  assert.equal(f.frames.length, 0);
  f.doc.hidden = false;
  f.doc.listeners.visibilitychange();
  assert.equal(f.frames.length, 1);
  f.doc.hidden = true;
  f.doc.listeners.visibilitychange();
  assert.equal(f.nodes.get("embed").children.length, 0);
  assert.equal(f.nodes.get("load").focused, false);
  f.doc.hidden = false;
  f.doc.listeners.visibilitychange();
  assert.equal(f.frames.length, 1);
});

test("unload removes the provider frame and supports a fresh explicit choice", () => {
  const f = fixture();
  mountRetreatVideo(f.player);
  f.click("load");
  f.click("close");
  assert.equal(f.nodes.get("embed").children.length, 0);
  assert.equal(f.nodes.get("embed").hidden, true);
  assert.equal(f.nodes.get("poster").hidden, false);
  assert.equal(f.nodes.get("close").hidden, true);
  assert.equal(f.nodes.get("load").focused, true);
  assert.equal(f.player.dataset.videoLoaded, "false");
  f.enter(1);
  assert.equal(f.frames.length, 1, "explicit stop prevents a new automatic start");
  f.click("load");
  assert.equal(f.frames.length, 2);
  assert.equal(f.nodes.get("embed").children.length, 1);
});

test("invalid media and incomplete markup fail closed; frame errors retain a retry/fallback path", () => {
  const invalid = fixture("another-id");
  assert.equal(mountRetreatVideo(invalid.player), false);
  assert.equal(invalid.frames.length, 0);
  const missing = fixture();
  missing.nodes.delete("close");
  assert.equal(mountRetreatVideo(missing.player), false);
  const f = fixture();
  mountRetreatVideo(f.player);
  f.click("load");
  f.frames[0].listeners.error();
  assert.equal(f.nodes.get("embed").children.length, 0);
  assert.match(f.nodes.get("status").textContent, /Open on YouTube/);
  assert.equal(f.nodes.get("poster").hidden, false);
});

test("markup preserves complete thumbnail, provider disclosure, fallback, and deferred third-party iframe", () => {
  const page = read("Awakening-Your-Inner-Light-2026.dc.html");
  const closing = page.slice(page.indexOf('id="hanan-perspective"'), page.indexOf("</main>"));
  assert.match(page, /type="module" src="\.\/retreat-video.js\?v=/);
  assert.match(closing, /data-video-load hidden="\{\{ true \}\}"/);
  assert.match(closing, /data-video-close hidden="\{\{ true \}\}"/);
  assert.match(closing, /aria-describedby="hanan-video-privacy"/);
  assert.match(closing, /7 minutes 49 seconds/);
  assert.match(closing, /https:\/\/www.youtube.com\/watch\?v=bqe-GyjWn4U/);
  assert.doesNotMatch(closing, /<iframe|<video|Film coming soon|forthcoming film/);
  assert.doesNotMatch(page, /(?:src|href)="https:\/\/(?:i.ytimg.com|www.youtube-nocookie.com)|youtube.com.*preconnect/);
  assert.match(closing, /hanan-beyond-the-ceremony-vertical.webp/);
  assert.match(closing, /width="941" height="1672" loading="lazy"/);
  assert.doesNotMatch(closing + read("retreat-event.css"), /hanan-beyond-the-ceremony-thumbnail.png/);
  const poster = readFileSync(new URL("../assets/retreats/awakening-inner-light-december-2026/hanan-beyond-the-ceremony-vertical.webp", import.meta.url));
  assert.equal(poster.toString("ascii", 8, 12), "WEBP");
  assert.ok(poster.byteLength < 300_000, "portrait poster stays lightweight for mobile");
  assert.match(closing, /with sound if your browser permits/);
  assert.match(closing, /data-video-sound hidden="\{\{ true \}\}"/);
  assert.match(read("retreat-event.css"), /\.rs-retreat-video__frame\{[^}]*aspect-ratio:9\/16;min-height:200px/);
  assert.match(read("retreat-event.css"), /\.rs-retreat-video__poster img\{[^}]*object-fit:cover/);
  assert.match(read("retreat-event.css"), /\.rs-retreat-video \[hidden\]\{display:none!important\}/);
  assert.doesNotMatch(read("retreat-video.js"), /localStorage|sessionStorage|document.cookie|fetch\(/);
  assert.match(read("Cookie-Policy.dc.html"), /id="optional-video"/);
  assert.match(read("Privacy-Policy.dc.html"), /Optional video provider/);
  assert.doesNotMatch(read("Privacy-Policy.dc.html"), /only after you choose to load it/);
  assert.match(read("Cookie-Policy.dc.html"), /this is not a consent gate/);
});

test("CSP admits only the selected external embed and preserves the other restrictions", () => {
  const config = JSON.parse(read("vercel.json"));
  const csp = config.headers.find((item) => item.source === "/(.*)").headers.find((header) => header.key === "Content-Security-Policy").value;
  const frames = csp.match(/frame-src ([^;]+);/)[1].split(" ");
  assert.deepEqual(frames, ["'self'", "https://www.youtube-nocookie.com/embed/bqe-GyjWn4U", "https://www.youtube-nocookie.com/embed/C6KVdON7Ju0", "https://www.youtube-nocookie.com/embed/TKcncu9DIEc", "https://open.spotify.com/embed/track/2WxJlY7NsAqeQ52lJMJYwU"]);
  assert.match(csp, /https:\/\/open.spotify.com\/embed\/track\/2WxJlY7NsAqeQ52lJMJYwU;/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /media-src 'self'/);
  assert.match(csp, /img-src 'self' data: blob:/);
  assert.match(csp, /https:\/\/www.youtube.com\/iframe_api https:\/\/www.youtube.com\/s\/player\//);
  assert.ok(read("scripts/publish-discovery-layer.mjs").includes(csp), "generated headers keep the reviewed CSP after every rebuild");
});

test("sound is attempted first; audible denial falls back once and explicit sound activation works", async () => {
  const f = fixture();
  mountRetreatVideo(f.player);
  f.enter(0.5);
  await Promise.resolve();
  const api = f.controllers[0];
  api.emit("onReady");
  assert.deepEqual(api.calls, ["unMute", "play"]);
  api.emit("onAutoplayBlocked");
  assert.deepEqual(api.calls, ["unMute", "play", "mute", "play"]);
  assert.equal(f.nodes.get("sound").hidden, false);
  api.emit("onStateChange", 1);
  assert.match(f.nodes.get("status").textContent, /playing muted/);
  api.emit("onAutoplayBlocked");
  assert.equal(api.calls.length, 4, "no unbounded retry loop");
  assert.match(f.nodes.get("status").textContent, /requires a tap/);
  f.click("sound");
  assert.deepEqual(api.calls.slice(-2), ["unMute", "play"]);
  api.emit("onStateChange", 1);
  assert.match(f.nodes.get("status").textContent, /playing with sound/);
  assert.equal(f.nodes.get("sound").hidden, true);
});

test("successful audible playback is not muted and stop destroys the controller", async () => {
  const f = fixture();
  mountRetreatVideo(f.player);
  f.enter(1);
  await Promise.resolve();
  const api = f.controllers[0];
  api.emit("onReady");
  api.emit("onStateChange", 1);
  assert.deepEqual(api.calls, ["unMute", "play"]);
  assert.equal(f.nodes.get("sound").hidden, true);
  f.click("close");
  assert.equal(api.calls.at(-1), "destroy");
  const stopped = f.nodes.get("status").textContent;
  api.emit("onReady");
  api.emit("onAutoplayBlocked");
  api.emit("onStateChange", 1);
  api.emit("onError");
  assert.equal(f.nodes.get("status").textContent, stopped, "late events do not resurrect a stopped player");
  assert.equal(f.nodes.get("sound").hidden, true);
});

test("stopping before API resolution cannot instantiate or start an offscreen player", async () => {
  const f = fixture();
  mountRetreatVideo(f.player);
  f.enter(1);
  f.enter(0);
  await Promise.resolve();
  assert.equal(f.controllers.length, 0);
  f.click("load");
  await Promise.resolve();
  assert.equal(f.controllers.length, 1);
  assert.equal(f.controllers[0].frame, f.frames[1]);
});

test("provider playback errors restore the poster and retain the YouTube fallback", async () => {
  const f = fixture();
  mountRetreatVideo(f.player);
  f.enter(1);
  await Promise.resolve();
  f.controllers[0].emit("onError");
  assert.equal(f.nodes.get("poster").hidden, false);
  assert.equal(f.nodes.get("embed").children.length, 0);
  assert.match(f.nodes.get("status").textContent, /Open on YouTube/);
});

test("API loader is deferred/shared, restores prior callback, and allows retry after failure", async () => {
  const scripts = [];
  let timer;
  let previousCalled = 0;
  const view = {
    onYouTubeIframeAPIReady: () => previousCalled++,
    setTimeout(callback) { timer = callback; return 1; },
    clearTimeout() { timer = null; },
  };
  const previous = view.onYouTubeIframeAPIReady;
  const doc = {
    defaultView: view,
    head: { appendChild(script) { scripts.push(script); } },
    createElement(tag) {
      assert.equal(tag, "script");
      return { listeners: {}, addEventListener(name, callback) { this.listeners[name] = callback; }, remove() { this.removed = true; } };
    },
  };
  const pending = loadYouTubeApi(doc);
  assert.equal(loadYouTubeApi(doc), pending);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, "https://www.youtube.com/iframe_api");
  timer();
  await assert.rejects(pending, /timed out/);
  assert.equal(scripts[0].removed, true);
  assert.equal(view.onYouTubeIframeAPIReady, previous);
  const retry = loadYouTubeApi(doc);
  view.YT = { Player: class {} };
  view.onYouTubeIframeAPIReady();
  assert.equal(await retry, view.YT);
  assert.equal(previousCalled, 1);
  assert.equal(view.onYouTubeIframeAPIReady, previous);
  assert.equal(timer, null);
});
