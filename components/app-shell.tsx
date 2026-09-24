"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth/auth-client";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  DollarSign,
  UserCheck,
  Settings,
  LogOut,
  Loader2,
  Menu,
  X,
  ShieldCheck,
  Terminal,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandHud } from "@/components/command-hud";
import { playHardwareClick, playToggleSound, isAudioMuted, setAudioMuted } from "@/lib/audio-feedback";

export function NexusGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinejoin="round" />
      <path d="M2 17l10 5 10-5" strokeLinejoin="round" />
      <path d="M2 12l10 5 10-5" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  headerAction?: React.ReactNode;
}

export function AppShell({
  children,
  pageTitle,
  pageDescription,
  headerAction,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHudOpen, setIsHudOpen] = useState(false);
  const [isMuted, setIsMutedState] = useState(false);
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    setIsMutedState(isAudioMuted());
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(
        now.toISOString().substring(11, 19) + " UTC"
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    setAudioMuted(next);
    setIsMutedState(next);
    if (!next) playToggleSound();
  };

  const navItems = [
    {
      code: "01",
      name: "Command Center",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      code: "02",
      name: "Timetable & Schedule",
      icon: Calendar,
      path: "/calendar",
    },
    {
      code: "03",
      name: "Study & Focus Space",
      icon: BookOpen,
      path: "/study",
    },
    {
      code: "04",
      name: "Attendance Sentinel",
      icon: UserCheck,
      path: "/attendance",
    },
    {
      code: "05",
      name: "Budget Tracker",
      icon: DollarSign,
      path: "/budget",
    },
    {
      code: "06",
      name: "Settings & Profile",
      icon: Settings,
      path: "/settings",
    },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      setIsLoggingOut(false);
    }
  };

  if (currentUser === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            SYS_INIT // LOADING ENVIRONMENT...
          </p>
        </div>
      </div>
    );
  }

  if (currentUser === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-200">
        <div className="text-center max-w-sm px-8 py-10 rounded-md border border-zinc-800 bg-[#0c0c0e] shadow-2xl">
          <div className="h-10 w-10 rounded-md bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 mx-auto mb-4">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-zinc-100 mb-1 tracking-tight font-mono uppercase">
            Authentication Required
          </h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed font-mono">
            Please sign in to access your Nexus workstation environment.
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="w-full font-mono text-xs uppercase"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#09090b] text-zinc-100 font-sans relative selection:bg-zinc-200 selection:text-zinc-950">
      {/* Precision Background Grid with Crosshairs */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

      {/* Floating Tactical Command HUD */}
      <CommandHud isOpen={isHudOpen} onClose={() => setIsHudOpen(false)} />

      {/* Desktop Docked Sidebar */}
      <aside className="w-64 border-r border-zinc-800/90 bg-[#0c0c0e] p-4 hidden lg:flex flex-col justify-between shrink-0 relative z-30 shadow-[1px_0_0_0_rgba(255,255,255,0.02)_inset]">
        <div className="space-y-6">
          {/* Hardware Header / Brand */}
          <Link
            href="/dashboard"
            onClick={() => playHardwareClick()}
            className="flex items-center gap-3 px-2 py-1.5 rounded-md border border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 transition-colors group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] group-hover:border-zinc-500 transition-colors">
              <NexusGlyph className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white font-mono uppercase">Nexus</span>
                <span className="font-mono text-[9px] uppercase px-1 py-0.2 rounded border border-zinc-800 bg-zinc-950 text-emerald-400 font-bold">
                  v2.4
                </span>
              </div>
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
                CYBERDECK // OS
              </span>
            </div>
          </Link>

          {/* Nav Group */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <span>// INSTRUMENT RACK</span>
              <span className="text-[9px] text-zinc-600">[06 MOD]</span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => playToggleSound()}
                    className={`relative flex items-center justify-between px-3 py-2 rounded-md text-xs font-mono font-medium transition-all border ${
                      isActive
                        ? "bg-zinc-800 text-white border-zinc-600 shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_2px_8px_rgba(0,0,0,0.8)]"
                        : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 hover:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Integrated LED status pip */}
                      <span
                        className={`h-1.5 w-1.5 rounded-[1px] transition-all ${
                          isActive
                            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]"
                            : "bg-zinc-700 opacity-60"
                        }`}
                      />
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-white" : "text-zinc-500"}`} />
                      <span className="tracking-wide uppercase text-[11px]">{item.name}</span>
                    </div>

                    <span className={`text-[10px] ${isActive ? "text-zinc-300 font-bold" : "text-zinc-600"}`}>
                      {item.code}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Telemetry Monitor & User Info */}
        <div className="space-y-3 pt-3 border-t border-zinc-800/80">
          {/* Subsystem Mini VU Bar */}
          <div className="p-2.5 rounded-md bg-zinc-900/60 border border-zinc-800 font-mono text-[10px] space-y-1.5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="uppercase text-[9px] tracking-wider text-zinc-500">ENGINE LOAD</span>
              <span className="text-emerald-400 font-bold">14% // NOMINAL</span>
            </div>
            <div className="flex gap-[2px] h-1.5">
              {[true, true, true, false, false, false, false, false].map((active, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded-[1px] ${
                    active ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" : "bg-zinc-800"
                  }`}
                />
              ))}
            </div>
          </div>

          <Link
            href="/settings"
            onClick={() => playHardwareClick()}
            className="flex items-center gap-2.5 p-2 rounded-md bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all"
          >
            {currentUser.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.image}
                alt={currentUser.name}
                className="h-7 w-7 rounded-md border border-zinc-700 object-cover"
              />
            ) : (
              <div className="h-7 w-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 font-mono font-bold text-xs">
                {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-mono font-semibold text-zinc-200 truncate uppercase">{currentUser.name}</p>
              <p className="text-[9px] font-mono text-zinc-500 truncate uppercase">
                {currentUser.major || currentUser.college || currentUser.email}
              </p>
            </div>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full justify-start gap-2 text-zinc-400 hover:text-rose-300 hover:border-rose-900/50 hover:bg-rose-950/20 font-mono text-[10px] uppercase"
          >
            {isLoggingOut ? (
              <Loader2 className="h-3 w-3 animate-spin text-rose-400" />
            ) : (
              <LogOut className="h-3 w-3" />
            )}
            <span>TERMINATE SESSION</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-[#0c0c0e] border-r border-zinc-800 p-5 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-150">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100">
                    <NexusGlyph className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-sm text-zinc-100 font-mono uppercase">Nexus OS</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;

                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-mono border ${
                        isActive
                          ? "bg-zinc-800 border-zinc-600 text-white font-bold"
                          : "border-transparent text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500">{item.code}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="justify-start gap-2 text-zinc-400 hover:text-rose-400 font-mono text-[10px] uppercase"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>TERMINATE SESSION</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Cockpit Chassis */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Topbar Aerospace Status Header */}
        <header className="h-13 border-b border-zinc-800 bg-[#0c0c0e]/95 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-[1px] bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,1)]" />
                <h1 className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                  {pageTitle || "Command Center"}
                </h1>
              </div>
              {pageDescription && (
                <p className="text-[10px] font-mono text-zinc-500 hidden md:block">
                  {pageDescription}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {headerAction}

            {/* Quick Command HUD Trigger */}
            <button
              onClick={() => {
                playHardwareClick();
                setIsHudOpen(true);
              }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 font-mono text-[10px] tracking-wider uppercase cursor-pointer transition-colors"
              title="Open Tactical Command HUD (CMD+K)"
            >
              <Terminal className="h-3 w-3 text-zinc-400" />
              <span>COMMAND HUD</span>
              <kbd className="px-1 py-0.2 rounded bg-zinc-950 border border-zinc-800 text-[9px] text-zinc-400 font-bold">
                ⌘K
              </kbd>
            </button>

            {/* Sound Haptics Switcher */}
            <button
              onClick={toggleSound}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-mono text-[10px] cursor-pointer transition-colors"
              title={isMuted ? "Unmute hardware sound clicks" : "Mute hardware sound clicks"}
            >
              {isMuted ? (
                <VolumeX className="h-3 w-3 text-rose-400" />
              ) : (
                <Volume2 className="h-3 w-3 text-emerald-400" />
              )}
              <span className="hidden md:inline uppercase text-[9px]">
                {isMuted ? "MUTED" : "HAPTICS"}
              </span>
            </button>

            {/* Live Clock Telemetry */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/80 font-mono text-[10px] text-zinc-400">
              <span className="text-zinc-500">TIME:</span>
              <span className="text-white font-bold">{utcTime || "SYNCING..."}</span>
            </div>

            {/* Connection Ping Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/80 font-mono text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline uppercase tracking-wider text-[9px]">SYNCED</span>
            </div>
          </div>
        </header>

        {/* Dynamic View Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
