const FIRST_SESSION = Object.freeze({
  id: "group-healing-2026-08-18",
  title: "Grounding & Renewal",
  start: "2026-08-18T21:00:00+08:00",
  end: "2026-08-18T22:00:00+08:00",
  date: "Tuesday, 18 August 2026",
  time: "9:00 PM",
  timezone: "Asia/Makassar (UTC+8)",
  location: "Online via Zoom — access details follow separately"
});

function weeklySession(date) {
  const iso = date.toISOString().slice(0, 10);
  const display = new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
  }).format(date);
  return Object.freeze({
    id: `group-healing-weekly-${iso}`,
    title: "Weekly Group Healing",
    start: `${iso}T21:00:00+08:00`,
    end: `${iso}T22:00:00+08:00`,
    date: display,
    time: "9:00 PM",
    timezone: "Asia/Makassar (UTC+8)",
    location: "Online via Zoom — access details follow separately"
  });
}

export const GROUP_HEALING_SCHEDULE = Object.freeze([
  FIRST_SESSION,
  ...Array.from({ length: 52 }, (_, index) => weeklySession(new Date(Date.UTC(2026, 7, 25 + index * 7))))
]);

export function groupHealingScheduleDetails(eventId) {
  return GROUP_HEALING_SCHEDULE.find((event) => event.id === eventId) || null;
}

export function isApprovedGroupHealingEvent(eventId) {
  return Boolean(groupHealingScheduleDetails(eventId));
}
