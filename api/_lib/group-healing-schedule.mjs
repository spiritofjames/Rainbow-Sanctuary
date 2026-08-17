const FIRST_SESSION = Object.freeze({
  id: "group-healing-2026-08-18",
  title: "Grounding & Renewal",
  date: "Tuesday, 18 August 2026",
  start: "2026-08-18T21:00:00+08:00",
  end: "2026-08-18T22:00:00+08:00"
});

const WEEKLY_START_DATE = "2026-08-25";
const WEEKLY_SESSION_COUNT = 52;
const WEEKLY_ID_PREFIX = "group-healing-weekly-";
const TIMEZONE = "Asia/Makassar (UTC+8)";

function isoDateFromUtc(date) {
  return date.toISOString().slice(0, 10);
}

function utcDate(isoDate) {
  const value = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(value.getTime())) throw new Error("Invalid Group Healing schedule date.");
  return value;
}

function details({ id, title, date, start, end }) {
  return Object.freeze({
    id,
    title,
    date,
    start,
    end,
    time: "9:00 PM",
    timezone: TIMEZONE,
    location: "Online via Zoom — access details follow separately"
  });
}

export function groupHealingScheduleDetails(eventId) {
  if (eventId === FIRST_SESSION.id) return details(FIRST_SESSION);

  const match = new RegExp(`^${WEEKLY_ID_PREFIX}(\\d{4}-\\d{2}-\\d{2})$`).exec(String(eventId || ""));
  if (!match) return null;

  const requested = utcDate(match[1]);
  const start = utcDate(WEEKLY_START_DATE);
  const difference = Math.round((requested.getTime() - start.getTime()) / 86_400_000);
  if (difference < 0 || difference % 7 !== 0 || difference / 7 >= WEEKLY_SESSION_COUNT) return null;

  const date = isoDateFromUtc(requested);
  const readableDate = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Makassar",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${date}T13:00:00Z`));

  return details({
    id: `${WEEKLY_ID_PREFIX}${date}`,
    title: "Online Group Healing",
    date: readableDate,
    start: `${date}T21:00:00+08:00`,
    end: `${date}T22:00:00+08:00`
  });
}

export function isApprovedGroupHealingEvent(eventId) {
  return Boolean(groupHealingScheduleDetails(eventId));
}
