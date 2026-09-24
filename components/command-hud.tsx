"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  DollarSign,
  UserCheck,
  Settings,
  Volume2,
  VolumeX,
  Terminal,
  X,
  Search,
  Zap,
} from "lucide-react";
import { playTelemetryChirp, playToggleSound, isAudioMuted, setAudioMuted } from "@/lib/audio-feedback";

interface CommandHudProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandHud({ isOpen, onClose }: CommandHudProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isAudioMuted());
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          playTelemetryChirp();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    playToggleSound();
    onClose();
    router.push(path);
  };

  const handleToggleMute = () => {
    const next = !muted;
    setAudioMuted(next);
    setMuted(next);
    if (!next) {
      playTelemetryChirp();
    }
  };

  const commands = [
    { id: "dash", label: "Dashboard Cockpit", path: "/dashboard", icon: LayoutDashboard, key: "1" },
    { id: "cal", label: "Smart Timetable", path: "/calendar", icon: Calendar, key: "2" },
    { id: "study", label: "Study Space & DSP Synth", path: "/study", icon: BookOpen, key: "3" },
    { id: "att", label: "Attendance Sentinel", path: "/attendance", icon: UserCheck, key: "4" },
    { id: "budget", label: "Semester Budget Ledger", path: "/budget", icon: DollarSign, key: "5" },
    { id: "settings", label: "System Settings", path: "/settings", icon: Settings, key: "6" },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-md border border-zinc-700 bg-[#0c0c0e] shadow-[0_0_50px_rgba(0,0,0,0.9),0_1px_0_0_rgba(255,255,255,0.08)_inset] overflow-hidden">
        {/* Top HUD Frame Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              NEXUS // TACTICAL COMMAND HUD
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              [ESC TO EXIT]
            </span>
            <button
              onClick={() => {
                playToggleSound();
                onClose();
              }}
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative border-b border-zinc-800/80 p-3 bg-zinc-950/60">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a subsystem command or shortcut..."
            className="w-full pl-8 pr-4 py-1.5 font-mono text-xs bg-transparent text-white placeholder-zinc-500 outline-none"
          />
        </div>

        {/* Telemetry Bar */}
        <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-800/60 bg-zinc-900/30 font-mono text-[10px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              STATUS: READY
            </span>
            <span>BACKEND: CONVEX CLOUD</span>
          </div>
          <button
            onClick={handleToggleMute}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="h-3 w-3 text-rose-400" /> : <Volume2 className="h-3 w-3 text-emerald-400" />}
            <span>AUDIO HAPTICS: {muted ? "MUTED" : "ACTIVE"}</span>
          </button>
        </div>

        {/* Commands List */}
        <div className="p-2 max-h-72 overflow-y-auto space-y-1 font-mono">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-zinc-800/80 hover:text-white text-zinc-300 text-xs transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-zinc-400 group-hover:text-white" />
                  <span className="font-semibold uppercase tracking-wider">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-mono">EXECUTE</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-400 font-mono">
                    [{item.key}]
                  </kbd>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-6 text-center text-xs text-zinc-500 font-mono">
              NO SUBSYSTEM FOUND MATCHING &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Bottom Hardware Status Strip */}
        <div className="border-t border-zinc-800 bg-[#09090b] px-4 py-2 flex items-center justify-between font-mono text-[10px] text-zinc-500">
          <span>HARDWARE CHASSIS // REVISION 2.4</span>
          <span>LATENCY: 14MS</span>
        </div>
      </div>
    </div>
  );
}
