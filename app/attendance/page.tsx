"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AppShell } from "@/components/app-shell";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HardwareCard } from "@/components/ui/hardware-card";
import { LedMeter } from "@/components/ui/led-meter";
import {
  playHardwareClick,
  playToggleSound,
  playTelemetryChirp,
  isAudioMuted,
  setAudioMuted,
} from "@/lib/audio-feedback";
import {
  UserCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Percent,
  Sliders,
  RotateCcw,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Edit3,
  Volume2,
  VolumeX,
  Compass,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface SubjectData {
  _id: Id<"attendanceSubjects">;
  _creationTime: number;
  userId: string;
  name: string;
  code?: string;
  attended: number;
  total: number;
  minTargetPercentage: number;
  percentage: number;
  safeBunks: number;
  requiredClasses: number;
  isSafe: boolean;
}

// Generate authentic IBM-style punch ribbon sequence
function generatePunchTape(attended: number, total: number, id: string): Array<"P" | "A"> {
  if (total <= 0) return ["P", "P", "P", "P", "P"];
  const count = Math.min(8, Math.max(5, total));
  const ratio = attended / total;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  const ribbon: Array<"P" | "A"> = [];
  for (let i = 0; i < count; i++) {
    const pseudoVal = ((Math.abs(hash + i * 23)) % 100) / 100;
    ribbon.push(pseudoVal < ratio ? "P" : "A");
  }
  return ribbon;
}

export default function AttendancePage() {
  const subjects = (useQuery(api.attendance.getSubjects) || []) as SubjectData[];
  const summary = useQuery(api.attendance.getSummary) || {
    totalAttended: 0,
    totalClasses: 0,
    overallPercentage: 0,
    subjectCount: 0,
  };

  const addSubjectMutation = useMutation(api.attendance.addSubject);
  const markAttendanceMutation = useMutation(api.attendance.markAttendance);
  const deleteSubjectMutation = useMutation(api.attendance.deleteSubject);
  const updateSubjectMutation = useMutation(api.attendance.updateSubject);

  // Modal states
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectData | null>(null);

  // Add course form
  const [subName, setSubName] = useState("");
  const [subCode, setSubCode] = useState("");
  const [subAttended, setSubAttended] = useState(15);
  const [subTotal, setSubTotal] = useState(20);
  const [subTarget, setSubTarget] = useState(75);

  // Edit course form
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editAttended, setEditAttended] = useState(0);
  const [editTotal, setEditTotal] = useState(0);
  const [editTarget, setEditTarget] = useState(75);

  // Interactive What-If Simulation Engine State
  const [isSimActive, setIsSimActive] = useState(false);
  const [globalSimOffset, setGlobalSimOffset] = useState(0); // extra bunks for all
  const [perCourseSimOffset, setPerCourseSimOffset] = useState<Record<string, number>>({});
  const [filterCategory, setFilterCategory] = useState<"ALL" | "SAFE" | "MARGINAL" | "DEFICIT">("ALL");
  const [soundEnabled, setSoundEnabled] = useState(!isAudioMuted());

  // Toggle master sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setAudioMuted(!next);
    if (next) playHardwareClick(1500);
  };

  // Add course handler
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;

    playHardwareClick(1400);
    await addSubjectMutation({
      name: subName.trim(),
      code: subCode.trim() || undefined,
      attended: Number(subAttended),
      total: Number(subTotal),
      minTargetPercentage: Number(subTarget),
    });

    setSubName("");
    setSubCode("");
    setSubAttended(15);
    setSubTotal(20);
    setSubTarget(75);
    setIsAddSubjectOpen(false);
  };

  // Open edit modal
  const handleOpenEdit = (sub: SubjectData) => {
    playToggleSound();
    setEditingSubject(sub);
    setEditName(sub.name);
    setEditCode(sub.code || "");
    setEditAttended(sub.attended);
    setEditTotal(sub.total);
    setEditTarget(sub.minTargetPercentage);
  };

  // Save edit handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editName.trim()) return;

    playHardwareClick(1300);
    await updateSubjectMutation({
      id: editingSubject._id,
      name: editName.trim(),
      code: editCode.trim() || undefined,
      attended: Number(editAttended),
      total: Math.max(Number(editAttended), Number(editTotal)),
      minTargetPercentage: Number(editTarget),
    });

    setEditingSubject(null);
  };

  // Simulation calculations
  const simulatedData = useMemo(() => {
    let aggAttended = 0;
    let aggTotal = 0;
    let deficitCount = 0;
    let safeCount = 0;
    let totalBufferPool = 0;

    const computedCourses = subjects.map((sub) => {
      const extraBunk = (perCourseSimOffset[sub._id] || 0) + (isSimActive ? globalSimOffset : 0);

      let effectiveAttended = sub.attended;
      let effectiveTotal = sub.total;

      if (extraBunk > 0) {
        // missed classes
        effectiveTotal = sub.total + extraBunk;
      } else if (extraBunk < 0) {
        // simulated attended classes
        const addedAttended = Math.abs(extraBunk);
        effectiveAttended = sub.attended + addedAttended;
        effectiveTotal = sub.total + addedAttended;
      }

      const effectivePercentage =
        effectiveTotal > 0
          ? Math.round(((effectiveAttended / effectiveTotal) * 100) * 10) / 10
          : 100;

      const target = sub.minTargetPercentage || 75;
      let effectiveSafeBunks = 0;
      let effectiveRequiredClasses = 0;

      if (effectivePercentage >= target) {
        effectiveSafeBunks = Math.max(0, Math.floor(effectiveAttended / (target / 100) - effectiveTotal));
        safeCount++;
        totalBufferPool += effectiveSafeBunks;
      } else {
        const num = (target / 100) * effectiveTotal - effectiveAttended;
        const den = 1 - target / 100;
        effectiveRequiredClasses = Math.max(0, Math.ceil(num / den));
        deficitCount++;
      }

      aggAttended += effectiveAttended;
      aggTotal += effectiveTotal;

      const isSafe = effectivePercentage >= target;
      const isWarning = !isSafe && effectivePercentage >= target - 5;

      return {
        ...sub,
        simOffset: extraBunk,
        effectiveAttended,
        effectiveTotal,
        effectivePercentage,
        effectiveSafeBunks,
        effectiveRequiredClasses,
        isSafe,
        isWarning,
      };
    });

    const aggPercentage = aggTotal > 0 ? Math.round(((aggAttended / aggTotal) * 100) * 10) / 10 : 100;
    const delta = Math.round((aggPercentage - summary.overallPercentage) * 10) / 10;

    return {
      courses: computedCourses,
      aggAttended,
      aggTotal,
      aggPercentage,
      delta,
      deficitCount,
      safeCount,
      totalBufferPool,
    };
  }, [subjects, summary.overallPercentage, isSimActive, globalSimOffset, perCourseSimOffset]);

  // Adjust per-course simulation offset
  const handleAdjustCourseSim = (courseId: string, delta: number) => {
    playTelemetryChirp();
    setPerCourseSimOffset((prev) => {
      const current = prev[courseId] || 0;
      const next = current + delta;
      if (next === 0) {
        const copy = { ...prev };
        delete copy[courseId];
        return copy;
      }
      return { ...prev, [courseId]: next };
    });
  };

  // Filtered course list
  const filteredCourses = useMemo(() => {
    return simulatedData.courses.filter((sub) => {
      if (filterCategory === "SAFE") return sub.isSafe;
      if (filterCategory === "MARGINAL") return sub.isWarning;
      if (filterCategory === "DEFICIT") return !sub.isSafe;
      return true;
    });
  }, [simulatedData.courses, filterCategory]);

  return (
    <AppShell
      pageTitle="Attendance Sentinel"
      pageDescription="Aerospace flight telemetry, real-time safe bunk trajectory calculator, and debarment prevention matrix."
      headerAction={
        <div className="flex items-center gap-2">
          {/* Sound Audio Bus Toggle */}
          <button
            onClick={handleToggleSound}
            className={`h-8 px-2.5 rounded-md border font-mono text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
              soundEnabled
                ? "bg-zinc-900 border-zinc-700 text-emerald-400 hover:border-emerald-500"
                : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
            title="Toggle synthesized tactile audio clicks"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">AUDIO ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">MUTED</span>
              </>
            )}
          </button>

          {/* Toggle Simulator Deck Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              playToggleSound();
              setIsSimActive(!isSimActive);
            }}
            className={`gap-1.5 font-mono text-xs border ${
              isSimActive
                ? "bg-amber-950/40 border-amber-600 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                : "border-zinc-800 text-zinc-300 hover:border-zinc-700"
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            <span>{isSimActive ? "SIMULATOR ACTIVE" : "WHAT-IF SIMULATOR"}</span>
          </Button>

          {/* Add Course Button */}
          <Button
            size="sm"
            variant="default"
            indicator="emerald"
            onClick={() => {
              playHardwareClick(1500);
              setIsAddSubjectOpen(true);
            }}
            className="gap-1.5 font-mono text-xs shadow-[0_2px_0_#064e3b]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ADD COURSE</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Avionics Telemetry Status Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-md bg-[#0a0c0e] border border-zinc-800/90 font-mono text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              FLIGHT AVIONICS // ATT-SENTINEL-MK4
            </span>
            <span className="text-zinc-700 hidden sm:inline">|</span>
            <span className="text-zinc-500 hidden sm:inline">
              MANDATE THRESHOLD: <strong className="text-zinc-300">75.0%</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-zinc-500">
              SAFETY CORRIDOR:{" "}
              <strong className={simulatedData.deficitCount === 0 ? "text-emerald-400" : "text-rose-400"}>
                {simulatedData.deficitCount === 0 ? "ALL CLEAR" : `${simulatedData.deficitCount} IN DEFICIT`}
              </strong>
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500">
              BUFFER POOL:{" "}
              <strong className="text-emerald-400">+{simulatedData.totalBufferPool} SESSIONS</strong>
            </span>
          </div>
        </div>

        {/* Top Summary Banner: 4 Avionics VFD Telemetry Racks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* RACK 01: Overall Ratio */}
          <HardwareCard refId="NX-ATT-01" label="AGGREGATE RATIO">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-3xl font-bold font-mono tracking-tight drop-shadow-[0_0_12px_rgba(52,211,153,0.4)] ${
                        simulatedData.aggPercentage >= 75 ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {simulatedData.aggPercentage}%
                    </span>
                    {isSimActive && simulatedData.delta !== 0 && (
                      <span
                        className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${
                          simulatedData.delta > 0
                            ? "bg-emerald-950/60 border-emerald-700 text-emerald-400"
                            : "bg-rose-950/60 border-rose-700 text-rose-400"
                        }`}
                      >
                        {simulatedData.delta > 0 ? `+${simulatedData.delta}%` : `${simulatedData.delta}%`}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 block mt-0.5">
                    {isSimActive ? "PROJECTED SCENARIO RATIO" : "OFFICIAL MANDATE: 75%"}
                  </span>
                </div>
                <div className="h-9 w-9 rounded-md bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <div className="pt-1">
                <LedMeter
                  value={simulatedData.aggPercentage}
                  mode="attendance"
                  segments={12}
                />
              </div>
            </div>
          </HardwareCard>

          {/* RACK 02: Verified Sessions */}
          <HardwareCard refId="NX-ATT-02" label="VERIFIED SESSIONS">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold font-mono tracking-tight text-zinc-100">
                    {simulatedData.aggAttended}{" "}
                    <span className="text-sm font-normal text-zinc-500">
                      / {simulatedData.aggTotal}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500 block mt-0.5">
                    {isSimActive ? "SIMULATED CLASS ATTENDANCE" : "VERIFIED LOGGED SESSIONS"}
                  </span>
                </div>
                <div className="h-9 w-9 rounded-md bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <UserCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="pt-1">
                <LedMeter
                  value={
                    simulatedData.aggTotal > 0
                      ? (simulatedData.aggAttended / simulatedData.aggTotal) * 100
                      : 0
                  }
                  mode="mono"
                  segments={12}
                />
              </div>
            </div>
          </HardwareCard>

          {/* RACK 03: Safe Buffer Leeway Pool */}
          <HardwareCard
            refId="NX-ATT-03"
            label="SAFE BUNKS POOL"
            badge={simulatedData.totalBufferPool > 0 ? "BUFFER ACTIVE" : "ZERO LEEWAY"}
            badgeVariant={simulatedData.totalBufferPool > 0 ? "emerald" : "amber"}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                    +{simulatedData.totalBufferPool}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500 block mt-0.5">
                    AGGREGATE SKIP ALLOWANCE
                  </span>
                </div>
                <div className="h-9 w-9 rounded-md bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <div className="pt-1">
                <LedMeter
                  value={Math.min(100, simulatedData.totalBufferPool * 12)}
                  mode="attendance"
                  segments={12}
                />
              </div>
            </div>
          </HardwareCard>

          {/* RACK 04: Flight Corridor Status */}
          <HardwareCard
            refId="NX-ATT-04"
            label="THREAT MATRIX"
            badge={simulatedData.deficitCount === 0 ? "CLEAR" : "DEFICIT"}
            badgeVariant={simulatedData.deficitCount === 0 ? "emerald" : "rose"}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={`font-mono text-xs font-bold uppercase tracking-wider block ${
                      simulatedData.deficitCount === 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {simulatedData.deficitCount === 0 ? "NOMINAL FLIGHT" : "LOCKOUT RISK"}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500 block mt-0.5">
                    {simulatedData.deficitCount === 0
                      ? "NO DEBARMENT THREAT"
                      : `${simulatedData.deficitCount} MODULE(S) REQUIRE SESSIONS`}
                  </span>
                </div>
                <div className="h-9 w-9 rounded-md bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  {simulatedData.deficitCount === 0 ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                  )}
                </div>
              </div>
              <div className="pt-1">
                <LedMeter
                  value={
                    simulatedData.courses.length > 0
                      ? ((simulatedData.courses.length - simulatedData.deficitCount) /
                          simulatedData.courses.length) *
                        100
                      : 100
                  }
                  mode="attendance"
                  segments={12}
                />
              </div>
            </div>
          </HardwareCard>
        </div>

        {/* BUNK TRAJECTORY FLIGHT SIMULATOR (Scenario Analysis Deck) */}
        {isSimActive && (
          <div className="p-4 rounded-lg border border-amber-800/60 bg-[#0d0f12] shadow-[0_8px_32px_rgba(0,0,0,0.8)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-amber-400" />
                  // BUNK TRAJECTORY FLIGHT SIMULATOR (WHAT-IF ENGINE)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-zinc-500">
                  GLOBAL OFFSET: <strong className="text-amber-400">{globalSimOffset > 0 ? `+${globalSimOffset}` : globalSimOffset}</strong>
                </span>
                <button
                  onClick={() => {
                    playHardwareClick(1000);
                    setGlobalSimOffset(0);
                    setPerCourseSimOffset({});
                  }}
                  className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>RESET SCENARIO</span>
                </button>
              </div>
            </div>

            {/* Quick Scenario Preset Pushbuttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => {
                  playTelemetryChirp();
                  setGlobalSimOffset((prev) => prev + 1);
                }}
                className="p-2.5 rounded-md border border-zinc-800 bg-[#121418] hover:border-amber-600/70 hover:bg-amber-950/20 text-left transition-all active:translate-y-[1px] cursor-pointer group"
              >
                <div className="font-mono text-[11px] font-bold text-zinc-200 group-hover:text-amber-300">
                  +1 SICK DAY (ALL)
                </div>
                <div className="font-mono text-[9px] text-zinc-500 mt-0.5">
                  Simulate skipping 1 session across every module
                </div>
              </button>

              <button
                onClick={() => {
                  playTelemetryChirp();
                  setGlobalSimOffset((prev) => prev + 2);
                }}
                className="p-2.5 rounded-md border border-zinc-800 bg-[#121418] hover:border-amber-600/70 hover:bg-amber-950/20 text-left transition-all active:translate-y-[1px] cursor-pointer group"
              >
                <div className="font-mono text-[11px] font-bold text-zinc-200 group-hover:text-amber-300">
                  +2 COLLEGE FEST / HACKATHON
                </div>
                <div className="font-mono text-[9px] text-zinc-500 mt-0.5">
                  Simulate 2-day event absence
                </div>
              </button>

              <button
                onClick={() => {
                  playTelemetryChirp();
                  setGlobalSimOffset((prev) => prev + 5);
                }}
                className="p-2.5 rounded-md border border-zinc-800 bg-[#121418] hover:border-amber-600/70 hover:bg-amber-950/20 text-left transition-all active:translate-y-[1px] cursor-pointer group"
              >
                <div className="font-mono text-[11px] font-bold text-zinc-200 group-hover:text-amber-300">
                  +5 WEEK OUT (LEAVE)
                </div>
                <div className="font-mono text-[9px] text-zinc-500 mt-0.5">
                  Full 1-week emergency absence test
                </div>
              </button>

              <button
                onClick={() => {
                  playTelemetryChirp();
                  setGlobalSimOffset((prev) => prev - 3);
                }}
                className="p-2.5 rounded-md border border-zinc-800 bg-[#121418] hover:border-emerald-600/70 hover:bg-emerald-950/20 text-left transition-all active:translate-y-[1px] cursor-pointer group"
              >
                <div className="font-mono text-[11px] font-bold text-zinc-200 group-hover:text-emerald-300">
                  +3 RECOVERY MARATHON
                </div>
                <div className="font-mono text-[9px] text-zinc-500 mt-0.5">
                  Simulate attending next 3 classes in all courses
                </div>
              </button>
            </div>

            {/* Live Scenario Impact Alert Banner */}
            <div className="p-3 rounded-md bg-zinc-950/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 text-[11px] uppercase">TRAJECTORY IMPACT:</span>
                <span className="text-zinc-300">
                  CURRENT: <strong className="text-zinc-100">{summary.overallPercentage}%</strong>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
                <span className="text-zinc-300">
                  PROJECTED:{" "}
                  <strong
                    className={
                      simulatedData.aggPercentage >= 75 ? "text-emerald-400" : "text-amber-400"
                    }
                  >
                    {simulatedData.aggPercentage}%
                  </strong>
                </span>
              </div>
              <div className="text-[11px]">
                {simulatedData.deficitCount === 0 ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    ALL MODULES REMAIN WITHIN SAFE CORRIDOR
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1.5 font-bold animate-pulse">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    CRITICAL: {simulatedData.deficitCount} MODULE(S) BREACH MINIMUM 75% CRITERIA!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-zinc-800/80">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono mr-2">
              // Course Telemetry Racks
            </h2>
            <div className="flex items-center gap-1">
              {(["ALL", "SAFE", "MARGINAL", "DEFICIT"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    playHardwareClick(1600);
                    setFilterCategory(cat);
                  }}
                  className={`px-2 py-1 rounded font-mono text-[10px] tracking-wider transition-colors cursor-pointer ${
                    filterCategory === cat
                      ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-bold"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  {cat} (
                  {cat === "ALL"
                    ? simulatedData.courses.length
                    : cat === "SAFE"
                    ? simulatedData.courses.filter((c) => c.isSafe).length
                    : cat === "MARGINAL"
                    ? simulatedData.courses.filter((c) => c.isWarning).length
                    : simulatedData.courses.filter((c) => !c.isSafe).length}
                  )
                </button>
              ))}
            </div>
          </div>
          <span className="font-mono text-[10px] text-zinc-500">
            SHOWING {filteredCourses.length} OF {simulatedData.courses.length} MODULES
          </span>
        </div>

        {/* Subjects List Racks */}
        {simulatedData.courses.length === 0 ? (
          <div className="p-12 rounded-xl border border-zinc-800 bg-[#0c0c0e] text-center space-y-3">
            <Compass className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-wider">
              No Course Modules Tracked Yet
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto font-mono">
              Initialize semester courses with current attended counts to activate real-time trajectory calculation and safe bunk margins.
            </p>
            <Button
              size="sm"
              variant="default"
              indicator="emerald"
              onClick={() => {
                playHardwareClick(1400);
                setIsAddSubjectOpen(true);
              }}
              className="gap-1.5 font-mono text-xs shadow-[0_2px_0_#064e3b]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>INITIALIZE COURSE MODULE</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((sub, index) => {
              const punchHistory = generatePunchTape(sub.attended, sub.total, sub._id);
              const courseSpecificSim = perCourseSimOffset[sub._id] || 0;

              return (
                <HardwareCard
                  key={sub._id}
                  refId={`CRS-${(index + 1).toString().padStart(2, "0")}`}
                  title={sub.name}
                  badge={sub.isSafe ? "SAFE MARGIN" : sub.isWarning ? "MARGINAL" : "DEFICIT"}
                  badgeVariant={sub.isSafe ? "emerald" : sub.isWarning ? "amber" : "rose"}
                  action={
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                        title="Recalibrate Course Attendance"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          playHardwareClick(700);
                          deleteSubjectMutation({ id: sub._id });
                        }}
                        className="p-1 text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Course Rack"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  }
                  className="flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Course Code & Subhead */}
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        {sub.code && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 font-semibold border border-zinc-800">
                            {sub.code}
                          </span>
                        )}
                        <span className="text-zinc-500 text-[10px] uppercase">
                          LOGGED: <strong className="text-zinc-200">{sub.attended}</strong> / {sub.total}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        MIN REQ: <strong className="text-zinc-300">{sub.minTargetPercentage}%</strong>
                      </span>
                    </div>

                    {/* VFD Recessed Digital Phosphor Telemetry Chamber */}
                    <div className="p-3 rounded-md bg-[#050608] border border-zinc-800/90 shadow-[inset_0_2px_10px_rgba(0,0,0,0.9)] relative overflow-hidden">
                      {/* Subtle scanline overlay effect */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                          backgroundImage:
                            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)",
                          backgroundSize: "100% 4px",
                        }}
                      />
                      <div className="flex items-baseline justify-between font-mono relative z-10">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">
                            TELEMETRY STANDING
                          </span>
                          <span
                            className={`text-2xl font-bold tracking-tight ${
                              sub.isSafe
                                ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                                : sub.isWarning
                                ? "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                                : "text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                            }`}
                          >
                            {sub.effectivePercentage}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">
                            EFFECTIVE SESSIONS
                          </span>
                          <span className="text-sm font-bold text-zinc-200">
                            {sub.effectiveAttended} / {sub.effectiveTotal}
                          </span>
                        </div>
                      </div>

                      {/* Laser-Etched 12-Segment LED Meter */}
                      <div className="mt-2 relative z-10">
                        <LedMeter
                          value={sub.effectivePercentage}
                          mode="attendance"
                          segments={12}
                        />
                        {/* Physical Calibration Scale */}
                        <div className="flex justify-between font-mono text-[8px] text-zinc-600 mt-1 select-none">
                          <span>0%</span>
                          <span className="text-zinc-400 font-semibold">
                            [ ▲ {sub.minTargetPercentage}% REQ ]
                          </span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>

                    {/* IBM-Style Perforated Punch-Tape Ribbon */}
                    <div className="px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800/80 font-mono text-[9px] flex items-center justify-between select-none">
                      <span className="text-zinc-500 text-[8px] uppercase tracking-wider">
                        PUNCH TAPE //
                      </span>
                      <div className="flex items-center gap-1">
                        {punchHistory.map((type, pIdx) => (
                          <span
                            key={pIdx}
                            className={`px-1 py-0.2 rounded-[2px] font-bold ${
                              type === "P"
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                                : "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                            }`}
                            title={`Session #${pIdx + 1}: ${type === "P" ? "Attended" : "Absent"}`}
                          >
                            {type === "P" ? "● P" : "○ A"}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Per-Course What-If Bunk Stepper Dial */}
                    <div className="p-2 rounded bg-[#0e1014] border border-zinc-800/90 flex items-center justify-between font-mono text-xs">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                        SIMULATE BUNK:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAdjustCourseSim(sub._id, -1)}
                          className="h-6 w-6 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold flex items-center justify-center cursor-pointer transition-colors active:translate-y-[1px]"
                          title="Simulate +1 Class Attended"
                        >
                          -
                        </button>
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded border ${
                            courseSpecificSim !== 0
                              ? "bg-amber-950/60 border-amber-700 text-amber-300 font-bold"
                              : "bg-zinc-900 border-zinc-800 text-zinc-300"
                          }`}
                        >
                          {courseSpecificSim > 0
                            ? `+${courseSpecificSim} BUNK`
                            : courseSpecificSim < 0
                            ? `${courseSpecificSim} ATTEND`
                            : "0 BUNK"}
                        </span>
                        <button
                          onClick={() => handleAdjustCourseSim(sub._id, 1)}
                          className="h-6 w-6 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold flex items-center justify-center cursor-pointer transition-colors active:translate-y-[1px]"
                          title="Simulate +1 Class Skipped"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Flight Corridor Tactical Advisory Readout */}
                    <div
                      className={`p-3 rounded-md border font-mono text-[11px] leading-relaxed transition-colors ${
                        sub.isSafe
                          ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-300"
                          : "bg-rose-950/20 border-rose-900/50 text-rose-300"
                      }`}
                    >
                      {sub.isSafe ? (
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                          <div>
                            <span className="font-semibold">SAFE FLIGHT BUFFER: </span>
                            <span className="font-bold underline text-white">
                              {sub.effectiveSafeBunks}{" "}
                              {sub.effectiveSafeBunks === 1 ? "CLASS" : "CLASSES"}
                            </span>
                            <span> CAN BE SKIPPED TO REMAIN ≥ {sub.minTargetPercentage}%.</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                          <div>
                            <span className="font-semibold">CORRIDOR DEFICIT: </span>
                            <span>ATTEND NEXT </span>
                            <span className="font-bold underline text-white">
                              {sub.effectiveRequiredClasses}{" "}
                              {sub.effectiveRequiredClasses === 1 ? "CLASS" : "CLASSES"}
                            </span>
                            <span> CONSECUTIVELY TO RESTORE {sub.minTargetPercentage}%.</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3D Springy Cockpit Pushbuttons with Physical Travel */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-800/80">
                      <button
                        onClick={() => {
                          playHardwareClick(1400);
                          markAttendanceMutation({ id: sub._id, present: true });
                        }}
                        className="py-2 px-3 rounded-md border border-emerald-700/80 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 font-mono text-xs font-bold tracking-wider shadow-[0_3px_0_#064e3b] active:shadow-none active:translate-y-[2px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        <span>+1 PRESENT</span>
                      </button>

                      <button
                        onClick={() => {
                          playHardwareClick(600);
                          markAttendanceMutation({ id: sub._id, present: false });
                        }}
                        className="py-2 px-3 rounded-md border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-mono text-xs font-bold tracking-wider shadow-[0_3px_0_#4c0519] active:shadow-none active:translate-y-[2px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                        <span>+1 ABSENT</span>
                      </button>
                    </div>
                  </div>
                </HardwareCard>
              );
            })}
          </div>
        )}

        {/* Global Attendance Flight Corridor Audit Matrix (High-Density Avionics Table) */}
        {simulatedData.courses.length > 0 && (
          <div className="p-4 rounded-lg border border-zinc-800 bg-[#0c0c0e] shadow-[0_8px_32px_rgba(0,0,0,0.8)] space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                // ATTENDANCE FLIGHT CORRIDOR AUDIT MATRIX
              </h3>
              <span className="font-mono text-[10px] text-zinc-500">
                TOTAL MODULES: {simulatedData.courses.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-500 tracking-wider">
                    <th className="py-2 px-2.5">REF</th>
                    <th className="py-2 px-2.5">MODULE NAME</th>
                    <th className="py-2 px-2.5">CODE</th>
                    <th className="py-2 px-2.5">ATTENDED / TOTAL</th>
                    <th className="py-2 px-2.5">RATIO</th>
                    <th className="py-2 px-2.5">TARGET</th>
                    <th className="py-2 px-2.5">BUFFER STATUS</th>
                    <th className="py-2 px-2.5 text-right">QUICK LOG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {simulatedData.courses.map((c, i) => (
                    <tr key={c._id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 px-2.5 text-zinc-500 text-[11px]">
                        CRS-{(i + 1).toString().padStart(2, "0")}
                      </td>
                      <td className="py-2.5 px-2.5 text-zinc-200 font-semibold">
                        {c.name}
                      </td>
                      <td className="py-2.5 px-2.5 text-zinc-400">
                        {c.code || "—"}
                      </td>
                      <td className="py-2.5 px-2.5 text-zinc-300">
                        {c.effectiveAttended} / {c.effectiveTotal}
                      </td>
                      <td className="py-2.5 px-2.5">
                        <span
                          className={`font-bold ${
                            c.isSafe ? "text-emerald-400" : c.isWarning ? "text-amber-400" : "text-rose-400"
                          }`}
                        >
                          {c.effectivePercentage}%
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-zinc-400">
                        {c.minTargetPercentage}%
                      </td>
                      <td className="py-2.5 px-2.5">
                        {c.isSafe ? (
                          <span className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                            +{c.effectiveSafeBunks} SAFE BUNKS
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded">
                            NEED {c.effectiveRequiredClasses} SESSIONS
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              playHardwareClick(1400);
                              markAttendanceMutation({ id: c._id, present: true });
                            }}
                            className="px-2 py-1 rounded bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 font-bold text-[10px] cursor-pointer transition-colors active:translate-y-[1px]"
                          >
                            +1 P
                          </button>
                          <button
                            onClick={() => {
                              playHardwareClick(600);
                              markAttendanceMutation({ id: c._id, present: false });
                            }}
                            className="px-2 py-1 rounded bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800 text-rose-300 font-bold text-[10px] cursor-pointer transition-colors active:translate-y-[1px]"
                          >
                            +1 A
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add Course */}
      <Modal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        title="Initialize Course Module"
        description="Configure a semester module and class telemetry to monitor attendance compliance."
      >
        <form onSubmit={handleAddSubject} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subName" className="text-xs text-zinc-300 font-mono">
              Course / Subject Title *
            </Label>
            <Input
              id="subName"
              placeholder="e.g. Distributed Systems"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              required
              className="border-zinc-800 bg-[#0c0c0e] text-zinc-100 font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subCode" className="text-xs text-zinc-300 font-mono">
              Course Code (Optional)
            </Label>
            <Input
              id="subCode"
              placeholder="CS-401"
              value={subCode}
              onChange={(e) => setSubCode(e.target.value)}
              className="border-zinc-800 bg-[#0c0c0e] text-zinc-100 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="subAttended" className="text-xs text-zinc-300 font-mono">
                Classes Attended
              </Label>
              <Input
                id="subAttended"
                type="number"
                min="0"
                value={subAttended}
                onChange={(e) => setSubAttended(parseInt(e.target.value) || 0)}
                className="border-zinc-800 bg-[#0c0c0e] text-zinc-100 font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subTotal" className="text-xs text-zinc-300 font-mono">
                Total Conducted
              </Label>
              <Input
                id="subTotal"
                type="number"
                min="0"
                value={subTotal}
                onChange={(e) => setSubTotal(parseInt(e.target.value) || 0)}
                className="border-zinc-800 bg-[#0c0c0e] text-zinc-100 font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subTarget" className="text-xs text-zinc-300 font-mono">
              Target Percentage Mandate (%)
            </Label>
            <Input
              id="subTarget"
              type="number"
              min="1"
              max="100"
              value={subTarget}
              onChange={(e) => setSubTarget(parseInt(e.target.value) || 75)}
              className="border-zinc-800 bg-[#0c0c0e] text-zinc-100 font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddSubjectOpen(false)}
              className="border-zinc-800 font-mono text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              indicator="emerald"
              className="font-mono text-xs shadow-[0_2px_0_#064e3b] cursor-pointer"
            >
              Save Module
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Recalibrate / Edit Course */}
      <Modal
        isOpen={!!editingSubject}
        onClose={() => setEditingSubject(null)}
        title="Recalibrate Course Telemetry"
        description="Update class counts or threshold mandates for this semester module."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="editName" className="text-xs text-zinc-300 font-mono">
              Course / Subject Title *
            </Label>
            <Input
              id="editName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="border-zinc-800 bg-[#0c0c0e] text-zinc-100 font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editCode" className="text-xs text-zinc-300 font-mono">
              Course Code (Optional)
            </Label>
            <Input
              id="editCode"
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              className="border-zinc-800 bg-[#0c0c0e] text-zinc-100 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="editAttended" className="text-xs text-zinc-300 font-mono">
                Attended Classes
              </Label>
              <Input
                id="editAttended"
                type="number"
                min="0"
                value={editAttended}
                onChange={(e) => setEditAttended(parseInt(e.target.value) || 0)}
                className="border-zinc-800 bg-[#0c0c0e] text-zinc-100 font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editTotal" className="text-xs text-zinc-300 font-mono">
                Total Conducted
              </Label>
              <Input
                id="editTotal"
                type="number"
                min="0"
                value={editTotal}
                onChange={(e) => setEditTotal(parseInt(e.target.value) || 0)}
                className="border-zinc-800 bg-[#0c0c0e] text-zinc-100 font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editTarget" className="text-xs text-zinc-300 font-mono">
              Minimum Target Percentage (%)
            </Label>
            <Input
              id="editTarget"
              type="number"
              min="1"
              max="100"
              value={editTarget}
              onChange={(e) => setEditTarget(parseInt(e.target.value) || 75)}
              className="border-zinc-800 bg-[#0c0c0e] text-zinc-100 font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingSubject(null)}
              className="border-zinc-800 font-mono text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              indicator="emerald"
              className="font-mono text-xs shadow-[0_2px_0_#064e3b] cursor-pointer"
            >
              Update Calibration
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
