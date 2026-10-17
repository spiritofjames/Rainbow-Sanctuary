import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { formatAudioTime, mountRetreatAudio } from "../retreat-audio.js";

class Element extends EventTarget {
  constructor() {
    super();
    this.attributes = new Map();
    this.style = { setProperty() {} };
    this.value = "";
    this.textContent = "";
  }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { this.attributes.delete(name); }
  toggleAttribute(name, enabled) {
    if (enabled) this.setAttribute(name, "");
    else this.removeAttribute(name);
  }
  fire(name) { this.dispatchEvent(new Event(name)); }
}

function fixture() {
  const names = ["player-controls", "audio-play", "audio-play-label", "play-icon",
    "pause-icon", "audio-seek", "audio-elapsed", "audio-duration", "audio-volume",
    "audio-mute", "volume-icon", "muted-icon", "audio-status", "audio-error"];
  const nodes = Object.fromEntries(names.map(name => [name, new Element()]));
  const audio = Object.assign(new Element(), {
    paused: true, ended: false, duration: NaN, currentTime: 0, volume: 1,
    muted: false, controls: true, playCalls: 0, loadCalls: 0,
    async play() {
      this.playCalls++;
      if (this.playFailure) throw this.playFailure;
      this.paused = false;
      this.ended = false;
      this.fire("playing");
    },
    pause() { this.paused = true; this.fire("pause"); },
    load() { this.loadCalls++; this.error = null; }
  });
  const player = {
    dataset: { trackTitle: "Hatun Hatun Temblarcuna", duration: "369.96" },
    querySelector(selector) {
      return selector === "audio" ? audio : nodes[selector.slice(6, -1)];
    }
  };
  assert.equal(mountRetreatAudio(player), true);
  return { audio, player, nodes };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test("player does not load or play before a visitor chooses to listen", () => {
  const { audio, nodes } = fixture();
  assert.equal(audio.playCalls, 0);
  assert.equal(audio.loadCalls, 0);
  assert.equal(nodes["audio-seek"].disabled, true);
  assert.equal(nodes["audio-duration"].textContent, "6:10");
  assert.equal(nodes["player-controls"].hidden, false);
  assert.equal(nodes["audio-error"].hidden, true);
});

test("play, pause and replay keep labels and SVG icon attributes synchronized", async () => {
  const { audio, nodes } = fixture();
  nodes["audio-play"].fire("click");
  await settle();
  assert.equal(audio.paused, false);
  assert.equal(nodes["audio-play"].attributes.get("aria-label"), "Pause Hatun Hatun Temblarcuna");
  assert.equal(nodes["pause-icon"].attributes.has("hidden"), false);
  assert.equal(nodes["play-icon"].attributes.has("hidden"), true);
  nodes["audio-play"].fire("click");
  assert.equal(audio.paused, true);
  audio.ended = true;
  audio.currentTime = 369.96;
  audio.fire("ended");
  assert.match(nodes["audio-play"].attributes.get("aria-label"), /^Replay/);
  nodes["audio-play"].fire("click");
  await settle();
  assert.equal(audio.currentTime, 0);
  assert.equal(audio.playCalls, 2);
});

test("seeking previews position then commits a bounded media time", () => {
  const { audio, nodes } = fixture();
  audio.duration = 369.96;
  audio.fire("loadedmetadata");
  assert.equal(nodes["audio-seek"].disabled, false);
  nodes["audio-seek"].value = "120";
  nodes["audio-seek"].fire("input");
  assert.equal(nodes["audio-elapsed"].textContent, "2:00");
  assert.equal(audio.currentTime, 0);
  nodes["audio-seek"].fire("change");
  assert.equal(audio.currentTime, 120);
  nodes["audio-seek"].value = "900";
  nodes["audio-seek"].fire("change");
  assert.equal(audio.currentTime, 369.96);
});

test("mute restores selected volume and unmute from zero is audible", () => {
  const { audio, nodes } = fixture();
  nodes["audio-volume"].value = "0.4";
  nodes["audio-volume"].fire("input");
  nodes["audio-mute"].fire("click");
  assert.equal(audio.muted, true);
  assert.equal(nodes["muted-icon"].attributes.has("hidden"), false);
  nodes["audio-mute"].fire("click");
  assert.equal(audio.volume, 0.4);
  assert.equal(audio.muted, false);
  nodes["audio-volume"].value = "0";
  nodes["audio-volume"].fire("input");
  nodes["audio-mute"].fire("click");
  assert.ok(audio.volume > 0);
  assert.equal(audio.muted, false);
});

test("playback failure exposes fallback and permits a successful retry", async () => {
  const { audio, nodes } = fixture();
  audio.playFailure = new Error("Network unavailable");
  nodes["audio-play"].fire("click");
  await settle();
  assert.equal(nodes["audio-error"].hidden, false);
  assert.equal(nodes["audio-play"].attributes.has("aria-busy"), false);
  audio.error = { code: 2 };
  audio.playFailure = null;
  nodes["audio-play"].fire("click");
  await settle();
  assert.equal(audio.loadCalls, 1);
  assert.equal(audio.paused, false);
  assert.equal(nodes["audio-error"].hidden, true);
});

test("listening section follows hero and ships a real, deferred audio source", () => {
  const html = readFileSync(new URL("../Awakening-Your-Inner-Light-2026.dc.html", import.meta.url), "utf8");
  const section = html.indexOf('id="listen"');
  assert.ok(section > html.indexOf('class="rs-retreat-hero"'));
  assert.ok(section < html.indexOf('class="rs-retreat-nav"'));
  const audio = html.match(/<audio\b[^>]*>[\s\S]*?<\/audio>/g);
  assert.equal(audio.length, 1);
  assert.match(audio[0], /controls="\{\{ true \}\}" preload="none"/);
  assert.doesNotMatch(audio[0], /autoplay/);
  const source = audio[0].match(/src="([^"]+)"/)[1];
  assert.ok(existsSync(new URL(`../${source}`, import.meta.url)));
  assert.equal(formatAudioTime(369.96), "6:10");
});
