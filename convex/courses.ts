import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

/** Lists all courses for the current user (reactive). */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    return ctx.db.query("courses").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
  },
});

/** Creates a new course with its weekly schedule. */
export const create = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    color: v.string(),
    schedule: v.array(v.object({
      dayOfWeek: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      room: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const now = new Date().toISOString();
    return ctx.db.insert("courses", { userId, ...args, createdAt: now, updatedAt: now });
  },
});

/** Updates a course. Validates ownership before writing. */
export const update = mutation({
  args: {
    courseId: v.id("courses"),
    code: v.optional(v.string()),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    schedule: v.optional(v.array(v.object({
      dayOfWeek: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      room: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, { courseId, ...patch }) => {
    const userId = await requireAuth(ctx);
    const course = await ctx.db.get(courseId);
    if (!course || course.userId !== userId) throw new Error("Not found.");
    await ctx.db.patch(courseId, { ...patch, updatedAt: new Date().toISOString() });
    return { success: true };
  },
});

/**
 * Deletes a course and nulls out `courseId` on any linked tasks and notes
 * so references don't become dangling.
 */
export const remove = mutation({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) => {
    const userId = await requireAuth(ctx);
    const course = await ctx.db.get(courseId);
    if (!course || course.userId !== userId) throw new Error("Not found.");

    const now = new Date().toISOString();
    const tasks = await ctx.db.query("tasks").withIndex("by_courseId", (q) => q.eq("courseId", courseId)).collect();
    await Promise.all(tasks.map((t) => ctx.db.patch(t._id, { courseId: undefined, updatedAt: now })));

    const notes = await ctx.db.query("notes").withIndex("by_courseId", (q) => q.eq("courseId", courseId)).collect();
    await Promise.all(notes.map((n) => ctx.db.patch(n._id, { courseId: undefined, updatedAt: now })));

    await ctx.db.delete(courseId);
    return { success: true };
  },
});
