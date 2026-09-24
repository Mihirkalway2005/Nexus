import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all events, assignments, exams for user
 */
export const getEvents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    // Sort by date ascending
    return events.sort((a, b) => a.date.localeCompare(b.date));
  },
});

/**
 * Get upcoming assignments & exams (due from today onward)
 */
export const getUpcomingDeadlines = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const today = new Date().toISOString().split("T")[0];
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.gte(q.field("date"), today))
      .collect();

    const sorted = events.sort((a, b) => a.date.localeCompare(b.date));
    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

/**
 * Create a new event or assignment
 */
export const createEvent = mutation({
  args: {
    title: v.string(),
    type: v.string(), // "assignment" | "exam" | "project" | "general"
    date: v.string(), // "YYYY-MM-DD"
    time: v.optional(v.string()),
    priority: v.string(), // "low" | "medium" | "high"
    subject: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("events", {
      userId: identity.subject,
      title: args.title,
      type: args.type,
      date: args.date,
      time: args.time,
      completed: false,
      priority: args.priority,
      subject: args.subject,
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

/**
 * Toggle event completion status
 */
export const toggleEventCompleted = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.id);
    if (!event || event.userId !== identity.subject) {
      throw new Error("Event not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      completed: !event.completed,
    });
    return { success: true, completed: !event.completed };
  },
});

/**
 * Delete an event
 */
export const deleteEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const event = await ctx.db.get(args.id);
    if (!event || event.userId !== identity.subject) {
      throw new Error("Event not found or unauthorized");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
