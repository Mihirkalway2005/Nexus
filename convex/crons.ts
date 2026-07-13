import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Runs every Sunday at 20:00 UTC to pre-generate the following week's summary
 * for all onboarded users. Results are stored in weeklySummaries and read
 * reactively — the feed screen never triggers a live AI call.
 */
const crons = cronJobs();

crons.weekly(
  "generate-weekly-summaries",
  { dayOfWeek: "sunday", hourUTC: 20, minuteUTC: 0 },
  internal.ai.weeklyInsight.generateForUser,
  // NOTE: generateForUser takes a userId + weekStartDate.
  // In production, replace this with a fan-out mutation that queries all
  // onboarded users and schedules individual runs per user.
  // Placeholder args for single-user dev testing:
  { userId: "REPLACE_WITH_CLERK_ID", weekStartDate: "2024-01-01" }
);

export default crons;
