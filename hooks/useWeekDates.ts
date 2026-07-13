/**
 * Returns the Monday and Sunday date strings for a given date's week.
 * Used everywhere we need week-scoped Convex queries.
 */
export function getWeekBounds(date: Date = new Date()): {
  weekStart: string;
  weekEnd: string;
} {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  return {
    weekStart: toDateString(mon),
    weekEnd: toDateString(sun),
  };
}

export function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getDayLabel(dayOfWeek: number): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek] ?? "";
}
