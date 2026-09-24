"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HardwareCard } from "@/components/ui/hardware-card";
import { LedMeter } from "@/components/ui/led-meter";
import { playHardwareClick } from "@/lib/audio-feedback";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Plus,
  BookOpen,
  Layers,
  CheckCircle,
  Clock,
  Trash2,
  Brain,
  FileText,
  SlidersHorizontal,
  Timer,
  Upload,
  FileUp,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";

type TimerMode = "pomodoro" | "deepwork" | "shortBreak" | "longBreak" | "custom";

const PRESET_CONFIGS: Record<Exclude<TimerMode, "custom">, { label: string; minutes: number }> = {
  pomodoro: { label: "Pomodoro (25m)", minutes: 25 },
  deepwork: { label: "Deep Work (50m)", minutes: 50 },
  shortBreak: { label: "Short Break (5m)", minutes: 5 },
  longBreak: { label: "Long Break (15m)", minutes: 15 },
};

export default function StudyPage() {
  // Timer State
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [customMinutes, setCustomMinutes] = useState(30);
  const [customMinutesInput, setCustomMinutesInput] = useState("30");
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PRESET_CONFIGS.pomodoro.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeSubject, setActiveSubject] = useState("");

  // Convex queries & mutations
  const stats = useQuery(api.study.getStudyStats) || {
    todayMinutes: 0,
    weekMinutes: 0,
    totalSessions: 0,
    recentSessions: [],
  };
  const notes = useQuery(api.study.getNotes) || [];
  const flashcards = useQuery(api.study.getFlashcards) || [];

  const logSessionMutation = useMutation(api.study.logSession);
  const saveNoteMutation = useMutation(api.study.saveNote);
  const deleteNoteMutation = useMutation(api.study.deleteNote);
  const createFlashcardMutation = useMutation(api.study.createFlashcard);
  const createFlashcardsBatchMutation = useMutation(api.study.createFlashcardsBatch);
  const toggleFlashcardMutation = useMutation(api.study.toggleFlashcardMastered);
  const deleteFlashcardMutation = useMutation(api.study.deleteFlashcard);

  // Selected note for full reading view
  const [selectedNoteView, setSelectedNoteView] = useState<(typeof notes)[0] | null>(null);

  // AI Note Generator State
  const [isAiNoteModalOpen, setIsAiNoteOpen] = useState(false);
  const [aiInputMode, setAiInputMode] = useState<"file" | "text">("file");
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiPastedText, setAiPastedText] = useState("");
  const [aiStyle, setAiStyle] = useState<"cheat-sheet" | "summary" | "deep-dive">("cheat-sheet");
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiLoadingStep, setAiLoadingStep] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    title: string;
    subject: string;
    summary: string;
    content: string;
    tags: string[];
    flashcards: Array<{ front: string; back: string }>;
  } | null>(null);
  const [aiCardsSaved, setAiCardsSaved] = useState(false);
  const [aiNoteSaved, setAiNoteSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Modals
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"timer" | "notes" | "flashcards">("timer");

  // Note Form
  const [noteTitle, setNoteTitle] = useState("");
  const [noteSubject, setNoteSubject] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteTags, setNoteTags] = useState("");

  // Flashcard Form
  const [cardDeck, setCardDeck] = useState("General");
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Web Audio Synthesizer for Ambient Focus Sounds
  const [ambientSound, setAmbientSound] = useState<"off" | "rain" | "brown" | "binaural">("off");
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodeRef = useRef<{ stop: () => void } | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Oscilloscope Animation Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = "#060608";
      ctx.fillRect(0, 0, width, height);

      // Cathode ray center grid line
      ctx.strokeStyle = "#141418";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const analyser = analyserRef.current;
      if (analyser && ambientSound !== "off") {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#34d399";
        ctx.shadowColor = "#34d399";
        ctx.shadowBlur = 4;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Flatline scan with micro noise
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#27272a";
        ctx.beginPath();
        const jitter = Math.sin(Date.now() / 200) * 0.8;
        ctx.moveTo(0, height / 2 + jitter);
        ctx.lineTo(width, height / 2 + jitter);
        ctx.stroke();
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [ambientSound]);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Session finished
      setIsRunning(false);
      const sessionMinutes = mode === "custom" ? customMinutes : PRESET_CONFIGS[mode].minutes;
      if (mode === "pomodoro" || mode === "deepwork" || mode === "custom") {
        logSessionMutation({
          durationMinutes: sessionMinutes,
          mode,
          subject: activeSubject || undefined,
        });
      }
      playChime();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, customMinutes, activeSubject, logSessionMutation]);

  // Handle Switch Timer Mode
  const handleSwitchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === "custom") {
      setTimeLeft(customMinutes * 60);
    } else {
      setTimeLeft(PRESET_CONFIGS[newMode].minutes * 60);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    const mins = mode === "custom" ? customMinutes : PRESET_CONFIGS[mode].minutes;
    setTimeLeft(mins * 60);
  };

  const handleApplyCustomTime = (mins: number) => {
    const validMins = Math.max(1, Math.min(360, mins || 30));
    setCustomMinutes(validMins);
    setCustomMinutesInput(validMins.toString());
    setMode("custom");
    setIsRunning(false);
    setTimeLeft(validMins * 60);
    setIsCustomModalOpen(false);
  };

  // Play a gentle notification chime using Web Audio API
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {}
  };

  // Ambient sound generator via Web Audio API
  const toggleAmbientSound = (type: "rain" | "brown" | "binaural") => {
    if (ambientSound === type) {
      // Turn off
      if (soundNodeRef.current) {
        soundNodeRef.current.stop();
        soundNodeRef.current = null;
      }
      analyserRef.current = null;
      setAmbientSound("off");
      return;
    }

    // Stop current if any
    if (soundNodeRef.current) {
      soundNodeRef.current.stop();
      soundNodeRef.current = null;
    }

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(ambientVolume * 0.4, ctx.currentTime);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      masterGain.connect(analyser);
      analyserRef.current = analyser;

      masterGain.connect(ctx.destination);

      if (type === "rain" || type === "brown") {
        // Buffer-based noise generator
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === "brown") {
            // Brown noise (integrated white noise)
            data[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
          } else {
            // Rain: filtered pink/white noise
            data[i] = (lastOut + 0.05 * white) / 1.05;
            lastOut = data[i];
            data[i] *= 2.0;
          }
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(type === "rain" ? 800 : 350, ctx.currentTime);

        noise.connect(filter);
        filter.connect(masterGain);
        noise.start();

        soundNodeRef.current = {
          stop: () => {
            try {
              noise.stop();
            } catch {}
          },
        };
      } else if (type === "binaural") {
        // 40Hz Gamma Focus Frequency (200Hz left, 240Hz right)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.frequency.setValueAtTime(200, ctx.currentTime);
        osc2.frequency.setValueAtTime(240, ctx.currentTime);

        osc1.connect(masterGain);
        osc2.connect(masterGain);
        osc1.start();
        osc2.start();

        soundNodeRef.current = {
          stop: () => {
            try {
              osc1.stop();
              osc2.stop();
            } catch {}
          },
        };
      }

      setAmbientSound(type);
    } catch (err) {
      console.error("Audio synth error:", err);
    }
  };

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (soundNodeRef.current) {
        soundNodeRef.current.stop();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalTime = (mode === "custom" ? customMinutes : PRESET_CONFIGS[mode].minutes) * 60;
  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !noteContent) return;

    await saveNoteMutation({
      title: noteTitle,
      subject: noteSubject || "General",
      content: noteContent,
      tags: noteTags ? noteTags.split(",").map((t) => t.trim()) : [],
    });

    setNoteTitle("");
    setNoteSubject("");
    setNoteContent("");
    setNoteTags("");
    setIsAddNoteOpen(false);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardFront || !cardBack) return;

    await createFlashcardMutation({
      deck: cardDeck || "General",
      front: cardFront,
      back: cardBack,
    });

    setCardFront("");
    setCardBack("");
    setIsAddCardOpen(false);
  };

  const handleGenerateAiNotes = async () => {
    setAiError(null);
    setAiResult(null);
    setAiCardsSaved(false);
    setAiNoteSaved(false);

    if (aiInputMode === "file" && !aiFile) {
      setAiError("Please select or drop a PDF, TXT, or Markdown file first.");
      return;
    }
    if (aiInputMode === "text" && (!aiPastedText || aiPastedText.trim().length < 25)) {
      setAiError("Please enter at least 25 characters of lecture text or syllabus content.");
      return;
    }

    setAiIsLoading(true);
    setAiLoadingStep(
      aiInputMode === "file"
        ? "Extracting text from PDF document..."
        : "Preparing lecture text for synthesis..."
    );

    try {
      let response: Response;

      if (aiInputMode === "file" && aiFile) {
        const formData = new FormData();
        formData.append("file", aiFile);
        formData.append("style", aiStyle);
        if (aiCustomPrompt) formData.append("customPrompt", aiCustomPrompt);

        setTimeout(() => {
          setAiLoadingStep("Groq AI is structuring concepts and exam cheat sheet...");
        }, 1200);

        response = await fetch("/api/ai/summarize-pdf", {
          method: "POST",
          body: formData,
        });
      } else {
        setTimeout(() => {
          setAiLoadingStep("Groq AI is structuring concepts and exam cheat sheet...");
        }, 800);

        response = await fetch("/api/ai/summarize-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: aiPastedText,
            style: aiStyle,
            customPrompt: aiCustomPrompt,
            fileName: "Lecture Notes",
          }),
        });
      }

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to generate study notes.");
      }

      setAiResult(resData.data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong while generating notes.";
      setAiError(msg);
    } finally {
      setAiIsLoading(false);
      setAiLoadingStep("");
    }
  };

  const handleSaveAiNoteToLibrary = async () => {
    if (!aiResult) return;
    await saveNoteMutation({
      title: aiResult.title,
      subject: aiResult.subject || "General",
      content: `${aiResult.summary ? `> **TL;DR:** ${aiResult.summary}\n\n` : ""}${aiResult.content}`,
      tags: aiResult.tags || ["AI", "Summary"],
    });
    setAiNoteSaved(true);
  };

  const handleSaveAiFlashcardsToDeck = async () => {
    if (!aiResult?.flashcards || aiResult.flashcards.length === 0) return;
    await createFlashcardsBatchMutation({
      cards: aiResult.flashcards.map((fc) => ({
        deck: aiResult.subject || "AI Notes",
        front: fc.front,
        back: fc.back,
      })),
    });
    setAiCardsSaved(true);
  };

  const handleCopyNotes = () => {
    if (!aiResult) return;
    const fullText = `# ${aiResult.title}\nSubject: ${aiResult.subject}\n\nTL;DR:\n${aiResult.summary}\n\n${aiResult.content}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setAiFile(file);
      setAiInputMode("file");
    }
  };

  return (
    <AppShell
      pageTitle="Study Space & Focus"
      pageDescription="Pomodoro timer, offline ambient soundscape, interactive notes, and flashcard revision."
      headerAction={
        <div className="flex items-center gap-2">
          {activeTab === "notes" && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  setAiError(null);
                  setIsAiNoteOpen(true);
                }}
                className="font-mono text-xs gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" /> AI PDF NOTES
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddNoteOpen(true)}
                className="font-mono text-xs gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> MANUAL NOTE
              </Button>
            </div>
          )}
          {activeTab === "flashcards" && (
            <Button
              size="sm"
              variant="default"
              onClick={() => setIsAddCardOpen(true)}
              className="font-mono text-xs gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> NEW FLASHCARD
            </Button>
          )}
        </div>
      }
    >
      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-4 mb-8">
        {[
          { id: "timer", label: "Focus Timer", icon: Clock },
          { id: "notes", label: "Study Notes", icon: FileText, count: notes.length },
          { id: "flashcards", label: "Flashcards", icon: Layers, count: flashcards.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer border ${
                isActive
                  ? "bg-zinc-800 text-white border-zinc-700 shadow-sm"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: FOCUS TIMER */}
      {activeTab === "timer" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: The Timer Hero in Hardware Chassis */}
          <div className="lg:col-span-2 space-y-6">
            <HardwareCard
              refId="NX-CHRONO"
              label="CHRONO // DEEP WORK ENGINE"
              badge={isRunning ? "CYCLE ENGAGED" : "STANDBY"}
              badgeVariant={isRunning ? "amber" : "zinc"}
              className="p-6 sm:p-8"
            >
              {/* Mode Switcher Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6 relative z-10">
                {(Object.keys(PRESET_CONFIGS) as Array<Exclude<TimerMode, "custom">>).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      playHardwareClick(1000);
                      handleSwitchMode(m);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer border ${
                      mode === m
                        ? "bg-zinc-100 text-zinc-950 border-white shadow-sm font-bold"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {PRESET_CONFIGS[m].label}
                  </button>
                ))}

                {/* Custom Timer Mode Button */}
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={() => {
                      playHardwareClick(1000);
                      handleSwitchMode("custom");
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                      mode === "custom"
                        ? "bg-zinc-100 text-zinc-950 border-white shadow-sm font-bold"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    <Timer className="h-3.5 w-3.5" />
                    <span>Custom ({customMinutes}m)</span>
                  </button>
                  <button
                    onClick={() => {
                      playHardwareClick(1200);
                      setCustomMinutesInput(customMinutes.toString());
                      setIsCustomModalOpen(true);
                    }}
                    title="Customize timer duration"
                    className="p-1.5 rounded-md text-xs border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-center"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Nixie / VFD Precision Telemetry Chamber */}
              <div className="w-full max-w-lg mx-auto p-6 sm:p-8 rounded-xl border border-zinc-800 bg-[#050508] shadow-[inset_0_2px_16px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-between w-full font-mono text-[10px] text-zinc-500 uppercase tracking-widest px-2">
                  <span>VFD-CHAMBER // SENSORS ONLINE</span>
                  <span className={isRunning ? "text-amber-400 font-bold" : "text-zinc-500"}>
                    {isRunning ? "● CHRONO TICKING" : "○ ENGINE ARMED"}
                  </span>
                </div>

                {/* Large Segmented Time Display */}
                <div className="py-2 text-center">
                  <span
                    className={`text-6xl sm:text-7xl font-mono font-black tracking-tight ${
                      isRunning
                        ? "text-amber-400 drop-shadow-[0_0_18px_rgba(251,191,36,0.65)]"
                        : "text-zinc-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">
                      {mode === "custom" ? `Custom Focus (${customMinutes}m)` : mode.replace(/([A-Z])/g, " $1")}
                    </span>
                  </div>
                </div>

                {/* 16-Segment LED Progress Ladder */}
                <div className="w-full px-2">
                  <LedMeter
                    value={progressPercent}
                    mode="standard"
                    segments={16}
                    label={`SESSION SATURATION: ${Math.round(progressPercent)}%`}
                    showValue
                  />
                </div>

                <div className="flex items-center justify-between w-full font-mono text-[9px] text-zinc-600 px-2 pt-2 border-t border-zinc-900">
                  <span>CYCLE: {mode.toUpperCase()}</span>
                  <span>REMAINING: {timeLeft}s</span>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-3 mt-6 relative z-10">
                <Button
                  indicator={isRunning ? "amber" : "emerald"}
                  onClick={() => setIsRunning(!isRunning)}
                  className={`h-11 px-8 rounded-md font-mono font-semibold text-xs tracking-wider cursor-pointer flex items-center gap-2 ${
                    isRunning
                      ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm"
                      : "bg-white hover:bg-zinc-200 text-zinc-950 shadow-sm"
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4" /> PAUSE FOCUS
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" /> START FOCUS
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="h-11 w-11 rounded-md border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 cursor-pointer p-0 flex items-center justify-center"
                  title="Reset Timer"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Current focus subject input */}
              <div className="mt-6 w-full max-w-xs mx-auto relative z-10">
                <Input
                  placeholder="SUBJECT / FOCUS MODULE"
                  value={activeSubject}
                  onChange={(e) => setActiveSubject(e.target.value)}
                  className="h-9 text-xs text-center font-mono uppercase tracking-wider border-zinc-800 bg-zinc-900/80 text-zinc-200 placeholder-zinc-500 rounded-md"
                />
              </div>
            </HardwareCard>
          </div>

          {/* Right Col: Ambient Focus Audio & Stats */}
          <div className="space-y-6">
            {/* Ambient Synthesizer Box with Real-time Oscilloscope */}
            <HardwareCard refId="DSP-01" label="AMBIENT AUDIO DSP ENGINE">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                      <Volume2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                        Audio Synth
                      </h3>
                      <p className="text-[10px] font-mono text-zinc-500">OFFLINE DSP ENGINE</p>
                    </div>
                  </div>

                  {ambientSound !== "off" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 font-mono flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {ambientSound.toUpperCase()} ACTIVE
                    </span>
                  )}
                </div>

                {/* CRT Audio Oscilloscope Display */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-mono text-[9px] text-zinc-500 uppercase">
                    <span>CRT OSCILLOSCOPE // 128-BIN</span>
                    <span className={ambientSound !== "off" ? "text-emerald-400 font-bold" : "text-zinc-600"}>
                      {ambientSound !== "off" ? "SIGNAL STREAMING" : "IDLE TRACE"}
                    </span>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={56}
                    className="w-full h-14 bg-[#050508] rounded border border-zinc-800 shadow-inner"
                  />
                </div>

                {/* Sound Modes */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "rain", label: "RAIN" },
                    { id: "brown", label: "BROWN" },
                    { id: "binaural", label: "40HZ" },
                  ].map((sound) => {
                    const isActive = ambientSound === sound.id;
                    return (
                      <button
                        key={sound.id}
                        onClick={() => toggleAmbientSound(sound.id as "rain" | "brown" | "binaural")}
                        className={`p-2 rounded-md text-xs font-mono border text-center transition-all cursor-pointer ${
                          isActive
                            ? "bg-zinc-800 border-zinc-600 text-white font-semibold"
                            : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        {sound.label}
                      </button>
                    );
                  })}
                </div>

                {ambientSound !== "off" && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
                      <span>GAIN VELOCITY</span>
                      <span>{Math.round(ambientVolume * 100)}%</span>
                    </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                </div>
              )}
              </div>
            </HardwareCard>

            {/* Study Stats Widget */}
            <HardwareCard refId="NX-CHRONO-STAT" label="FOCUS ANALYTICS">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-md bg-[#050508] border border-zinc-800">
                    <span className="text-[10px] font-mono text-zinc-500 block mb-1">TODAY&apos;S FOCUS</span>
                    <span className="text-2xl font-bold text-white font-mono">
                      {stats.todayMinutes} <span className="text-xs font-normal text-zinc-400">m</span>
                    </span>
                    <div className="mt-2">
                      <LedMeter value={Math.min(100, (stats.todayMinutes / 120) * 100)} segments={8} mode="standard" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-md bg-[#050508] border border-zinc-800">
                    <span className="text-[10px] font-mono text-zinc-500 block mb-1">THIS WEEK</span>
                    <span className="text-2xl font-bold text-white font-mono">
                      {stats.weekMinutes} <span className="text-xs font-normal text-zinc-400">m</span>
                    </span>
                    <div className="mt-2">
                      <LedMeter value={Math.min(100, (stats.weekMinutes / 600) * 100)} segments={8} mode="standard" />
                    </div>
                  </div>
                </div>

                {stats.recentSessions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                      Session Telemetry Ledger
                    </span>
                    <div className="space-y-1.5">
                      {stats.recentSessions.map((s) => (
                        <div
                          key={s._id}
                          className="flex items-center justify-between text-xs p-2.5 rounded-md bg-[#060609] border border-zinc-800/80"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-zinc-200 font-medium font-mono text-[11px]">
                              {s.subject || "Deep Work Block"}
                            </span>
                          </div>
                          <span className="text-zinc-400 font-mono text-[11px]">
                            {s.durationMinutes}m • {new Date(s.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </HardwareCard>
          </div>
        </div>
      )}

      {/* TAB 2: STUDY NOTES */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          {/* AI Banner Hero */}
          <div className="p-5 rounded-md border border-zinc-800 bg-[#0c0c0e] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                    Groq Vision & Synthesis Engine
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                    GROQ // 120B
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
                  Extract structured engineering notes, mathematical formulas, and quiz flashcards from PDFs.
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                setAiError(null);
                setIsAiNoteOpen(true);
              }}
              variant="default"
              className="text-xs font-mono font-semibold px-4 py-2 rounded-md gap-2 cursor-pointer shrink-0"
            >
              <Upload className="h-4 w-4" /> UPLOAD PDF / NOTES
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Library // Study Notes</h2>
              <p className="text-xs text-zinc-500">
                Course summaries, lecture key points, and exam revision cheatsheets.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAiError(null);
                  setIsAiNoteOpen(true);
                }}
                className="font-mono text-xs gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" /> AI GENERATE
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddNoteOpen(true)}
                className="font-mono text-xs gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> MANUAL NOTE
              </Button>
            </div>
          </div>

          {notes.length === 0 ? (
            <div className="p-12 rounded-md border border-dashed border-zinc-800 bg-[#09090b] text-center space-y-4">
              <div className="h-12 w-12 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 mx-auto">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-mono uppercase tracking-wider text-white">No notes indexed</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Upload lecture slides or course PDFs to generate structured notes instantly, or log your own formulas.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setAiError(null);
                    setIsAiNoteOpen(true);
                  }}
                  className="font-mono text-xs gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Upload PDF with Groq AI
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddNoteOpen(true)}
                  className="font-mono text-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Manual Note
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <div
                  key={note._id}
                  onClick={() => setSelectedNoteView(note)}
                  className="p-5 rounded-md border border-zinc-800 bg-[#0c0c0e] hover:border-zinc-700 transition-all flex flex-col justify-between group space-y-4 cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono uppercase tracking-wider">
                        {note.subject}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNoteMutation({ id: note._id });
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-opacity cursor-pointer"
                        title="Delete Note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-zinc-200 transition-colors">
                      {note.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-4 leading-relaxed font-mono">
                      {note.content}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {note.tags.map((t) => (
                        <span key={t} className="text-zinc-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FLASHCARDS */}
      {activeTab === "flashcards" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Decks // Active Flashcards</h2>
              <p className="text-xs text-zinc-500">
                Click a card to toggle between Question and Answer.
              </p>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={() => setIsAddCardOpen(true)}
              className="font-mono text-xs gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> ADD CARD
            </Button>
          </div>

          {flashcards.length === 0 ? (
            <div className="p-12 rounded-md border border-dashed border-zinc-800 bg-[#09090b] text-center">
              <Layers className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-white">No flashcards in deck</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Create prompt & response flashcards to quiz yourself for midterm & final evaluations.
              </p>
              <Button
                size="sm"
                variant="default"
                onClick={() => setIsAddCardOpen(true)}
                className="mt-4 font-mono text-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> CREATE FIRST FLASHCARD
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashcards.map((card) => {
                const isFlipped = flippedCards[card._id] || false;

                return (
                  <div
                    key={card._id}
                    className="flex flex-col rounded-md border border-zinc-800 bg-[#0c0c0e] overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-zinc-800/80 bg-zinc-900/40 text-xs text-zinc-400">
                      <span className="font-mono text-xs uppercase tracking-wider text-zinc-300 font-semibold">{card.deck}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleFlashcardMutation({ id: card._id })}
                          className={`font-mono text-[10px] px-2 py-0.5 rounded border cursor-pointer uppercase ${
                            card.mastered
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold"
                              : "text-zinc-500 border-zinc-800 hover:text-zinc-300"
                          }`}
                        >
                          {card.mastered ? "Mastered" : "Learn"}
                        </button>
                        <button
                          onClick={() => deleteFlashcardMutation({ id: card._id })}
                          className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Interactive Flip Area */}
                    <div
                      onClick={() =>
                        setFlippedCards((prev) => ({
                          ...prev,
                          [card._id]: !prev[card._id],
                        }))
                      }
                      className="flex-1 p-6 min-h-[160px] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-900/30 transition-colors select-none"
                    >
                      <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">
                        {isFlipped ? "[ RESPONSE // ANSWER ]" : "[ PROMPT // CLICK TO FLIP ]"}
                      </span>
                      <p className="text-xs font-mono font-medium text-white leading-relaxed">
                        {isFlipped ? card.back : card.front}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Note */}
      <Modal
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
        title="Create Study Note"
        description="Save formulas, concepts, and notes for quick revision."
      >
        <form onSubmit={handleSaveNote} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="noteTitle" className="text-xs text-zinc-300 font-mono">
              Note Title *
            </Label>
            <Input
              id="noteTitle"
              placeholder="e.g. Dijkstra's Algorithm Complexity"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              required
              className="border-zinc-800 bg-zinc-900/80 text-white font-mono text-xs rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="noteSubject" className="text-xs text-zinc-300 font-mono">
                Subject / Course
              </Label>
              <Input
                id="noteSubject"
                placeholder="Algorithms"
                value={noteSubject}
                onChange={(e) => setNoteSubject(e.target.value)}
                className="border-zinc-800 bg-zinc-900/80 text-white font-mono text-xs rounded-md"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="noteTags" className="text-xs text-zinc-300 font-mono">
                Tags (comma separated)
              </Label>
              <Input
                id="noteTags"
                placeholder="graph, exam, formulas"
                value={noteTags}
                onChange={(e) => setNoteTags(e.target.value)}
                className="border-zinc-800 bg-zinc-900/80 text-white font-mono text-xs rounded-md"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="noteContent" className="text-xs text-zinc-300 font-mono">
              Content *
            </Label>
            <textarea
              id="noteContent"
              rows={5}
              placeholder="Type your notes, bullet points, or formulas here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-800 bg-zinc-900/80 p-3 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddNoteOpen(false)}
              className="font-mono text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              className="font-mono text-xs cursor-pointer"
            >
              Save Note
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Flashcard */}
      <Modal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        title="Add New Flashcard"
        description="Create front/back flashcards for rapid self-testing."
      >
        <form onSubmit={handleSaveCard} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cardDeck" className="text-xs text-zinc-300 font-mono">
              Deck Name
            </Label>
            <Input
              id="cardDeck"
              placeholder="e.g. Operating Systems"
              value={cardDeck}
              onChange={(e) => setCardDeck(e.target.value)}
              className="border-zinc-800 bg-zinc-900/80 text-white font-mono text-xs rounded-md"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cardFront" className="text-xs text-zinc-300 font-mono">
              Front: Question / Prompt *
            </Label>
            <textarea
              id="cardFront"
              rows={2}
              placeholder="What is a deadlock and what are its 4 Coffman conditions?"
              value={cardFront}
              onChange={(e) => setCardFront(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-800 bg-zinc-900/80 p-3 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cardBack" className="text-xs text-zinc-300 font-mono">
              Back: Answer / Explanation *
            </Label>
            <textarea
              id="cardBack"
              rows={3}
              placeholder="Mutual exclusion, hold and wait, no preemption, and circular wait."
              value={cardBack}
              onChange={(e) => setCardBack(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-800 bg-zinc-900/80 p-3 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddCardOpen(false)}
              className="font-mono text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              className="font-mono text-xs cursor-pointer"
            >
              Save Card
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Custom Timer Duration */}
      <Modal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        title="Set Custom Timer Duration"
        description="Select a quick preset or enter an exact focus / study time in minutes."
      >
        <div className="space-y-5">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2 block">
              Quick Presets
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 30, 45, 60, 75, 90, 100, 120].map((mins) => {
                const isSelected = parseInt(customMinutesInput) === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setCustomMinutesInput(mins.toString())}
                    className={`py-2 px-1 rounded-md text-xs font-mono font-medium border transition-all cursor-pointer text-center ${
                      isSelected
                        ? "bg-white text-zinc-950 border-white font-semibold"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : mins === 60 ? "1 hr" : `${mins / 60}h`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom input */}
          <div className="space-y-2">
            <Label htmlFor="customMinutes" className="text-xs text-zinc-300 font-mono">
              Exact Minutes (1 - 360)
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const current = parseInt(customMinutesInput) || 30;
                  const updated = Math.max(1, current - 5);
                  setCustomMinutesInput(updated.toString());
                }}
                className="h-10 w-10 border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white cursor-pointer rounded-md font-mono"
              >
                -5
              </Button>
              <div className="relative flex-1">
                <Input
                  id="customMinutes"
                  type="number"
                  min={1}
                  max={360}
                  value={customMinutesInput}
                  onChange={(e) => setCustomMinutesInput(e.target.value)}
                  className="h-10 text-center font-mono font-bold text-base border-zinc-800 bg-zinc-900/80 text-white rounded-md"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 pointer-events-none">
                  mins
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const current = parseInt(customMinutesInput) || 30;
                  const updated = Math.min(360, current + 5);
                  setCustomMinutesInput(updated.toString());
                }}
                className="h-10 w-10 border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white cursor-pointer rounded-md font-mono"
              >
                +5
              </Button>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCustomModalOpen(false)}
              className="font-mono text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                const val = parseInt(customMinutesInput);
                if (!isNaN(val) && val > 0) {
                  handleApplyCustomTime(val);
                }
              }}
              className="font-mono text-xs cursor-pointer"
            >
              Apply Custom Timer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: View Full Note */}
      <Modal
        isOpen={!!selectedNoteView}
        onClose={() => setSelectedNoteView(null)}
        title={selectedNoteView?.title || "Study Note"}
        description={`Subject: ${selectedNoteView?.subject || "General"}`}
        maxWidth="max-w-2xl"
      >
        {selectedNoteView && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800/80 font-mono">
              <div className="flex items-center gap-1.5">
                {selectedNoteView.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <span>Updated {new Date(selectedNoteView.updatedAt).toLocaleDateString()}</span>
            </div>

            <div className="p-4 rounded-md bg-zinc-900/60 border border-zinc-800/80">
              <FormattedNoteContent content={selectedNoteView.content} />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/80">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `# ${selectedNoteView.title}\n\n${selectedNoteView.content}`
                  );
                }}
                className="font-mono text-xs cursor-pointer gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Text
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => setSelectedNoteView(null)}
                className="font-mono text-xs cursor-pointer"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: AI Document Note Generator (Groq Accelerated) */}
      <Modal
        isOpen={isAiNoteModalOpen}
        onClose={() => {
          if (!aiIsLoading) {
            setIsAiNoteOpen(false);
          }
        }}
        title="AI Study Assistant // Document Synthesis"
        description="Upload lecture slides, syllabus, or PDF notes to extract structured notes, formulas, and flashcards."
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
          {/* If Result is generated, display result view */}
          {aiResult ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Header result info */}
              <div className="p-4 rounded-md bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300">
                      {aiResult.subject}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <Check className="h-3 w-3" /> Structured by Groq 120B
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {aiResult.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyNotes}
                    className="font-mono text-xs cursor-pointer gap-1"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleSaveAiNoteToLibrary}
                    disabled={aiNoteSaved}
                    className="font-mono text-xs cursor-pointer gap-1.5"
                  >
                    {aiNoteSaved ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Saved to Notes
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" /> Save to Study Notes
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Executive Summary Callout */}
              {aiResult.summary && (
                <div className="p-4 rounded-md bg-zinc-900/50 border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
                    Executive Synopsis
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                    {aiResult.summary}
                  </p>
                </div>
              )}

              {/* Formatted Notes Body */}
              <div className="p-5 rounded-md bg-zinc-900/60 border border-zinc-800 space-y-3">
                <FormattedNoteContent content={aiResult.content} />
              </div>

              {/* Auto-Generated Flashcards */}
              {aiResult.flashcards && aiResult.flashcards.length > 0 && (
                <div className="p-5 rounded-md bg-[#0c0c0e] border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-zinc-400" />
                      <h4 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                        Revision Flashcards ({aiResult.flashcards.length})
                      </h4>
                    </div>

                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleSaveAiFlashcardsToDeck}
                      disabled={aiCardsSaved}
                      className="font-mono text-xs cursor-pointer gap-1.5"
                    >
                      {aiCardsSaved ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Saved to Decks
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Add to Flashcard Deck
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {aiResult.flashcards.map((card, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-3 rounded-md bg-zinc-900/80 border border-zinc-800 space-y-1.5"
                      >
                        <div className="text-[11px] font-mono font-bold text-zinc-200">
                          Q: {card.front}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 border-t border-zinc-800/80 pt-1.5">
                          A: {card.back}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom reset / actions */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAiResult(null);
                    setAiFile(null);
                    setAiPastedText("");
                  }}
                  className="font-mono text-xs cursor-pointer"
                >
                  <ArrowRight className="h-3.5 w-3.5 rotate-180 mr-1" /> Summarize Another Document
                </Button>

                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setIsAiNoteOpen(false)}
                  className="font-mono text-xs cursor-pointer"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* Input / Upload screen */
            <div className="space-y-5">
              {/* Input Mode Tabs */}
              <div className="flex items-center gap-2 p-1 rounded-md bg-zinc-900/80 border border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setAiInputMode("file")}
                  className={`flex-1 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                    aiInputMode === "file"
                      ? "bg-zinc-800 text-white border-zinc-700 shadow-sm"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  <FileUp className="h-3.5 w-3.5" /> Upload File (PDF / TXT / MD)
                </button>
                <button
                  type="button"
                  onClick={() => setAiInputMode("text")}
                  className={`flex-1 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                    aiInputMode === "text"
                      ? "bg-zinc-800 text-white border-zinc-700 shadow-sm"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" /> Paste Lecture Text
                </button>
              </div>

              {/* Mode 1: File Upload */}
              {aiInputMode === "file" && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDropFile}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 rounded-md border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                    isDragging
                      ? "border-zinc-500 bg-zinc-900/40"
                      : aiFile
                        ? "border-emerald-500/50 bg-emerald-950/10"
                        : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAiFile(e.target.files[0]);
                      }
                    }}
                  />

                  {aiFile ? (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="h-10 w-10 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-mono font-bold text-white">{aiFile.name}</p>
                        <p className="text-[11px] font-mono text-zinc-400">
                          {(aiFile.size / 1024).toFixed(1)} KB • Click or drag to change
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="h-10 w-10 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-mono font-bold text-white">
                          Drop your lecture PDF, slides, or notes here
                        </p>
                        <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                          Supports PDF documents, TXT, and Markdown files up to 25MB
                        </p>
                      </div>
                      <span className="text-[11px] px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
                        Browse Files
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Paste Raw Text */}
              {aiInputMode === "text" && (
                <div className="space-y-1.5">
                  <Label htmlFor="aiText" className="text-xs text-zinc-300 font-mono">
                    Paste Lecture Notes, Syllabus, or Book Transcripts
                  </Label>
                  <textarea
                    id="aiText"
                    rows={6}
                    placeholder="Paste lecture transcript, textbook section, or raw bullet points here..."
                    value={aiPastedText}
                    onChange={(e) => setAiPastedText(e.target.value)}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900/80 p-3 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                  />
                  <span className="text-[10px] font-mono text-zinc-500 block text-right">
                    {aiPastedText.length} characters
                  </span>
                </div>
              )}

              {/* Note Style Selector */}
              <div className="space-y-2">
                <Label className="text-xs text-zinc-300 font-mono font-semibold">
                  Target Note Structuring Style
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "cheat-sheet",
                      title: "EXAM CHEAT SHEET",
                      desc: "Must-know formulas, test traps & definitions",
                    },
                    {
                      id: "summary",
                      title: "EXECUTIVE SUMMARY",
                      desc: "Core intuition & high-yield takeaways",
                    },
                    {
                      id: "deep-dive",
                      title: "IN-DEPTH NOTES",
                      desc: "Comprehensive breakdown & step-by-step logic",
                    },
                  ].map((styleOption) => {
                    const isSelected = aiStyle === styleOption.id;
                    return (
                      <button
                        key={styleOption.id}
                        type="button"
                        onClick={() => setAiStyle(styleOption.id as typeof aiStyle)}
                        className={`p-3 rounded-md border text-left transition-all cursor-pointer space-y-1 ${
                          isSelected
                            ? "bg-zinc-800 border-zinc-600 text-white font-semibold"
                            : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <div className="text-xs font-mono font-bold text-white">
                          {styleOption.title}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 leading-tight">
                          {styleOption.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Custom Instructions */}
              <div className="space-y-1.5">
                <Label htmlFor="customPrompt" className="text-xs text-zinc-400 font-mono">
                  Custom Focus / Instructions (Optional)
                </Label>
                <Input
                  id="customPrompt"
                  placeholder="e.g. Focus on Chapter 3 formulas, or explain like I'm a beginner..."
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  className="border-zinc-800 bg-zinc-900/80 text-white font-mono text-xs rounded-md"
                />
              </div>

              {/* Error Banner */}
              {aiError && (
                <div className="p-3 rounded-md bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 font-mono">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Loading Banner */}
              {aiIsLoading && (
                <div className="p-4 rounded-md bg-zinc-900 border border-zinc-700 flex items-center gap-3 animate-pulse">
                  <Loader2 className="h-5 w-5 text-white animate-spin shrink-0" />
                  <div>
                    <p className="text-xs font-mono font-bold text-white">
                      Synthesizing Study Notes with Groq AI...
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {aiLoadingStep || "Parsing document..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={aiIsLoading}
                  onClick={() => setIsAiNoteOpen(false)}
                  className="font-mono text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={aiIsLoading}
                  onClick={handleGenerateAiNotes}
                  className="font-mono font-bold text-xs gap-2 cursor-pointer"
                >
                  {aiIsLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> GENERATING...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" /> GENERATE NOTES (GROQ AI)
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </AppShell>
  );
}

// Markdown Formatter Component for structured study notes
function FormattedNoteContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-3 text-xs leading-relaxed text-slate-300">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header 2: e.g. ## 📌 Core Concepts
        if (trimmed.startsWith("## ")) {
          const title = trimmed.replace("## ", "");
          return (
            <div key={idx} className="pt-3 pb-1 border-b border-slate-800/80">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                {title}
              </h4>
            </div>
          );
        }

        // Header 3: e.g. ### Sub-topic
        if (trimmed.startsWith("### ")) {
          const title = trimmed.replace("### ", "");
          return (
            <h5 key={idx} className="text-xs font-semibold text-indigo-300 pt-1">
              {title}
            </h5>
          );
        }

        // Quote block e.g. > **TL;DR:**
        if (trimmed.startsWith("> ")) {
          const quoteText = trimmed.replace("> ", "");
          return (
            <div
              key={idx}
              className="p-3 rounded-xl bg-indigo-950/20 border-l-2 border-indigo-500 text-indigo-200 text-xs my-2"
            >
              {quoteText}
            </div>
          );
        }

        // Bullet point: - or *
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const itemText = trimmed.slice(2);
          const parts = itemText.split(/(\*\*.*?\*\*)/g);

          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
              <div className="flex-1">
                {parts.map((p, pIdx) => {
                  if (p.startsWith("**") && p.endsWith("**")) {
                    return (
                      <strong key={pIdx} className="text-white font-semibold">
                        {p.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={pIdx}>{p}</span>;
                })}
              </div>
            </div>
          );
        }

        // Standard paragraph
        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={idx} className="text-slate-300">
            {parts.map((p, pIdx) => {
              if (p.startsWith("**") && p.endsWith("**")) {
                return (
                  <strong key={pIdx} className="text-white font-semibold">
                    {p.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={pIdx}>{p}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}
