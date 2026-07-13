import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { themes, ThemeName, ColorTokens } from "@/constants/colors";

/**
 * Returns the full color token set for the current user's theme.
 * Falls back to "dark" while loading or if unauthenticated.
 */
export function useTheme(): { colors: ColorTokens; themeName: ThemeName } {
  const user = useQuery(api.users.currentUser);
  const themeName: ThemeName =
    (user?.theme as ThemeName | undefined) ?? "dark";
  return { colors: themes[themeName], themeName };
}
