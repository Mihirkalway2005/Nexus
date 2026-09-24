import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get current month budget overview and statistics
 */
export const getBudgetOverview = query({
  args: { month: v.optional(v.string()) }, // "YYYY-MM"
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const currentMonthStr = args.month || new Date().toISOString().slice(0, 7);

    if (!identity) {
      return {
        month: currentMonthStr,
        monthlyLimit: 0,
        totalSpent: 0,
        remaining: 0,
        percentageUsed: 0,
        categoryBreakdown: {},
        expenses: [],
      };
    }

    // Get budget limit
    const budgetRecord = await ctx.db
      .query("budgets")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", identity.subject).eq("month", currentMonthStr)
      )
      .first();

    const monthlyLimit = budgetRecord ? budgetRecord.monthlyLimit : 500; // default 500 if unset

    // Get all expenses
    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    // Filter by month
    const monthExpenses = allExpenses.filter((e) => e.date.startsWith(currentMonthStr));

    let totalSpent = 0;
    const categoryBreakdown: Record<string, number> = {
      food: 0,
      transport: 0,
      books: 0,
      leisure: 0,
      bills: 0,
      other: 0,
    };

    for (const exp of monthExpenses) {
      totalSpent += exp.amount;
      const cat = exp.category.toLowerCase();
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + exp.amount;
    }

    const remaining = monthlyLimit - totalSpent;
    const percentageUsed =
      monthlyLimit > 0 ? Math.min(100, Math.round((totalSpent / monthlyLimit) * 100)) : 0;

    const sortedExpenses = monthExpenses.sort((a, b) => b.date.localeCompare(a.date));

    return {
      month: currentMonthStr,
      monthlyLimit,
      totalSpent: Math.round(totalSpent * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      percentageUsed,
      categoryBreakdown,
      expenses: sortedExpenses,
    };
  },
});

/**
 * Set monthly budget limit
 */
export const setMonthlyBudget = mutation({
  args: {
    month: v.string(), // "YYYY-MM"
    monthlyLimit: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", identity.subject).eq("month", args.month)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        monthlyLimit: args.monthlyLimit,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("budgets", {
        userId: identity.subject,
        month: args.month,
        monthlyLimit: args.monthlyLimit,
      });
    }
  },
});

/**
 * Add a new expense
 */
export const addExpense = mutation({
  args: {
    title: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("expenses", {
      userId: identity.subject,
      title: args.title,
      amount: Math.abs(args.amount),
      category: args.category,
      date: args.date,
      createdAt: Date.now(),
    });
  },
});

/**
 * Delete an expense
 */
export const deleteExpense = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const exp = await ctx.db.get(args.id);
    if (!exp || exp.userId !== identity.subject) {
      throw new Error("Expense not found or unauthorized");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
