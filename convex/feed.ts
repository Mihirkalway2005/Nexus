import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

/** Returns the weekly summary for the current user (reactive). */
export const getWeeklySummary = query({
  args: { weekStartDate: v.string() },
  handler: async (ctx, { weekStartDate }) => {
    const userId = await requireAuth(ctx);
    return ctx.db
      .query("weeklySummaries")
      .withIndex("by_userId_and_week", (q) =>
        q.eq("userId", userId).eq("weekStartDate", weekStartDate)
      )
      .unique();
  },
});
