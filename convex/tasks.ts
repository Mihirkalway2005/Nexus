import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

/**
 * Returns all tasks for the user, sorted by urgency.
 *
 * Urgency formula: (effortEstimate * 12) / (daysRemaining + 0.5)
 * — higher effort or closer due date → higher score.
 * Overdue tasks always float to the top.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const now = Date.now();
    return tasks
      .map((task) => {
        if (task.isCompleted) return { ...task, urgencyWeight: 0 };
        const msRemaining = new Date(task.dueDate).getTime() - now;
        const daysRemaining = msRemaining / 86_400_000;
        const effort = task.effortEstimate ?? 2;
        const urgencyWeight =
          daysRemaining < 0
            ? 100 + Math.abs(daysRemaining) * 5 + effort
            : (effort * 12) / (daysRemaining + 0.5);
        return { ...task, urgencyWeight: Math.round(urgencyWeight * 10) / 10 };
      })
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return b.urgencyWeight - a.urgencyWeight;
      });
  },
});

/** Returns tasks for a given week (used by the weekly planner view). */
export const listByWeek = query({
  args: { weekStart: v.string(), weekEnd: v.string() },
  handler: async (ctx, { weekStart, weekEnd }) => {
    const userId = await requireAuth(ctx);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return tasks.filter((t) => t.dueDate >= weekStart && t.dueDate <= weekEnd);
  },
});

export const create = mutation({
  args: {
    courseId: v.optional(v.id("courses")),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    dueDate: v.string(),
    effortEstimate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const now = new Date().toISOString();
    return ctx.db.insert("tasks", { userId, ...args, isCompleted: false, createdAt: now, updatedAt: now });
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    effortEstimate: v.optional(v.number()),
    isCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, { taskId, ...patch }) => {
    const userId = await requireAuth(ctx);
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== userId) throw new Error("Not found.");
    await ctx.db.patch(taskId, { ...patch, updatedAt: new Date().toISOString() });
    return { success: true };
  },
});

export const remove = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    const userId = await requireAuth(ctx);
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== userId) throw new Error("Not found.");
    await ctx.db.delete(taskId);
    return { success: true };
  },
});
