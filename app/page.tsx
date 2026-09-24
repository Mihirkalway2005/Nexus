"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  DollarSign,
  UserCheck,
  ArrowRight,
  Shield,
  Clock,
  Terminal,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { NexusGlyph } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export default function Home() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const isAuthenticated = !!currentUser;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
      {/* Background Subtle Grid Effect */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-[#0c0c0e] text-white">
              <NexusGlyph className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-wider uppercase text-white">
                NEXUS
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                SYS // 01
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-wider text-zinc-400">
            <a href="#features" className="transition-colors hover:text-white">
              Capabilities
            </a>
            <a href="#architecture" className="transition-colors hover:text-white">
              Telemetry
            </a>
            <a href="#security" className="transition-colors hover:text-white">
              Security
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "font-mono text-xs font-semibold rounded-md px-4 flex items-center gap-2 cursor-pointer"
                )}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                DASHBOARD
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "font-mono text-xs text-zinc-400 hover:text-white rounded-md cursor-pointer"
                  )}
                >
                  SIGN IN
                </Link>
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "font-mono text-xs font-semibold rounded-md px-4 flex items-center gap-1.5 cursor-pointer"
                  )}
                >
                  INITIALIZE <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-[#0c0c0e] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>OPERATIONAL ARCHITECTURE // STUDENT COCKPIT</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
          Industrial-Grade OS for Academic Execution
        </h1>

        <p className="mt-6 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-mono leading-relaxed">
          Zero fluff. Unify lecture timetables, smart attendance forecasting, offline audio focus DSP, and semester ledger velocity in one unified control terminal.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 px-8 font-mono text-xs font-semibold tracking-wider rounded-md w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              LAUNCH COMMAND CENTER
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 px-8 font-mono text-xs font-semibold tracking-wider rounded-md w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer"
                )}
              >
                INITIALIZE ACCOUNT <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 px-8 font-mono text-xs font-medium tracking-wider rounded-md border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white w-full sm:w-auto cursor-pointer"
                )}
              >
                SIGN IN
              </Link>
            </>
          )}
        </div>

        {/* Feature Telemetry Row */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>CONVEX PERSISTENCE // SYNCED</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            <span>ENCRYPTED AUTH IDENTITY</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            <span>ACCURATE BUNK CALCULATOR</span>
          </div>
        </div>

        {/* Mockup / Dashboard Preview Showcase Card */}
        <div id="architecture" className="mt-14 relative mx-auto max-w-5xl rounded-md border border-zinc-800 bg-[#0c0c0e] p-4 text-left">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 px-2">
            <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
              <Terminal className="h-3.5 w-3.5 text-zinc-500" />
              <span>TERMINAL // nexus.core.sys</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>STATUS: HEALTHY</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
            <div className="p-4 rounded-md bg-zinc-900/50 border border-zinc-800/80 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase text-zinc-500">[01] SCHEDULE</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">UPCOMING</span>
              </div>
              <p className="font-mono text-sm font-bold text-white">Algorithms & Complexity</p>
              <p className="font-mono text-xs text-zinc-500 mt-1">10:00 - 11:30 AM • Hall C-2</p>
            </div>

            <div className="p-4 rounded-md bg-zinc-900/50 border border-zinc-800/80 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase text-zinc-500">[02] ATTENDANCE</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-emerald-400 font-semibold">SAFE</span>
              </div>
              <p className="font-mono text-2xl font-bold text-white">92.4%</p>
              <p className="font-mono text-xs text-zinc-500 mt-1">Margin: +4 classes ahead</p>
            </div>

            <div className="p-4 rounded-md bg-zinc-900/50 border border-zinc-800/80 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase text-zinc-500">[03] SEMESTER LEDGER</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">BALANCE</span>
              </div>
              <p className="font-mono text-2xl font-bold text-white">$420 <span className="text-xs text-zinc-500 font-normal">/ $600</span></p>
              <p className="font-mono text-xs text-zinc-500 mt-1">30% remaining allowance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="features" className="py-16 px-6 max-w-7xl mx-auto relative z-10 border-t border-zinc-800">
        <div className="text-left mb-12">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            SYSTEM SPECIFICATION
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Engineered Modular Subsystems
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-md bg-[#0c0c0e] border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="font-mono text-[10px] text-zinc-500">[MOD // 01]</span>
              </div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white mt-4">
                Smart Timetable
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Automated recurring timetable with AI timetable vision OCR, day filtering, and conflict alerts.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-md bg-[#0c0c0e] border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="font-mono text-[10px] text-zinc-500">[MOD // 02]</span>
              </div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white mt-4">
                Study Space & DSP
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Synthesized offline audio noise generator, Pomodoro clock, Groq PDF note synthesis, and active decks.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-md bg-[#0c0c0e] border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <UserCheck className="h-4 w-4" />
                </div>
                <span className="font-mono text-[10px] text-zinc-500">[MOD // 03]</span>
              </div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white mt-4">
                Attendance Sentinel
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Subject threshold enforcement with safe bunk margin calculation and single-click attendance logging.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-md bg-[#0c0c0e] border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <DollarSign className="h-4 w-4" />
                </div>
                <span className="font-mono text-[10px] text-zinc-500">[MOD // 04]</span>
              </div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white mt-4">
                Student Budget
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Expense telemetry ledger, monthly allowances, velocity indicators, and categorized transaction records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Cloud Section */}
      <section id="security" className="py-16 px-6 max-w-7xl mx-auto border-t border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              INFRASTRUCTURE // SECURITY
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
              Deterministic Persistence & Privacy
            </h2>
            <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
              Every data mutation is verified against Better Auth sessions and synced in real-time through isolated Convex backend functions. No tracking pixels, no ads, no bloated telemetry scripts.
            </p>
          </div>

          <div className="p-5 rounded-md border border-zinc-800 bg-[#0c0c0e] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-zinc-400">
              <span>SECURITY PROTOCOL</span>
              <span className="text-emerald-400">ENABLED</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Authentication Engine</span>
              <span className="text-zinc-200">Better Auth v1.4</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Real-Time Cloud DB</span>
              <span className="text-zinc-200">Convex Distributed Sync</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Offline Audio Synthesizer</span>
              <span className="text-zinc-200">Web Audio API (Client Only)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-zinc-800 bg-[#09090b] text-zinc-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <NexusGlyph className="h-4 w-4 text-zinc-400" />
            <span className="font-bold text-zinc-300">NEXUS // STUDENT OS</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-zinc-300 transition-colors">
              SIGN IN
            </Link>
            <Link href="/signup" className="hover:text-zinc-300 transition-colors">
              SIGN UP
            </Link>
            <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
              DASHBOARD
            </Link>
          </div>

          <p className="text-[11px] text-zinc-600">
            SYSTEM VERSION 2.0 // INDUSTRIAL CAD AESTHETIC
          </p>
        </div>
      </footer>
    </div>
  );
}
