import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { themes, ThemeName } from "@/constants/colors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/spacing";

const C = themes.dark;

const THEME_OPTIONS: { key: ThemeName; label: string; desc: string; preview: string }[] = [
  { key: "dark", label: "Dark", desc: "True dark mode. Easy on the eyes at night.", preview: "#0a0a0f" },
  { key: "light", label: "Light", desc: "High-contrast. Best for daytime study sessions.", preview: "#f8f8fc" },
  { key: "warm", label: "Warm", desc: "Low blue-light tone for evening reading.", preview: "#16120e" },
];

export default function OnboardingTheme() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    fieldOfStudy: string; interests: string; firstCourse: string;
  }>();

  const [selectedTheme, setSelectedTheme] = useState<ThemeName>("dark");
  const [loading, setLoading] = useState(false);

  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const createCourse = useMutation(api.courses.create);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const interests = JSON.parse(params.interests ?? "[]") as string[];

      // 1. Save onboarding preferences
      await completeOnboarding({
        fieldOfStudy: params.fieldOfStudy ?? "",
        interests,
        theme: selectedTheme,
      });

      // 2. Create first course if provided
      if (params.firstCourse) {
        const course = JSON.parse(params.firstCourse);
        if (course?.code && course?.name) {
          await createCourse({
            code: course.code,
            name: course.name,
            color: course.color,
            schedule: course.schedule ?? [],
          });
        }
      }

      // 3. Navigate to main app — index.tsx will redirect to (tabs)/planner
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.progress}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      <Text style={styles.title}>Choose your theme</Text>
      <Text style={styles.subtitle}>
        This controls how the app looks. You can change it any time in Settings.
      </Text>

      {THEME_OPTIONS.map(({ key, label, desc, preview }) => (
        <TouchableOpacity
          key={key}
          style={[styles.themeCard, selectedTheme === key && styles.themeCardActive]}
          onPress={() => setSelectedTheme(key)}
          activeOpacity={0.8}
        >
          <View style={[styles.themePreview, { backgroundColor: preview }]} />
          <View style={styles.themeInfo}>
            <Text style={styles.themeLabel}>{label}</Text>
            <Text style={styles.themeDesc}>{desc}</Text>
          </View>
          <View style={[styles.radio, selectedTheme === key && styles.radioActive]}>
            {selectedTheme === key && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.finishBtn, loading && styles.btnDisabled]}
        onPress={handleFinish}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.finishBtnText}>Let's go →</Text>
        )}
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
  themeCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    padding: spacing.md, borderRadius: radius.lg,
    backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border,
  },
  themeCardActive: { borderColor: C.accent, backgroundColor: C.accentMuted },
  themePreview: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: C.border },
  themeInfo: { flex: 1 },
  themeLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: C.textPrimary },
  themeDesc: { fontSize: fontSize.sm, color: C.textMuted, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: radius.full, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: C.accent },
  radioDot: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: C.accent },
  finishBtn: { backgroundColor: C.accent, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.md },
  btnDisabled: { opacity: 0.5 },
  finishBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: C.accentText },
});
