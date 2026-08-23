export const KIDS_WEEKLY_PRACTICE_TIME_ZONE = "Asia/Makassar";

export const KIDS_WEEKLY_PRACTICE_DATES = Object.freeze([
  "2026-08-29", "2026-09-05", "2026-09-12", "2026-09-19",
  "2026-09-26", "2026-10-03", "2026-10-10", "2026-10-17",
  "2026-10-24", "2026-10-31", "2026-11-07", "2026-11-14"
]);

const FOUR_WEEK_SESSION_ID = "kids-weekly-practice-2026-08-29-four-week";
const TWELVE_WEEK_SESSION_ID = "kids-weekly-practice-2026-08-29-twelve-week";

export function kidsWeeklyPracticeDatesForSession(sessionId) {
  if (sessionId === FOUR_WEEK_SESSION_ID) return KIDS_WEEKLY_PRACTICE_DATES.slice(0, 4);
  if (sessionId === TWELVE_WEEK_SESSION_ID) return KIDS_WEEKLY_PRACTICE_DATES;
  return [];
}

export function kidsWeeklyPracticeCommitment(sessionId) {
  if (sessionId === FOUR_WEEK_SESSION_ID) return "Four weekly sessions";
  if (sessionId === TWELVE_WEEK_SESSION_ID) return "Twelve weekly sessions";
  return "Weekly practice";
}

export function displayKidsWeeklyPracticeDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: KIDS_WEEKLY_PRACTICE_TIME_ZONE
  }).format(new Date(`${date}T20:00:00+08:00`));
}

export function kidsWeeklyPracticeSessionIdForDate(date) {
  return `kids-weekly-practice-${date}`;
}
