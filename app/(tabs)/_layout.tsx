import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: string }) {
  return (
    <View style={focused ? styles.activeIconWrap : undefined}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen
        name="planner/index"
        options={{
          title: "Planner",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "calendar" : "calendar-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget/index"
        options={{
          title: "Budget",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "wallet" : "wallet-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes/index"
        options={{
          title: "Notes",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "document-text" : "document-text-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed/index"
        options={{
          title: "Feed",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "newspaper" : "newspaper-outline"} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconWrap: {
    backgroundColor: "rgba(124,111,247,0.12)",
    borderRadius: 8,
    padding: 4,
  },
});
