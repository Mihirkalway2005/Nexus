"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { HardwareCard } from "@/components/ui/hardware-card";
import { LedMeter } from "@/components/ui/led-meter";
import { playHardwareClick } from "@/lib/audio-feedback";
import { AiTimetableModal } from "@/components/calendar/ai-timetable-modal";
import {
  Calendar,
  Clock,
  MapPin,
  Flame,
  Wallet,
  ArrowRight,
  GraduationCap,
  Sparkles,
  UserCheck,
  DollarSign,
  AlertTriangle,
  Terminal,
} from "lucide-react";

export default function DashboardPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const currency = currentUser?.currency || "$";
  const [isAiScanOpen, setIsAiScanOpen] = useState(false);

  // Today day index (1 = Mon ... 7 = Sun)
  const todayIndex = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const todayClasses = useQuery(api.timetable.getDayClasses, { dayOfWeek: todayIndex }) || [];
  const upcomingEvents = useQuery(api.events.getUpcomingDeadlines, { limit: 4 }) || [];
  const attendanceSummary = useQuery(api.attendance.getSummary) || {
    totalAttended: 0,
    totalClasses: 0,
    overallPercentage: 0,
    subjectCount: 0,
  };
  const studyStats = useQuery(api.study.getStudyStats) || {
    todayMinutes: 0,
    weekMinutes: 0,
    totalSessions: 0,
    recentSessions: [],
  };
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const budget = useQuery(api.budget.getBudgetOverview, { month: currentMonthStr }) || {
    month: currentMonthStr,
    monthlyLimit: 500,
    totalSpent: 0,
    remaining: 500,
    percentageUsed: 0,
    categoryBreakdown: {},
    expenses: [],
  };

  // Live Class T-Minus Countdown Telemetry
  const [activeClassInfo, setActiveClassInfo] = useState<{
    subject: string;
    status: "UPCOMING" | "IN_PROGRESS";
    timeStr: string;
  } | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      if (!todayClasses || todayClasses.length === 0) {
        setActiveClassInfo(null);
        return;
      }

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const currentSeconds = now.getSeconds();

      const parsed = todayClasses
        .map((c) => {
          const [sh, sm] = (c.startTime || "00:00").split(":").map(Number);
          const [eh, em] = (c.endTime || "00:00").split(":").map(Number);
          return {
            ...c,
            startMin: (sh || 0) * 60 + (sm || 0),
            endMin: (eh || 0) * 60 + (em || 0),
          };
        })
        .sort((a, b) => a.startMin - b.startMin);

      const inProgress = parsed.find(
        (c) => currentMinutes >= c.startMin && currentMinutes < c.endMin
      );
      if (inProgress) {
        const remainingMin = inProgress.endMin - currentMinutes;
        setActiveClassInfo({
          subject: inProgress.subject,
          status: "IN_PROGRESS",
          timeStr: `${remainingMin}m REMAINING`,
        });
        return;
      }

      const upcoming = parsed.find((c) => c.startMin > currentMinutes);
      if (upcoming) {
        const totalSecLeft = (upcoming.startMin - currentMinutes) * 60 - currentSeconds;
        const h = Math.floor(totalSecLeft / 3600);
        const m = Math.floor((totalSecLeft % 3600) / 60);
        const s = totalSecLeft % 60;
        const pad = (n: number) => n.toString().padStart(2, "0");
        setActiveClassInfo({
          subject: upcoming.subject,
          status: "UPCOMING",
          timeStr: `T-${pad(h)}:${pad(m)}:${pad(s)}`,
        });
        return;
      }

      setActiveClassInfo({
        subject: "ALL SESSIONS CONCLUDED",
        status: "UPCOMING",
        timeStr: "STANDBY",
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [todayClasses]);

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <AppShell
      pageTitle="Command Center"
      pageDescription="Academic telemetry, attendance metrics, study log, and semester finances."
      headerAction={
        <div className="flex items-center gap-2">
          <Link href="/study">
            <Button
              variant="default"
              size="sm"
              indicator="amber"
              className="gap-1.5"
            >
              <Flame className="h-3.5 w-3.5 fill-current" />
              <span>FOCUS TIMER</span>
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Aerospace Mission Header */}
        <HardwareCard refId="NX-SYS" label="STATION STATUS // TELEMETRY LINKED">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 uppercase">
                  SYS // {todayFormatted}
                </span>

                {currentUser?.semester && (
                  <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/60 text-zinc-400 uppercase">
                    {currentUser.semester}
                  </span>
                )}
                {currentUser?.college && (
                  <span className="text-zinc-500 hidden md:inline">
                    // {currentUser.college}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  CORE SYNCHRONIZED
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
                {greeting}, {currentUser?.name || "Commander"}
              </h1>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                {currentUser?.major
                  ? `${currentUser.major} cyberdeck telemetry active. Real-time sensory bus linked across timetable, attendance, and finances.`
                  : "Nexus student workstation operational. Discrete physical telemetry active across all modules."}
              </p>
            </div>

            {/* Quick Cockpit Actions */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <Link href="/calendar">
                <Button
                  variant="outline"
                  size="sm"
                  indicator="zinc"
                  className="gap-2"
                >
                  <Calendar className="h-3.5 w-3.5 text-zinc-300" />
                  <span>TIMETABLE</span>
                </Button>
              </Link>
              <Link href="/attendance">
                <Button
                  variant="outline"
                  size="sm"
                  indicator="emerald"
                  className="gap-2"
                >
                  <UserCheck className="h-3.5 w-3.5 text-zinc-300" />
                  <span>ATTENDANCE</span>
                </Button>
              </Link>
            </div>
          </div>
        </HardwareCard>

        {/* 4 Discrete Engineered Telemetry Modules with Hardware Bevels & LED Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Module 1: Attendance Sentinel */}
          <Link
            href="/attendance"
            onClick={() => playHardwareClick(800)}
            className="block group"
          >
            <HardwareCard
              refId="MOD-01"
              label="ATTENDANCE SENTINEL"
              statusText={attendanceSummary.overallPercentage >= 75 ? "TARGET MET" : "CRITICAL DEFICIT"}
              className="h-full group-hover:border-zinc-600 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-mono tracking-tight text-zinc-100">
                    {attendanceSummary.overallPercentage}%
                  </span>
                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
                      attendanceSummary.overallPercentage >= 75
                        ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-400"
                        : "border-rose-900/60 bg-rose-950/40 text-rose-400"
                    }`}
                  >
                    {attendanceSummary.overallPercentage >= 75 ? "HEALTH: NOMINAL" : "ALERT: LOW"}
                  </span>
                </div>

                {/* 12-Segment Discrete Phosphor VU Meter */}
                <LedMeter
                  value={attendanceSummary.overallPercentage}
                  mode="attendance"
                  segments={12}
                  showValue={false}
                  label="12-SEG HEALTH LADDER"
                />

                <div className="font-mono text-[10px] text-zinc-500 pt-2 flex items-center justify-between border-t border-zinc-800/80">
                  <span>{attendanceSummary.totalAttended} / {attendanceSummary.totalClasses} CLASSES</span>
                  <span className="text-zinc-300 group-hover:translate-x-0.5 transition-transform">
                    MANAGE →
                  </span>
                </div>
              </div>
            </HardwareCard>
          </Link>

          {/* Module 2: Propulsion Timetable */}
          <Link
            href="/calendar"
            onClick={() => playHardwareClick(850)}
            className="block group"
          >
            <HardwareCard
              refId="MOD-02"
              label="PROPULSION // TIMETABLE"
              statusText={activeClassInfo?.status === "IN_PROGRESS" ? "SESSION ACTIVE" : "RADAR ON"}
              className="h-full group-hover:border-zinc-600 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono tracking-tight text-zinc-100">
                      {todayClasses.length}
                    </span>
                    <span className="font-mono text-xs text-zinc-500">
                      {todayClasses.length === 1 ? "SESSION" : "SESSIONS"}
                    </span>
                  </div>

                  {activeClassInfo?.timeStr && (
                    <span className="font-mono text-[10px] font-bold text-amber-400 tracking-wider bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-900/40">
                      {activeClassInfo.timeStr}
                    </span>
                  )}
                </div>

                {/* 12-Segment Discrete VU Meter for Daily Class Load */}
                <LedMeter
                  value={todayClasses.length > 0 ? 100 : 0}
                  mode="mono"
                  segments={12}
                  showValue={false}
                  label="TIMETABLE ENGAGEMENT"
                />

                <div className="font-mono text-[10px] text-zinc-500 pt-2 flex items-center justify-between border-t border-zinc-800/80">
                  <span className="truncate max-w-[140px]">
                    {activeClassInfo ? activeClassInfo.subject : "NO CLASSES TODAY"}
                  </span>
                  <span className="text-zinc-300 group-hover:translate-x-0.5 transition-transform">
                    RADAR →
                  </span>
                </div>
              </div>
            </HardwareCard>
          </Link>

          {/* Module 3: Chrono Deep Focus */}
          <Link
            href="/study"
            onClick={() => playHardwareClick(900)}
            className="block group"
          >
            <HardwareCard
              refId="MOD-03"
              label="CHRONO // DEEP FOCUS"
              statusText="DAILY BUS"
              className="h-full group-hover:border-zinc-600 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono tracking-tight text-zinc-100">
                      {studyStats.todayMinutes}
                    </span>
                    <span className="font-mono text-xs text-zinc-500">MINS</span>
                  </div>

                  <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                    TARGET: 120M
                  </span>
                </div>

                {/* 12-Segment Discrete VU Meter for Focus Goal */}
                <LedMeter
                  value={Math.min(100, (studyStats.todayMinutes / 120) * 100)}
                  mode="standard"
                  segments={12}
                  showValue={false}
                  label="GOAL SATURATION"
                />

                <div className="font-mono text-[10px] text-zinc-500 pt-2 flex items-center justify-between border-t border-zinc-800/80">
                  <span>{studyStats.weekMinutes}m THIS WEEK</span>
                  <span className="text-zinc-300 group-hover:translate-x-0.5 transition-transform">
                    ENGAGE →
                  </span>
                </div>
              </div>
            </HardwareCard>
          </Link>

          {/* Module 4: Fiscal Reserves */}
          <Link
            href="/budget"
            onClick={() => playHardwareClick(950)}
            className="block group"
          >
            <HardwareCard
              refId="MOD-04"
              label="FISCAL // RESERVES"
              statusText={`CAP ${currency}${budget.monthlyLimit}`}
              className="h-full group-hover:border-zinc-600 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-mono tracking-tight text-zinc-100">
                    {currency}{budget.remaining}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                    REMAINING
                  </span>
                </div>

                {/* 12-Segment LED Meter for Budget Burn Rate */}
                <LedMeter
                  value={budget.percentageUsed}
                  mode="budget"
                  segments={12}
                  showValue={false}
                  label="BURN RATE"
                />

                <div className="font-mono text-[10px] text-zinc-500 pt-2 flex items-center justify-between border-t border-zinc-800/80">
                  <span>{currency}{budget.totalSpent} BURNED</span>
                  <span className="text-zinc-300 group-hover:translate-x-0.5 transition-transform">
                    LEDGER →
                  </span>
                </div>
              </div>
            </HardwareCard>
          </Link>
        </div>

        {/* 2-Column Schedule & Deadlines Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Lecture Timeline */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                    // Today&apos;s Lecture Schedule
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setIsAiScanOpen(true)}
                  className="gap-1 font-mono"
                >
                  <Sparkles className="h-3 w-3 text-zinc-300" />
                  <span>AI SCAN</span>
                </Button>
                <Link
                  href="/calendar"
                  className="font-mono text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
                >
                  <span>FULL WEEK</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {todayClasses.length === 0 ? (
              <div className="p-8 rounded-xl border border-zinc-800/80 bg-[#0c0c0e] text-center space-y-3">
                <div className="h-9 w-9 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                  <Calendar className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase">
                  No Classes Scheduled Today
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Free schedule detected. Utilize session blocks for deep focus or project review.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setIsAiScanOpen(true)}
                    className="gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI SCAN TIMETABLE</span>
                  </Button>
                  <Link href="/calendar">
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      OPEN TIMETABLE
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayClasses.map((item) => (
                  <div
                    key={item._id}
                    className="p-4 rounded-lg border border-zinc-800/80 bg-[#0c0c0e] hover:border-zinc-700 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-1 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: item.color || "#71717a" }}
                      />

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-zinc-100 text-sm truncate">
                            {item.subject}
                          </span>
                          {item.code && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-zinc-800 bg-zinc-900 text-zinc-300">
                              {item.code}
                            </span>
                          )}
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border border-zinc-800 text-zinc-500">
                            {item.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500 flex-wrap">
                          <span className="flex items-center gap-1 text-zinc-300">
                            <Clock className="h-3 w-3" />
                            {item.startTime} - {item.endTime}
                          </span>
                          {item.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.room}
                            </span>
                          )}
                          {item.instructor && (
                            <span>PROF. {item.instructor.toUpperCase()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link href="/attendance">
                      <Button
                        size="xs"
                        variant="outline"
                        className="shrink-0 font-mono"
                      >
                        LOG
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Col: Priorities & Deadlines */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                  <GraduationCap className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                  // Priorities & Deadlines
                </h2>
              </div>

              <Link
                href="/calendar"
                className="font-mono text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                VIEW ALL
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="p-6 rounded-lg border border-zinc-800/80 bg-[#0c0c0e] text-center">
                <p className="font-mono text-xs text-zinc-500">All milestones clear. No pending items.</p>
                <Link href="/calendar">
                  <Button
                    size="xs"
                    variant="outline"
                    className="mt-3 font-mono"
                  >
                    ADD DEADLINE
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((evt) => (
                  <div
                    key={evt._id}
                    className="p-3 rounded-lg border border-zinc-800/80 bg-[#0c0c0e] hover:border-zinc-700 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-200 truncate">
                        {evt.title}
                      </span>
                      <span
                        className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.2 rounded border ${
                          evt.priority === "high"
                            ? "bg-rose-950/40 text-rose-300 border-rose-900/60"
                            : evt.priority === "medium"
                            ? "bg-amber-950/40 text-amber-300 border-amber-900/60"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800"
                        }`}
                      >
                        {evt.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
                      <span className="uppercase">{evt.type}</span>
                      <span>{evt.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Attendance Deficit Alert (Subtle, High-contrast warning) */}
            {attendanceSummary.overallPercentage < 75 && attendanceSummary.totalClasses > 0 && (
              <div className="p-3.5 rounded-lg border border-rose-900/50 bg-rose-950/20 text-rose-300 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-mono font-bold text-rose-200">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                  <span>CRITICAL ATTENDANCE DEFICIT</span>
                </div>
                <p className="text-[11px] text-rose-300/80 leading-relaxed font-mono">
                  {attendanceSummary.overallPercentage}% is below the 75% university requirement.
                </p>
                <Link
                  href="/attendance"
                  className="inline-block font-mono text-[10px] font-bold text-rose-200 hover:underline"
                >
                  CALCULATE REQUIRED SESSIONS →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tactile Hardware Launchpad (Keypad) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              // PHYSICAL LAUNCHPAD DECK
            </span>
            <span className="font-mono text-[9px] text-zinc-600">
              AUDIO HAPTICS // 12-BIT SYNTH
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/calendar"
              onClick={() => playHardwareClick(800)}
              className="relative p-4 rounded-xl border border-zinc-800 bg-[#0e0e12] hover:border-zinc-600 hover:bg-[#121217] active:translate-y-[2px] shadow-[0_4px_0_0_#18181b] active:shadow-none transition-all group"
            >
              <div className="flex items-center justify-between mb-2 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200">
                  KEY 01
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-emerald-400 transition-colors shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              </div>
              <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" />
                <span>TIMETABLE</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 block mt-1">Weekly Flight Deck</span>
            </Link>

            <Link
              href="/study"
              onClick={() => playHardwareClick(880)}
              className="relative p-4 rounded-xl border border-zinc-800 bg-[#0e0e12] hover:border-zinc-600 hover:bg-[#121217] active:translate-y-[2px] shadow-[0_4px_0_0_#18181b] active:shadow-none transition-all group"
            >
              <div className="flex items-center justify-between mb-2 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200">
                  KEY 02
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-amber-400 transition-colors shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
              </div>
              <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                <Flame className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" />
                <span>POMODORO</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 block mt-1">Chrono Telemetry</span>
            </Link>

            <Link
              href="/attendance"
              onClick={() => playHardwareClick(960)}
              className="relative p-4 rounded-xl border border-zinc-800 bg-[#0e0e12] hover:border-zinc-600 hover:bg-[#121217] active:translate-y-[2px] shadow-[0_4px_0_0_#18181b] active:shadow-none transition-all group"
            >
              <div className="flex items-center justify-between mb-2 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200">
                  KEY 03
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-emerald-400 transition-colors shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              </div>
              <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" />
                <span>ATTENDANCE</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 block mt-1">Sentinel Calculator</span>
            </Link>

            <Link
              href="/budget"
              onClick={() => playHardwareClick(1040)}
              className="relative p-4 rounded-xl border border-zinc-800 bg-[#0e0e12] hover:border-zinc-600 hover:bg-[#121217] active:translate-y-[2px] shadow-[0_4px_0_0_#18181b] active:shadow-none transition-all group"
            >
              <div className="flex items-center justify-between mb-2 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200">
                  KEY 04
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-cyan-400 transition-colors shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
              </div>
              <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" />
                <span>BUDGET</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 block mt-1">Reserve Ledger</span>
            </Link>
          </div>
        </div>
      </div>

      {/* AI Timetable Scanner Modal */}
      <AiTimetableModal
        isOpen={isAiScanOpen}
        onClose={() => setIsAiScanOpen(false)}
      />
    </AppShell>
  );
}
