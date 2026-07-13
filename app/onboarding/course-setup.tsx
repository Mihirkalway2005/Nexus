import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
} from "react-native";
import { useState } from "react";
import { themes, COURSE_COLORS } from "@/constants/colors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/spacing";

const C = themes.dark;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ScheduleSlot = { dayOfWeek: number; startTime: string; endTime: string; room?: string };

export default function OnboardingCourseSetup() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fieldOfStudy: string; interests: string }>();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState(COURSE_COLORS[0]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [skipCourse, setSkipCourse] = useState(false);

  const addSlot = () => {
    if (slots.some((s) => s.dayOfWeek === selectedDay)) return;
    setSlots([...slots, { dayOfWeek: selectedDay, startTime, endTime }]);
  };

  const removeSlot = (day: number) => setSlots(slots.filter((s) => s.dayOfWeek !== day));

  const handleNext = () => {
    router.push({
      pathname: "/onboarding/theme",
      params: {
        fieldOfStudy: params.fieldOfStudy,
        interests: params.interests,
        firstCourse: skipCourse
          ? ""
          : JSON.stringify({ code: code.trim(), name: name.trim(), color, schedule: slots }),
      },
    });
  };

  const canContinue = skipCourse || (code.trim().length > 0 && name.trim().length > 0);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.progress}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>

      <Text style={styles.title}>Add your first course</Text>
      <Text style={styles.subtitle}>You can add more from the Planner tab later.</Text>

      {!skipCourse && (
        <>
          <TextInput style={styles.input} placeholder="Course code  (e.g. CS302)" placeholderTextColor={C.textMuted} value={code} onChangeText={setCode} autoCapitalize="characters" />
          <TextInput style={styles.input} placeholder="Course name  (e.g. Operating Systems)" placeholderTextColor={C.textMuted} value={name} onChangeText={setName} />

          {/* Color picker */}
          <Text style={styles.label}>Colour tag</Text>
          <View style={styles.colorRow}>
            {COURSE_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>

          {/* Schedule builder */}
          <Text style={styles.label}>Weekly schedule (optional)</Text>
          <View style={styles.dayRow}>
            {DAYS.map((d, i) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayBtn, selectedDay === i && styles.dayBtnActive]}
                onPress={() => setSelectedDay(i)}
              >
                <Text style={[styles.dayText, selectedDay === i && styles.dayTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.timeRow}>
            <TextInput style={[styles.input, styles.timeInput]} placeholder="09:00" placeholderTextColor={C.textMuted} value={startTime} onChangeText={setStartTime} />
            <Text style={styles.timeSep}>to</Text>
            <TextInput style={[styles.input, styles.timeInput]} placeholder="10:30" placeholderTextColor={C.textMuted} value={endTime} onChangeText={setEndTime} />
            <TouchableOpacity style={styles.addSlotBtn} onPress={addSlot}>
              <Text style={styles.addSlotText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {slots.map((s) => (
            <View key={s.dayOfWeek} style={styles.slotRow}>
              <Text style={styles.slotText}>{DAYS[s.dayOfWeek]}  {s.startTime}–{s.endTime}</Text>
              <TouchableOpacity onPress={() => removeSlot(s.dayOfWeek)}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      <TouchableOpacity onPress={() => setSkipCourse(!skipCourse)}>
        <Text style={styles.skipText}>{skipCourse ? "← Add a course" : "Skip for now"}</Text>
      </TouchableOpacity>

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
  subtitle: { fontSize: fontSize.sm, color: C.textMuted },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  input: { backgroundColor: C.bgInput, borderRadius: radius.md, borderWidth: 1, borderColor: C.border, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: fontSize.base, color: C.textPrimary },
  colorRow: { flexDirection: "row", gap: spacing.sm },
  colorDot: { width: 28, height: 28, borderRadius: radius.full },
  colorDotActive: { borderWidth: 3, borderColor: C.textPrimary },
  dayRow: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  dayBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  dayBtnActive: { backgroundColor: C.accentMuted, borderColor: C.accent },
  dayText: { fontSize: fontSize.sm, color: C.textSecondary },
  dayTextActive: { color: C.accent, fontWeight: fontWeight.semibold },
  timeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  timeInput: { flex: 1 },
  timeSep: { color: C.textMuted, fontSize: fontSize.sm },
  addSlotBtn: { backgroundColor: C.accentMuted, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: radius.md },
  addSlotText: { color: C.accent, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  slotRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: C.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: C.border },
  slotText: { fontSize: fontSize.sm, color: C.textPrimary },
  removeText: { color: C.textMuted, fontSize: fontSize.sm },
  skipText: { fontSize: fontSize.sm, color: C.textMuted, textAlign: "center" },
  nextBtn: { backgroundColor: C.accent, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.md },
  btnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: C.accentText },
});
