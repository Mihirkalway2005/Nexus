import { useRouter } from "expo-router";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useState } from "react";
import { themes } from "@/constants/colors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/spacing";

const C = themes.dark;

const INTEREST_OPTIONS = [
  "Artificial Intelligence", "Machine Learning", "Web Dev", "Cybersecurity",
  "Finance", "Economics", "Data Science", "Research", "Design", "Startups",
  "Biotech", "Law", "Medicine", "Physics", "Mathematics", "Sustainability",
];

export default function OnboardingInterests() {
  const router = useRouter();
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : prev.length < 3 ? [...prev, item] : prev
    );
  };

  const canContinue = fieldOfStudy.trim().length > 0 && selected.length >= 1;

  const handleNext = () => {
    router.push({
      pathname: "/onboarding/course-setup",
      params: { fieldOfStudy: fieldOfStudy.trim(), interests: JSON.stringify(selected) },
    });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.progress}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <Text style={styles.title}>What are you studying?</Text>
      <Text style={styles.subtitle}>
        Nexus uses this to personalise your weekly feed — no tracking, no ads.
      </Text>

      <Text style={styles.label}>Field of study</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Computer Science, Economics…"
        placeholderTextColor={C.textMuted}
        value={fieldOfStudy}
        onChangeText={setFieldOfStudy}
      />

      <Text style={styles.label}>Pick up to 3 interests</Text>
      <View style={styles.chips}>
        {INTEREST_OPTIONS.map((item) => {
          const active = selected.includes(item);
          return (
            <TouchableOpacity
              key={item}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(item)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, !canContinue && styles.btnDisabled]}
        onPress={handleNext}
        disabled={!canContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.nextBtnText}>Next →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  progress: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: C.border },
  dotActive: { backgroundColor: C.accent, width: 24 },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: C.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: fontSize.sm, color: C.textMuted, lineHeight: 20 },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  input: { backgroundColor: C.bgInput, borderRadius: radius.md, borderWidth: 1, borderColor: C.border, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: fontSize.base, color: C.textPrimary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.accentMuted, borderColor: C.accent },
  chipText: { fontSize: fontSize.sm, color: C.textSecondary },
  chipTextActive: { color: C.accent, fontWeight: fontWeight.semibold },
  nextBtn: { backgroundColor: C.accent, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.md },
  btnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: C.accentText },
});
