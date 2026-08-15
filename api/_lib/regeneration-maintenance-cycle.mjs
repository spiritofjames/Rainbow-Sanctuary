export const REGENERATION_MAINTENANCE_OPENING_DATES = Object.freeze([
  "2026-08-17", "2026-08-24", "2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21",
  "2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02"
]);

export const REGENERATION_MAINTENANCE_MONTHLY_DATES = Object.freeze(
  REGENERATION_MAINTENANCE_OPENING_DATES.slice(0, 4)
);

export function regenerationMaintenanceDatesForSession(sessionId) {
  if (sessionId === "regeneration-maintenance-2026-08-17-monthly") return REGENERATION_MAINTENANCE_MONTHLY_DATES;
  if (sessionId === "regeneration-maintenance-2026-08-17-three-month") return REGENERATION_MAINTENANCE_OPENING_DATES;
  return [];
}
