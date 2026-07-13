import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { requireAuth } from "./auth";

/** Lists all notes for the current user (reactive). */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    return ctx.db
      .query("notes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/** Returns a single note by ID (reactive — updates when Claude finishes). */
export const getById = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    const userId = await requireAuth(ctx);
    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== userId) return null;
    return note;
  },
});

/**
 * Creates a note in "pending" state and immediately triggers the AI action.
 * The UI subscribes reactively — it will update automatically when Claude finishes.
 */
export const createAndSummarize = mutation({
  args: {
    courseId: v.optional(v.id("courses")),
    title: v.string(),
    sourceUrl: v.optional(v.string()),
    sourceType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const now = new Date().toISOString();

    const noteId = await ctx.db.insert("notes", {
      userId,
      ...args,
      summary: "",
      flashcards: [],
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Schedule the AI action — runs server-side, never on client
    await ctx.scheduler.runAfter(0, api.ai.summarize.run, { noteId });

    return noteId;
  },
});

export const remove = mutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    const userId = await requireAuth(ctx);
    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== userId) throw new Error("Not found.");
    await ctx.db.delete(noteId);
    return { success: true };
  },
});
