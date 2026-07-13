import { useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { api } from "@/convex/_generated/api";

/**
 * Auth gate: the app's entry point.
 * - Not signed in → (auth)/sign-in
 * - Signed in, not onboarded → onboarding/interests
 * - Signed in, onboarded → (tabs)/planner
 *
 * Also calls storeUser on every launch to upsert the Convex user record.
 */
export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const storeUser = useMutation(api.users.storeUser);
  const user = useQuery(api.users.currentUser);

  useEffect(() => {
    if (isSignedIn) {
      storeUser().catch(console.error);
    }
  }, [isSignedIn]);

  if (!isLoaded || (isSignedIn && user === undefined)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7c6ff7" />
      </View>
    );
  }

  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  if (!user?.isOnboarded) return <Redirect href="/onboarding/interests" />;
  return <Redirect href="/(tabs)/planner" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0f" },
});
