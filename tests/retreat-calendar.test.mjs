import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../events-calendar.js", import.meta.url), "utf8");
const retreat = {
  id: "awakening-inner-light-december-2026",
  title: "Awakening Your Inner Light",
  category: "retreat",
  startDate: "2026-12-03",
  endDate: "2026-12-09",
  status: "interest",
  price: "USD 3,500 per person",
  registrationUrl: "/awakening-your-inner-light-2026"
};

function element(dataset = {}) {
  return {
    dataset, innerHTML: "", textContent: "", hidden: false, style: {}, attributes: {}, handlers: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, handler) { this.handlers[name] = handler; },
    closest() { return null; }
  };
}

async function mount({ now = "2026-10-22T12:00:00", events = [retreat], search = "" } = {}) {
  const clock = new Date(now).getTime();
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock])); }
    static now() { return clock; }
  }
  const ids = Object.fromEntries([
    "events-calendar-grid", "events-month-label", "events-upcoming-list", "events-empty",
    "events-prev-month", "events-next-month", "events-calendar-link"
  ].map(id => [id, element()]));
  const filters = ["all", "retreat", "group"].map(eventFilter => element({ eventFilter }));
  const document = {
    readyState: "complete",
    getElementById: id => ids[id] || null,
    querySelector: () => null,
    querySelectorAll: () => filters
  };
  vm.runInNewContext(source, {
    window: {
      location: { href: `https://staging.example.test/events${search}`, search },
      RAINBOW_SANCTUARY_CONFIG: { events: {} },
      RAINBOW_PUBLIC_EVENTS_READY: Promise.resolve({ items: events, source: "approved-static", status: "degraded" })
    },
    document, Date: FixedDate, URL, URLSearchParams, Intl, Promise
  });
  await new Promise(resolve => setImmediate(resolve));
  return {
    ids,
    filter(name) { const button = filters.find(item => item.dataset.eventFilter === name); button.handlers.click.call(button); },
    filters,
    calendar: () => ids["events-calendar-grid"].innerHTML,
    upcoming: () => ids["events-upcoming-list"].innerHTML
  };
}

test("December retreat occupies all seven calendar days with native links to its landing page", async () => {
  const page = await mount({ search: "?filter=retreat" });
  assert.equal(page.ids["events-month-label"].textContent, "December 2026");
  const cells = page.calendar().split('<div class="rs-calendar-day').slice(1);
  const linkedDays = cells.filter(cell => cell.includes('href="https://staging.example.test/awakening-your-inner-light-2026"'))
    .map(cell => Number(cell.match(/rs-calendar-day__number">(\d+)/)[1]));
  assert.deepEqual(linkedDays, [3, 4, 5, 6, 7, 8, 9]);
  assert.equal((page.calendar().match(/<a class="rs-calendar-pill"/g) || []).length, 7);
  assert.match(page.calendar(), /aria-label="Awakening Your Inner Light · (?:3 Dec|Dec 3) – (?:9 Dec 2026|Dec 9, 2026) — view details"/);
  assert.match(page.upcoming(), /USD 3,500 per person/);
});

test("a residential retreat stays listed throughout its final published day", async () => {
  for (const now of ["2026-12-03T19:00:00", "2026-12-06T12:00:00", "2026-12-09T23:59:59"]) {
    const page = await mount({ now });
    assert.match(page.upcoming(), /Awakening Your Inner Light/, now);
    assert.equal(page.ids["events-empty"].hidden, true);
  }
  const finished = await mount({ now: "2026-12-10T00:00:00" });
  assert.doesNotMatch(finished.upcoming(), /Awakening Your Inner Light/);
  assert.equal(finished.ids["events-empty"].hidden, false);
});

test("retreat filter opens the relevant month while previous and next month controls still work", async () => {
  const group = { ...retreat, id: "november-group", title: "November gathering", category: "group", startDate: "2026-11-10", endDate: "2026-11-10" };
  const page = await mount({ events: [group, retreat] });
  assert.equal(page.ids["events-month-label"].textContent, "November 2026");
  page.filter("retreat");
  assert.equal(page.ids["events-month-label"].textContent, "December 2026");
  assert.equal(page.filters.find(button => button.dataset.eventFilter === "retreat").attributes["aria-pressed"], "true");
  assert.doesNotMatch(page.upcoming(), /November gathering/);
  page.ids["events-prev-month"].handlers.click();
  assert.equal(page.ids["events-month-label"].textContent, "November 2026");
  page.ids["events-next-month"].handlers.click();
  assert.equal(page.ids["events-month-label"].textContent, "December 2026");
});

test("cancelled events do not appear in calendar or upcoming cards", async () => {
  const page = await mount({ events: [{ ...retreat, status: "cancelled" }] });
  assert.doesNotMatch(page.calendar(), /Awakening Your Inner Light/);
  assert.equal(page.upcoming(), "");
});

test("calendar links escape content and never activate unsafe URLs", async () => {
  const page = await mount({ events: [{ ...retreat, title: '<img src=x onerror="alert(1)">', registrationUrl: "javascript:alert(1)" }] });
  assert.doesNotMatch(page.calendar(), /<a |<img|javascript:/);
  assert.match(page.calendar(), /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
});

test("a single-day event does not expand to adjacent dates", async () => {
  const page = await mount({ events: [{ ...retreat, endDate: "" }] });
  assert.equal((page.calendar().match(/<a class="rs-calendar-pill"/g) || []).length, 1);
});

test("existing recurring schedules stay listed without expanding their launch date across the calendar", async () => {
  const ongoing = { ...retreat, id: "weekly", category: "group", startDate: "2026-08-18", endDate: "", ongoing: true, activeThrough: "2027-08-17", scheduleLabel: "Weekly Tuesdays" };
  const page = await mount({ events: [ongoing, retreat] });
  assert.match(page.upcoming(), /Schedule: Weekly Tuesdays/);
  assert.match(page.upcoming(), /<span>Live<\/span>/);
  assert.equal((page.calendar().match(/<a class="rs-calendar-pill"/g) || []).length, 7);
});

test("mobile calendar links retain text, a usable target, and visible keyboard focus", () => {
  const css = readFileSync(new URL("../events-calendar.css", import.meta.url), "utf8");
  assert.match(css, /a\.rs-calendar-pill:focus-visible\{outline:2px/);
  assert.match(css, /@media\(max-width:420px\)[\s\S]*\.rs-calendar-pill\{min-height:28px/);
  assert.doesNotMatch(css, /\.rs-calendar-pill\{height:4px/);
});
