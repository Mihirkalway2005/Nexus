import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Convex Scheduled Action: runs once per week (configured via cron).
 * Generates the cross-feature weekly summary for all users who have onboarded.
 * Uses Claude to synthesize budget pacing, planner load, and feed items.
 *
 * NEVER called on page load — results are stored and read reactively.
 */
export const generateForUser = internalAction({
  args: { userId: v.string(), weekStartDate: v.string() },
  handler: async (ctx, { userId, weekStartDate }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set.");

    // Fetch context data for this user's week
    const context = await ctx.runQuery(internal.ai.weeklyInsight.getWeekContext, {
      userId,
      weekStartDate,
    });

    let budgetInsight = "No budget data this week.";
    let plannerInsight = "No tasks due this week.";
    let feedItems: Array<{ title: string; description: string; url?: string; category: string; source?: string }> = [];

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 1500,
          messages: [
            {
              role: "user",
              content: `You are a calm student productivity assistant. Based on this week's data, generate a concise weekly summary.

Context:
${JSON.stringify(context, null, 2)}

Return ONLY valid JSON (no markdown wrapper):
{
  "budgetInsight": "One sentence about budget pacing. E.g. 'Food at 65% with 3 days left — on track.'",
  "plannerInsight": "One sentence about academic load. E.g. 'Two assignments and one exam — heavy week.'",
  "feedItems": [
    {
      "title": "Article or opportunity title",
      "description": "One sentence description",
      "url": "https://...",
      "category": "Internship | Industry News | Academic Tip",
      "source": "Source name"
    }
  ]
}

Generate 3–5 feed items highly relevant to the student's field of study and interests: ${context.fieldOfStudy}, ${context.interests?.join(", ")}.`,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);
      const data = await response.json();
      const parsed = JSON.parse(data.content?.[0]?.text ?? "{}");
      budgetInsight = parsed.budgetInsight ?? budgetInsight;
      plannerInsight = parsed.plannerInsight ?? plannerInsight;
      feedItems = Array.isArray(parsed.feedItems) ? parsed.feedItems : [];
    } catch (err: any) {
      console.error("weeklyInsight error:", err?.message);
    }

    await ctx.runMutation(internal.ai.weeklyInsight.upsertSummary, {
      userId,
      weekStartDate,
      budgetInsight,
      plannerInsight,
      feedItems,
      status: "completed",
    });
  },
});

export const getWeekContext = internalQuery({
  args: { userId: v.string(), weekStartDate: v.string() },
  handler: async (ctx, { userId, weekStartDate }) => {
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    const user = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", userId)).unique();
    const tasks = await ctx.db.query("tasks").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
    const budgetEntries = await ctx.db.query("budgetEntries").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();

    const weekTasks = tasks.filter((t) => t.dueDate >= weekStartDate && t.dueDate <= weekEndStr);
    const weekBudget = budgetEntries.filter((e) => e.date >= weekStartDate && e.date <= weekEndStr);
    const totalSpent = weekBudget.reduce((sum, e) => sum + e.amount, 0);

    return {
      fieldOfStudy: user?.fieldOfStudy ?? "",
      interests: user?.interests ?? [],
      weeklyBudgetLimit: user?.weeklyBudgetLimit ?? 0,
      totalSpent: Math.round(totalSpent * 100) / 100,
      upcomingTasks: weekTasks.map((t) => ({ title: t.title, type: t.type, dueDate: t.dueDate })),
    };
  },
});

export const upsertSummary = internalMutation({
  args: {
    userId: v.string(),
    weekStartDate: v.string(),
    budgetInsight: v.string(),
    plannerInsight: v.string(),
    feedItems: v.array(v.object({
      title: v.string(),
      description: v.string(),
      url: v.optional(v.string()),
      category: v.string(),
      source: v.optional(v.string()),
    })),
    status: v.string(),
  },
  handler: async (ctx, { userId, weekStartDate, ...data }) => {
    const existing = await ctx.db
      .query("weeklySummaries")
      .withIndex("by_userId_and_week", (q) =>
        q.eq("userId", userId).eq("weekStartDate", weekStartDate)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("weeklySummaries", {
        userId,
        weekStartDate,
        ...data,
        createdAt: new Date().toISOString(),
      });
    }
  },
});
