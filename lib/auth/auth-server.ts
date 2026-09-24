import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not defined in environment variables.");
}

// Derive the Convex HTTP site URL if not explicitly provided
const convexSiteUrl =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
  convexUrl.replace(".convex.cloud", ".convex.site");

export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
} = convexBetterAuthNextJs({
  convexUrl,
  convexSiteUrl,
});
