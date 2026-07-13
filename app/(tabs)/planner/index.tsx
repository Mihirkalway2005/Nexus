// TODO: Phase 1 feature screen — implement after env vars are configured.
// Wire to: api.tasks.list, api.tasks.listByWeek, api.courses.list
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, fontSize, fontWeight } from "@/constants/spacing";

export default function PlannerScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Planner</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        Weekly view: timetable + assignments + exams — coming next.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: spacing.sm },
  sub: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
});
