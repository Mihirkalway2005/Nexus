// TODO: Phase 1 feature screen — implement after env vars are configured.
// Wire to: api.feed.getWeeklySummary (reads pre-generated weeklySummaries doc)
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, fontSize, fontWeight } from "@/constants/spacing";

export default function FeedScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Weekly Digest</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        Personalised feed: internships, industry news, academic tips — scoped to your interests. Coming next.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: spacing.sm },
  sub: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
});
