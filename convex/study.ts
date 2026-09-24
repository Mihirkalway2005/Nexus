import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get study stats (today's minutes, this week's minutes, recent sessions)
 */
export const getStudyStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { todayMinutes: 0, weekMinutes: 0, totalSessions: 0, recentSessions: [] };
    }

    const sessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - now.getDay() * 24 * 60 * 60 * 1000;

    let todayMinutes = 0;
    let weekMinutes = 0;

    for (const session of sessions) {
      if (session.completedAt >= startOfToday) {
        todayMinutes += session.durationMinutes;
      }
      if (session.completedAt >= startOfWeek) {
        weekMinutes += session.durationMinutes;
      }
    }

    const sortedRecent = sessions
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 5);

    return {
      todayMinutes,
      weekMinutes,
      totalSessions: sessions.length,
      recentSessions: sortedRecent,
    };
  },
});

/**
 * Log a completed study/focus session
 */
export const logSession = mutation({
  args: {
    subject: v.optional(v.string()),
    durationMinutes: v.number(),
    mode: v.string(), // "pomodoro" | "deepwork" | "review"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("studySessions", {
      userId: identity.subject,
      subject: args.subject,
      durationMinutes: args.durationMinutes,
      mode: args.mode,
      completedAt: Date.now(),
    });
  },
});

/**
 * Get study notes
 */
export const getNotes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const notes = await ctx.db
      .query("studyNotes")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return notes.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Create or update a study note
 */
export const saveNote = mutation({
  args: {
    id: v.optional(v.id("studyNotes")),
    title: v.string(),
    subject: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing || existing.userId !== identity.subject) {
        throw new Error("Note not found or unauthorized");
      }
      await ctx.db.patch(args.id, {
        title: args.title,
        subject: args.subject,
        content: args.content,
        tags: args.tags,
        updatedAt: Date.now(),
      });
      return args.id;
    } else {
      return await ctx.db.insert("studyNotes", {
        userId: identity.subject,
        title: args.title,
        subject: args.subject,
        content: args.content,
        tags: args.tags,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Delete a study note
 */
export const deleteNote = mutation({
  args: { id: v.id("studyNotes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const note = await ctx.db.get(args.id);
    if (!note || note.userId !== identity.subject) {
      throw new Error("Note not found or unauthorized");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Get flashcards
 */
export const getFlashcards = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("flashcards")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

/**
 * Create a flashcard
 */
export const createFlashcard = mutation({
  args: {
    deck: v.string(),
    front: v.string(),
    back: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("flashcards", {
      userId: identity.subject,
      deck: args.deck,
      front: args.front,
      back: args.back,
      mastered: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Toggle flashcard mastered status
 */
export const toggleFlashcardMastered = mutation({
  args: { id: v.id("flashcards") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const card = await ctx.db.get(args.id);
    if (!card || card.userId !== identity.subject) {
      throw new Error("Card not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      mastered: !card.mastered,
    });
    return { success: true, mastered: !card.mastered };
  },
});

/**
 * Delete a flashcard
 */
export const deleteFlashcard = mutation({
  args: { id: v.id("flashcards") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const card = await ctx.db.get(args.id);
    if (!card || card.userId !== identity.subject) {
      throw new Error("Card not found or unauthorized");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Batch create multiple flashcards
 */
export const createFlashcardsBatch = mutation({
  args: {
    cards: v.array(
      v.object({
        deck: v.string(),
        front: v.string(),
        back: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const ids = [];
    for (const card of args.cards) {
      const id = await ctx.db.insert("flashcards", {
        userId: identity.subject,
        deck: card.deck,
        front: card.front,
        back: card.back,
        mastered: false,
        createdAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

