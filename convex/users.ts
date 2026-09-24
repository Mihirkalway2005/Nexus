import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the currently authenticated user's profile from the application database.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // In Better Auth integration, identity.subject corresponds to the Better Auth user ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    return user;
  },
});

/**
 * Update the user's theme preference.
 */
export const updateTheme = mutation({
  args: { theme: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Not logged in");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User record not found in application database");
    }

    await ctx.db.patch(user._id, {
      theme: args.theme,
      updatedAt: Date.now(),
    });

    return { success: true, theme: args.theme };
  },
});

/**
 * Mark onboarding as completed for the current user.
 */
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Not logged in");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User record not found in application database");
    }

    await ctx.db.patch(user._id, {
      onboardingCompleted: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update academic profile details
 */
export const updateAcademicProfile = mutation({
  args: {
    college: v.optional(v.string()),
    major: v.optional(v.string()),
    semester: v.optional(v.string()),
    rollNo: v.optional(v.string()),
    targetAttendance: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Not logged in");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User record not found in application database");
    }

    await ctx.db.patch(user._id, {
      college: args.college ?? user.college,
      major: args.major ?? user.major,
      semester: args.semester ?? user.semester,
      rollNo: args.rollNo ?? user.rollNo,
      targetAttendance: args.targetAttendance ?? user.targetAttendance,
      currency: args.currency ?? user.currency,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
