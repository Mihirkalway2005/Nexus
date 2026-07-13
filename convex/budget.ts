import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

const VALID_CATEGORIES = ["Food", "Travel", "Essentials", "Entertainment", "Other"] as const;

/** Returns budget entries for a date range (reactive). */
export const listByRange = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { startDate, endDate }) => {
    const userId = await requireAuth(ctx);
    const entries = await ctx.db
      .query("budgetEntries")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return entries
      .filter((e) => e.date >= startDate && e.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  },
});

/**
 * Weekly budget summary: totals per category, spent vs limit, days remaining.
 * Used by the Budget tab header card — reactive, no polling needed.
 */
export const weekSummary = query({
  args: { weekStart: v.string(), weekEnd: v.string() },
  handler: async (ctx, { weekStart, weekEnd }) => {
    const userId = await requireAuth(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
      .unique();

    const entries = await ctx.db
      .query("budgetEntries")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const weekEntries = entries.filter((e) => e.date >= weekStart && e.date <= weekEnd);

    const totals: Record<string, number> = {
      Food: 0, Travel: 0, Essentials: 0, Entertainment: 0, Other: 0,
    };
    let totalSpent = 0;
    for (const e of weekEntries) {
      const cat = VALID_CATEGORIES.includes(e.category as any) ? e.category : "Other";
      totals[cat] = (totals[cat] ?? 0) + e.amount;
      totalSpent += e.amount;
    }

    const limit = user?.weeklyBudgetLimit ?? 0;
    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      weeklyLimit: limit,
      remaining: Math.round((limit - totalSpent) * 100) / 100,
      categoryTotals: totals,
      entryCount: weekEntries.length,
    };
  },
});

export const create = mutation({
  args: {
    amount: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    if (!VALID_CATEGORIES.includes(args.category as any)) {
      throw new Error(`Category must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }
    const now = new Date().toISOString();
    return ctx.db.insert("budgetEntries", { userId, ...args, createdAt: now, updatedAt: now });
  },
});

export const remove = mutation({
  args: { entryId: v.id("budgetEntries") },
  handler: async (ctx, { entryId }) => {
    const userId = await requireAuth(ctx);
    const entry = await ctx.db.get(entryId);
    if (!entry || entry.userId !== userId) throw new Error("Not found.");
    await ctx.db.delete(entryId);
    return { success: true };
  },
});
