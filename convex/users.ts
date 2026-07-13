import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAuth } from "./auth";

/** Returns the current user's Convex document (reactive). */
export const currentUser = query({
  args: {},
  handler: async (ctx) => getCurrentUser(ctx),
});

/**
 * Called on every app launch when signed in.
 * Creates a user record on first login; updates display info if it changed.
 * Never duplicates — safe to call repeatedly.
 */
export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated.");

    const clerkId = identity.subject;
    const now = new Date().toISOString();
    const patch = {
      email: identity.email ?? "",
      firstName: identity.givenName ?? "",
      lastName: identity.familyName ?? "",
      imageUrl: identity.pictureUrl ?? "",
      updatedAt: now,
    };

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return ctx.db.insert("users", {
      clerkId,
      ...patch,
      isOnboarded: false,
      theme: "dark",
      interests: [],
      fieldOfStudy: "",
      createdAt: now,
    });
  },
});

/**
 * Saves all onboarding choices and marks the user as onboarded.
 * Called once at the end of the onboarding flow.
 */
export const completeOnboarding = mutation({
  args: {
    fieldOfStudy: v.string(),
    interests: v.array(v.string()),
    theme: v.string(),
    weeklyBudgetLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const clerkId = await requireAuth(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (!user) throw new Error("User not found.");

    await ctx.db.patch(user._id, {
      ...args,
      isOnboarded: true,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

/** Updates the user's theme preference. */
export const updateTheme = mutation({
  args: { theme: v.string() },
  handler: async (ctx, args) => {
    const clerkId = await requireAuth(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (!user) throw new Error("User not found.");

    await ctx.db.patch(user._id, {
      theme: args.theme,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

/** Updates the user's weekly budget limit. */
export const updateBudgetLimit = mutation({
  args: { weeklyBudgetLimit: v.number() },
  handler: async (ctx, args) => {
    const clerkId = await requireAuth(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (!user) throw new Error("User not found.");

    await ctx.db.patch(user._id, {
      weeklyBudgetLimit: args.weeklyBudgetLimit,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});
