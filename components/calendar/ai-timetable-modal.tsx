"use client";

import React, { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  FileText,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  CalendarDays,
  X,
  BookOpen,
} from "lucide-react";

export interface TimetableSlotItem {
  dayOfWeek: number;
  subject: string;
  code?: string;
  room?: string;
  instructor?: string;
  startTime: string;
  endTime: string;
  type: string;
  color: string;
}

const DAYS = [
  { id: 1, name: "Monday", short: "Mon" },
  { id: 2, name: "Tuesday", short: "Tue" },
  { id: 3, name: "Wednesday", short: "Wed" },
  { id: 4, name: "Thursday", short: "Thu" },
  { id: 5, name: "Friday", short: "Fri" },
  { id: 6, name: "Saturday", short: "Sat" },
  { id: 7, name: "Sunday", short: "Sun" },
];

const PRESET_COLORS = [
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#3b82f6",
  "#f43f5e",
];

interface AiTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export function AiTimetableModal({
  isOpen,
  onClose,
  onImportSuccess,
}: AiTimetableModalProps) {
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review state
  const [detectedClasses, setDetectedClasses] = useState<TimetableSlotItem[]>([]);
  const [reviewFilterDay, setReviewFilterDay] = useState<number | "all">("all");
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [syncAttendance, setSyncAttendance] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importBatchMutation = useMutation(api.timetable.importTimetableBatch);

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setPreviewUrl(null);
    setNotes("");
    setIsScanning(false);
    setErrorMsg(null);
    setDetectedClasses([]);
    setSuccessToast(null);
  };

  const handleModalClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg(null);

    if (selected.type.startsWith("image/")) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    setFile(dropped);
    setErrorMsg(null);

    if (dropped.type.startsWith("image/")) {
      const url = URL.createObjectURL(dropped);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleStartScan = async (sampleData?: { imageData?: string; text?: string }) => {
    if (!file && !sampleData) {
      setErrorMsg("Please upload a timetable photo or document first.");
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);
    setScanStatus("Uploading and preprocessing timetable...");

    try {
      let res: Response;

      if (sampleData) {
        setScanStatus("Reading class matrix with Groq Vision (qwen/qwen3.8-27b)...");
        res = await fetch("/api/ai/parse-timetable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...sampleData,
            notes: notes || "Sample college timetable",
          }),
        });
      } else if (file) {
        const formData = new FormData();
        formData.append("file", file);
        if (notes) formData.append("notes", notes);

        setScanStatus(
          file.type.startsWith("image/")
            ? "Groq Vision analyzing image periods, subjects, and rooms..."
            : "Extracting document text and parsing weekly periods..."
        );

        res = await fetch("/api/ai/parse-timetable", {
          method: "POST",
          body: formData,
        });
      } else {
        throw new Error("No file provided");
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse timetable");
      }

      if (!data.classes || data.classes.length === 0) {
        throw new Error(
          "No class periods could be detected in this image. Please ensure the timetable is clearly visible."
        );
      }

      setDetectedClasses(data.classes);
      setStep("review");
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while parsing the timetable."
      );
    } finally {
      setIsScanning(false);
      setScanStatus("");
    }
  };

  const handleUpdateSlot = (
    index: number,
    field: keyof TimetableSlotItem,
    val: string | number
  ) => {
    setDetectedClasses((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleDeleteSlot = (index: number) => {
    setDetectedClasses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSlot = () => {
    const newSlot: TimetableSlotItem = {
      dayOfWeek: typeof reviewFilterDay === "number" ? reviewFilterDay : 1,
      subject: "New Lecture",
      code: "",
      room: "",
      instructor: "",
      startTime: "09:00",
      endTime: "10:30",
      type: "Lecture",
      color: PRESET_COLORS[detectedClasses.length % PRESET_COLORS.length],
    };
    setDetectedClasses((prev) => [...prev, newSlot]);
  };

  const handleConfirmImport = async () => {
    if (detectedClasses.length === 0) {
      setErrorMsg("No classes to import.");
      return;
    }

    setIsImporting(true);
    setErrorMsg(null);

    try {
      const result = await importBatchMutation({
        slots: detectedClasses.map((item) => ({
          dayOfWeek: Number(item.dayOfWeek) || 1,
          subject: (item.subject || "Academic Lecture").trim(),
          code: item.code?.trim() || undefined,
          room: item.room?.trim() || undefined,
          instructor: item.instructor?.trim() || undefined,
          startTime: item.startTime || "09:00",
          endTime: item.endTime || "10:30",
          color: item.color || "#6366f1",
          type: item.type || "Lecture",
        })),
        replaceExisting,
        syncAttendance,
      });

      setSuccessToast(
        `Successfully imported ${result.importedCount} class sessions! ${
          result.syncedAttendanceCount > 0
            ? `Synced ${result.syncedAttendanceCount} subjects into Attendance Tracker.`
            : ""
        }`
      );

      if (onImportSuccess) {
        onImportSuccess();
      }

      setTimeout(() => {
        handleModalClose();
      }, 1400);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to save timetable to database."
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Filter slots for review view
  const filteredSlots =
    reviewFilterDay === "all"
      ? detectedClasses
      : detectedClasses.filter((s) => s.dayOfWeek === reviewFilterDay);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={step === "upload" ? "⚡ AI Timetable Scanner" : "📋 Review Extracted Timetable"}
      description={
        step === "upload"
          ? "Upload a photo or screenshot of your class timetable. Groq Vision AI will read all periods, subjects, and rooms automatically."
          : "Review and edit the detected class schedule before importing into your weekly calendar."
      }
      maxWidth={step === "upload" ? "max-w-xl" : "max-w-4xl"}
    >
      {/* Toast Notification */}
      {successToast && (
        <div className="mb-4 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-200 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {step === "upload" ? (
        <div className="space-y-5">
          {/* File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`relative rounded-2xl border-2 border-dashed p-7 text-center transition-all cursor-pointer ${
              file
                ? "border-indigo-500/60 bg-indigo-950/20"
                : "border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, application/pdf"
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center space-y-3">
                {previewUrl ? (
                  <div className="relative group max-w-xs mx-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Timetable Preview"
                      className="max-h-48 rounded-xl object-contain border border-slate-800 shadow-lg shadow-indigo-950/30"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md rounded-full p-1 text-slate-300 opacity-90">
                      <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <FileText className="h-8 w-8" />
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-white truncate max-w-sm">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to scan
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-xs border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3 py-2">
                <div className="h-12 w-12 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Drop your timetable photo or PDF here
                  </p>
                  <p className="text-[11px] font-mono text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Supports camera photos, screenshots, whiteboard schedules (PNG, JPG, WEBP), or syllabus PDFs.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                  <Sparkles className="h-3 w-3 text-zinc-400" />
                  Browse filesystem or gallery
                </div>
              </div>
            )}
          </div>

          {/* Optional Instructions */}
          <div className="space-y-1.5">
            <Label htmlFor="aiNotes" className="text-xs font-mono text-zinc-300 flex items-center justify-between">
              <span>Specific Batch or Instructions (Optional)</span>
              <span className="text-[10px] text-zinc-500 font-normal">e.g. &quot;Section B&quot; or &quot;Morning shift only&quot;</span>
            </Label>
            <Input
              id="aiNotes"
              placeholder="e.g. I am in Batch A-2, ignore Wednesday practicals..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border-zinc-800 bg-zinc-900/80 text-white font-mono text-xs placeholder:text-zinc-600 rounded-md"
            />
          </div>

          {/* Feature Callout */}
          <div className="p-3.5 rounded-md border border-zinc-800 bg-zinc-900/50 text-xs font-mono text-zinc-400 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-zinc-200">Groq Vision Fast Pipeline: </span>
              Automatically detects days, 24-hour time slots, subject codes, lecture halls, and instructor names. You can preview and edit everything before saving.
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleModalClose}
              className="border-slate-800 text-xs text-slate-300 cursor-pointer"
              disabled={isScanning}
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => handleStartScan()}
              disabled={!file || isScanning}
              className="gap-2 font-mono"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{scanStatus || "SCANNING..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>START VISION SCAN</span>
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Review View */
        <div className="space-y-4">
          {/* Summary & Day Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-200 uppercase font-mono flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
                // {detectedClasses.length} {detectedClasses.length === 1 ? "Class" : "Classes"} Detected
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                OCR PARSED
              </span>
            </div>

            <Button
              size="xs"
              variant="outline"
              onClick={handleAddSlot}
              className="gap-1 font-mono self-start sm:self-auto"
            >
              <Plus className="h-3 w-3" />
              <span>ADD SLOT</span>
            </Button>
          </div>

          {/* Day Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setReviewFilterDay("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium cursor-pointer transition-all border ${
                reviewFilterDay === "all"
                  ? "bg-zinc-800 text-white border-zinc-700 shadow-xs"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-white border-zinc-800"
              }`}
            >
              ALL DAYS ({detectedClasses.length})
            </button>
            {DAYS.map((d) => {
              const count = detectedClasses.filter((s) => s.dayOfWeek === d.id).length;
              const isSelected = reviewFilterDay === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setReviewFilterDay(d.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium cursor-pointer transition-all whitespace-nowrap border ${
                    isSelected
                      ? "bg-zinc-800 text-white border-zinc-700 shadow-xs"
                      : "bg-zinc-900/60 text-zinc-400 hover:text-white border-zinc-800"
                  }`}
                >
                  <span className="uppercase">{d.short}</span>
                  {count > 0 && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected ? "bg-zinc-700 text-white" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Editable Slots Table */}
          <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
            {filteredSlots.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-800 bg-[#090910]/40 text-center">
                <p className="text-xs text-slate-400">No classes found for this day.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddSlot}
                  className="mt-3 text-xs border-slate-800 text-slate-200 cursor-pointer"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Slot
                </Button>
              </div>
            ) : (
              filteredSlots.map((slot) => {
                const originalIndex = detectedClasses.indexOf(slot);
                return (
                  <div
                    key={originalIndex}
                    className="p-3.5 rounded-xl border border-slate-800/80 bg-[#0b0b12] hover:border-slate-700/80 transition-all space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      {/* Color & Day Selector */}
                      <div className="sm:col-span-3 flex items-center gap-2">
                        {/* Color Selector */}
                        <div className="relative group shrink-0">
                          <span
                            className="w-4 h-4 rounded-full inline-block cursor-pointer ring-2 ring-white/20"
                            style={{ backgroundColor: slot.color }}
                          />
                        </div>

                        {/* Day Selector */}
                        <select
                          value={slot.dayOfWeek}
                          onChange={(e) =>
                            handleUpdateSlot(
                              originalIndex,
                              "dayOfWeek",
                              parseInt(e.target.value, 10)
                            )
                          }
                          className="h-8 rounded-lg border border-slate-800 bg-slate-950/70 px-2 text-xs text-white font-medium cursor-pointer"
                        >
                          {DAYS.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.short}
                            </option>
                          ))}
                        </select>

                        {/* Type Selector */}
                        <select
                          value={slot.type}
                          onChange={(e) =>
                            handleUpdateSlot(originalIndex, "type", e.target.value)
                          }
                          className="h-8 rounded-lg border border-slate-800 bg-slate-950/70 px-2 text-[11px] text-slate-300 font-medium cursor-pointer"
                        >
                          <option value="Lecture">Lecture</option>
                          <option value="Lab">Lab</option>
                          <option value="Tutorial">Tutorial</option>
                          <option value="Seminar">Seminar</option>
                        </select>
                      </div>

                      {/* Course Subject & Code */}
                      <div className="sm:col-span-5 flex items-center gap-2">
                        <Input
                          placeholder="Subject Name"
                          value={slot.subject}
                          onChange={(e) =>
                            handleUpdateSlot(originalIndex, "subject", e.target.value)
                          }
                          className="h-8 border-slate-800 bg-slate-950/60 text-xs text-white font-semibold"
                        />
                        <Input
                          placeholder="Code"
                          value={slot.code || ""}
                          onChange={(e) =>
                            handleUpdateSlot(originalIndex, "code", e.target.value)
                          }
                          className="h-8 w-20 shrink-0 border-slate-800 bg-slate-950/60 text-[11px] text-indigo-300 font-mono"
                        />
                      </div>

                      {/* Time Range */}
                      <div className="sm:col-span-3 flex items-center gap-1">
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            handleUpdateSlot(originalIndex, "startTime", e.target.value)
                          }
                          className="h-8 border-slate-800 bg-slate-950/60 text-[11px] text-slate-200 px-1.5"
                        />
                        <span className="text-slate-500 text-xs">-</span>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) =>
                            handleUpdateSlot(originalIndex, "endTime", e.target.value)
                          }
                          className="h-8 border-slate-800 bg-slate-950/60 text-[11px] text-slate-200 px-1.5"
                        />
                      </div>

                      {/* Delete Slot Button */}
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(originalIndex)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
                          title="Delete slot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Room & Instructor Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-purple-400 shrink-0" />
                        <Input
                          placeholder="Room / Hall (e.g. Hall 302)"
                          value={slot.room || ""}
                          onChange={(e) =>
                            handleUpdateSlot(originalIndex, "room", e.target.value)
                          }
                          className="h-7 border-slate-800 bg-slate-950/40 text-[11px] text-slate-300 placeholder:text-slate-600"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-pink-400 shrink-0" />
                        <Input
                          placeholder="Instructor / Professor"
                          value={slot.instructor || ""}
                          onChange={(e) =>
                            handleUpdateSlot(
                              originalIndex,
                              "instructor",
                              e.target.value
                            )
                          }
                          className="h-7 border-slate-800 bg-slate-950/40 text-[11px] text-slate-300 placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Import Settings & Options */}
          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 space-y-2.5">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="font-medium text-white">
                Replace existing weekly timetable
              </span>
              <span className="text-[11px] text-slate-400">
                (Clears previously saved classes to prevent duplicates)
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={syncAttendance}
                onChange={(e) => setSyncAttendance(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="font-medium text-white">
                Sync subjects with Attendance Tracker
              </span>
              <span className="text-[11px] text-indigo-300">
                (Automatically creates subject entries in Attendance with 75% target)
              </span>
            </label>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep("upload")}
              className="border-slate-800 text-xs text-slate-300 cursor-pointer"
              disabled={isImporting}
            >
              Back to Upload
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleModalClose}
                className="border-slate-800 text-xs text-slate-300 cursor-pointer"
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={handleConfirmImport}
                disabled={isImporting || detectedClasses.length === 0}
                className="gap-1.5 font-mono"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>IMPORTING...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>APPLY TO TIMETABLE ({detectedClasses.length})</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
