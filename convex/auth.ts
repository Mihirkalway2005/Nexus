import { v } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

/** Returns the Clerk user ID from the JWT, or null if unauthenticated. */
export async function getCurrentUserId(ctx: QueryCtx | MutationCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity ? identity.subject : null;
}

/** Throws if unauthenticated; returns the Clerk user ID. */
export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<string> {
  const id = await getCurrentUserId(ctx);
  if (!id) throw new Error("Unauthenticated.");
  return id;
}

/** Fetches the current user's Convex document. */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users"> | null> {
  const clerkId = await getCurrentUserId(ctx);
  if (!clerkId) return null;
  return ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId)).unique();
}
