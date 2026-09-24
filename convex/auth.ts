import { createClient, type AuthFunctions } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

// Setup triggers internal functions routing
const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(
  components.betterAuth,
  {
    authFunctions,
    triggers: {
      user: {
        onCreate: async (ctx, authUser) => {
          // Check if there is an existing user by email to prevent duplicates
          const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", authUser.email))
            .first();

          if (existingUser) {
            // Update mapping if it was created under a different ID or provider
            await ctx.db.patch(existingUser._id, {
              authUserId: authUser._id,
              name: authUser.name || existingUser.name,
              image: authUser.image || existingUser.image,
              updatedAt: Date.now(),
            });
          } else {
            // Determine initial provider (defaulting to "google" or "password")
            const isGoogle = authUser.emailVerified || authUser.image?.includes("googleusercontent.com");
            const provider = isGoogle ? "google" : "password";

            // Insert into the application's users table
            await ctx.db.insert("users", {
              name: authUser.name || authUser.email.split("@")[0],
              email: authUser.email,
              image: authUser.image || undefined,
              provider,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              onboardingCompleted: false,
              theme: "system",
              authUserId: authUser._id,
            });
          }
        },
        onUpdate: async (ctx, oldUser, newUser) => {
          // Keep application user profile in sync
          const existingUser = await ctx.db
            .query("users")
            .withIndex("by_authUserId", (q) => q.eq("authUserId", newUser._id))
            .first();

          if (existingUser) {
            await ctx.db.patch(existingUser._id, {
              name: newUser.name || existingUser.name,
              email: newUser.email,
              image: newUser.image || existingUser.image,
              updatedAt: Date.now(),
            });
          }
        },
        onDelete: async (ctx, authUser) => {
          // Clean up application profile when user is deleted
          const existingUser = await ctx.db
            .query("users")
            .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser._id))
            .first();

          if (existingUser) {
            await ctx.db.delete(existingUser._id);
          }
        },
      },
    },
  }
);

// Export triggers internal mutations
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  const siteUrl = process.env.SITE_URL || "http://localhost:3000";
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const hasGoogleAuth =
    Boolean(googleClientId) &&
    Boolean(googleClientSecret) &&
    !googleClientId?.includes("placeholder") &&
    !googleClientId?.includes("your-google-client-id");

  return {
    appName: "Nexus",
    baseURL: siteUrl,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [
      siteUrl,
      process.env.CLIENT_ORIGIN,
      process.env.NEXT_PUBLIC_APP_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3002",
    ].filter(Boolean) as string[],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    socialProviders: {
      ...(hasGoogleAuth
        ? {
            google: {
              clientId: googleClientId!,
              clientSecret: googleClientSecret!,
            },
          }
        : {}),
    },
    plugins: [convex({ authConfig })],
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};
