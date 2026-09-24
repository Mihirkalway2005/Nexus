"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HardwareCard } from "@/components/ui/hardware-card";
import { playHardwareClick } from "@/lib/audio-feedback";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { AiTimetableModal } from "@/components/calendar/ai-timetable-modal";

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
  { name: "Indigo", hex: "#6366f1" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Cyan", hex: "#06b6d4" },
];

export default function CalendarPage() {
  // Current day of week (1 = Mon ... 7 = Sun)
  const currentDayIndex = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(currentDayIndex);

  // Modals
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isAiScanOpen, setIsAiScanOpen] = useState(false);

  // Queries & Mutations
  const timetable = useQuery(api.timetable.getWeeklyTimetable) || [];
  const events = useQuery(api.events.getEvents) || [];
  const addClassSlotMutation = useMutation(api.timetable.addClassSlot);
  const deleteClassSlotMutation = useMutation(api.timetable.deleteClassSlot);
  const createEventMutation = useMutation(api.events.createEvent);
  const toggleEventMutation = useMutation(api.events.toggleEventCompleted);
  const deleteEventMutation = useMutation(api.events.deleteEvent);

  // Class Form State
  const [classSubject, setClassSubject] = useState("");
  const [classCode, setClassCode] = useState("");
  const [classRoom, setClassRoom] = useState("");
  const [classInstructor, setClassInstructor] = useState("");
  const [classStartTime, setClassStartTime] = useState("09:00");
  const [classEndTime, setClassEndTime] = useState("10:30");
  const [classType, setClassType] = useState("Lecture");
  const [classColor, setClassColor] = useState("#6366f1");

  // Event Form State
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("assignment");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [eventTime, setEventTime] = useState("23:59");
  const [eventPriority, setEventPriority] = useState("medium");
  const [eventSubject, setEventSubject] = useState("");
  const [eventNotes, setEventNotes] = useState("");

  // Filter classes for selected day
  const dayClasses = timetable
    .filter((slot) => slot.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classSubject) return;

    await addClassSlotMutation({
      dayOfWeek: selectedDay,
      subject: classSubject,
      code: classCode || undefined,
      room: classRoom || undefined,
      instructor: classInstructor || undefined,
      startTime: classStartTime,
      endTime: classEndTime,
      color: classColor,
      type: classType,
    });

    setClassSubject("");
    setClassCode("");
    setClassRoom("");
    setClassInstructor("");
    setIsAddClassOpen(false);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate) return;

    await createEventMutation({
      title: eventTitle,
      type: eventType,
      date: eventDate,
      time: eventTime || undefined,
      priority: eventPriority,
      subject: eventSubject || undefined,
      notes: eventNotes || undefined,
    });

    setEventTitle("");
    setEventSubject("");
    setEventNotes("");
    setIsAddEventOpen(false);
  };

  return (
    <AppShell
      pageTitle="Timetable & Calendar"
      pageDescription="Manage weekly class schedules, lecture rooms, assignment deadlines, and exam dates."
      headerAction={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => setIsAddClassOpen(true)}
            className="gap-1.5 font-mono"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ADD CLASS SLOT</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAiScanOpen(true)}
            className="gap-1.5 font-mono"
          >
            <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
            <span>AI SCAN TIMETABLE</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddEventOpen(true)}
            className="gap-1.5 font-mono"
          >
            <CalendarIcon className="h-3.5 w-3.5 text-zinc-400" />
            <span>ADD DEADLINE</span>
          </Button>
        </div>
      }
    >
      {/* AI Timetable Promotion Banner when schedule is empty */}
      {timetable.length === 0 && (
        <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-[#0c0c0e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-200 uppercase font-mono flex items-center gap-2">
                College Timetable Photo or PDF?
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                  AI OCR
                </span>
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Upload a photo or screenshot of your class schedule. Groq Vision AI parses subjects, timings, faculty, and room codes automatically.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={() => setIsAiScanOpen(true)}
            className="gap-2 shrink-0 font-mono"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>SCAN TIMETABLE</span>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Weekly Timetable */}
        <div className="lg:col-span-2 space-y-4">
          {/* Day Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {DAYS.map((day) => {
              const isSelected = selectedDay === day.id;
              const isToday = currentDayIndex === day.id;
              const count = timetable.filter((s) => s.dayOfWeek === day.id).length;

              return (
                <button
                  key={day.id}
                  onClick={() => {
                    playHardwareClick(800 + day.id * 40);
                    setSelectedDay(day.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-zinc-800 text-white border-zinc-700 shadow-sm"
                      : "bg-[#0c0c0e] border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <span className="uppercase">{day.name}</span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  )}
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

          {/* Day Schedule Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
              <h2 className="text-xs font-bold text-zinc-200 uppercase font-mono tracking-wider flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
                // {DAYS.find((d) => d.id === selectedDay)?.name}&apos;s Telemetry
              </h2>
              <span className="font-mono text-[11px] text-zinc-500">
                {dayClasses.length} {dayClasses.length === 1 ? "SESSION" : "SESSIONS"} LOGGED
              </span>
            </div>

            {dayClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 rounded-xl border border-zinc-800/80 bg-[#0c0c0e] text-center">
                <div className="h-9 w-9 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-2.5">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase">No Classes on {DAYS.find((d) => d.id === selectedDay)?.name}</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Free day detected. Add class slots manually or scan an official timetable image.
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="default"
                    indicator="emerald"
                    onClick={() => setIsAddClassOpen(true)}
                    className="font-mono gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>ADD SLOT</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAiScanOpen(true)}
                    className="font-mono gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI SCAN</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {dayClasses.map((item, index) => (
                  <HardwareCard
                    key={item._id}
                    refId={`SLOT-${(index + 1).toString().padStart(2, "0")}`}
                    title={item.subject}
                    badge={item.type.toUpperCase()}
                    badgeVariant="zinc"
                    action={
                      <button
                        onClick={() => deleteClassSlotMutation({ id: item._id })}
                        className="p-1 rounded text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove class"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    }
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-1 self-stretch rounded-full shrink-0"
                        style={{ backgroundColor: item.color || "#71717a" }}
                      />

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.code && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 font-semibold border border-zinc-800">
                              {item.code}
                            </span>
                          )}
                          <span className="font-mono text-xs text-zinc-300 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            {item.startTime} - {item.endTime}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-zinc-500">
                          {item.room && (
                            <span className="flex items-center gap-1 text-zinc-400">
                              <MapPin className="h-3 w-3" />
                              ROOM {item.room}
                            </span>
                          )}

                          {item.instructor && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              FACULTY: {item.instructor.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </HardwareCard>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Assignments, Exams & Deadlines in Hardware Card */}
        <div className="space-y-4">
          <HardwareCard
            refId="NX-DEADLINES"
            label="DEADLINES & MILESTONES"
            badge={`${events.filter((e) => !e.completed).length} PENDING`}
            badgeVariant="amber"
          >
            <div className="space-y-2.5">
              {events.length === 0 ? (
                <div className="p-8 rounded-lg border border-zinc-800/80 bg-[#08080b] text-center">
                  <p className="font-mono text-xs text-zinc-500">No deadlines or exams scheduled.</p>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setIsAddEventOpen(true)}
                    className="mt-3 font-mono"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    ADD ASSIGNMENT
                  </Button>
                </div>
              ) : (
                events.map((event) => {
                  const isOverdue =
                    !event.completed &&
                    event.date < new Date().toISOString().split("T")[0];

                  return (
                    <div
                      key={event._id}
                      className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                        event.completed
                          ? "border-zinc-800/40 bg-zinc-950/30 opacity-50"
                          : isOverdue
                          ? "border-rose-900/60 bg-rose-950/20"
                          : "border-zinc-800/80 bg-[#08080b]"
                      }`}
                    >
                      <button
                        onClick={() => toggleEventMutation({ id: event._id })}
                        className="mt-0.5 text-zinc-500 hover:text-zinc-200 cursor-pointer transition-colors"
                      >
                        {event.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-semibold truncate uppercase ${
                              event.completed ? "line-through text-zinc-500" : "text-zinc-200"
                            }`}
                          >
                            {event.title}
                          </span>

                          <span
                            className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.2 rounded border ${
                              event.priority === "high"
                                ? "bg-rose-950/40 text-rose-300 border-rose-900/60"
                                : event.priority === "medium"
                                ? "bg-amber-950/40 text-amber-300 border-amber-900/60"
                                : "bg-zinc-900 text-zinc-400 border-zinc-800"
                            }`}
                          >
                            {event.priority}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                          <span className="uppercase">{event.type}</span>
                          <span>•</span>
                          <span className={isOverdue ? "text-rose-400 font-semibold" : ""}>
                            {event.date} {event.time && `@ ${event.time}`}
                          </span>
                        </div>

                        {event.subject && (
                          <span className="inline-block font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 mt-1">
                            {event.subject.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => deleteEventMutation({ id: event._id })}
                        className="text-zinc-600 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </HardwareCard>
        </div>
      </div>

      {/* Modal: Add Class Slot */}
      <Modal
        isOpen={isAddClassOpen}
        onClose={() => setIsAddClassOpen(false)}
        title={`Add Class for ${DAYS.find((d) => d.id === selectedDay)?.name}`}
        description="Configure your recurring weekly timetable schedule."
      >
        <form onSubmit={handleAddClass} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs text-slate-300">
              Course / Subject Name *
            </Label>
            <Input
              id="subject"
              placeholder="e.g. Data Structures & Algorithms"
              value={classSubject}
              onChange={(e) => setClassSubject(e.target.value)}
              required
              className="border-slate-800 bg-slate-950/60 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs text-slate-300">
                Course Code
              </Label>
              <Input
                id="code"
                placeholder="CS-201"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                className="border-slate-800 bg-slate-950/60 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room" className="text-xs text-slate-300">
                Room / Lab
              </Label>
              <Input
                id="room"
                placeholder="Hall 302"
                value={classRoom}
                onChange={(e) => setClassRoom(e.target.value)}
                className="border-slate-800 bg-slate-950/60 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startTime" className="text-xs text-slate-300">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={classStartTime}
                onChange={(e) => setClassStartTime(e.target.value)}
                className="border-slate-800 bg-slate-950/60 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime" className="text-xs text-slate-300">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={classEndTime}
                onChange={(e) => setClassEndTime(e.target.value)}
                className="border-slate-800 bg-slate-950/60 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="instructor" className="text-xs text-slate-300">
                Professor / Instructor
              </Label>
              <Input
                id="instructor"
                placeholder="Dr. Alan Turing"
                value={classInstructor}
                onChange={(e) => setClassInstructor(e.target.value)}
                className="border-slate-800 bg-slate-950/60 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Class Type</Label>
              <select
                value={classType}
                onChange={(e) => setClassType(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-800 bg-slate-950/60 px-3 text-xs text-white"
              >
                <option value="Lecture">Lecture</option>
                <option value="Lab">Lab</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Seminar">Seminar</option>
              </select>
            </div>
          </div>

          {/* Color Presets */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Color Label</Label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => setClassColor(c.hex)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    classColor === c.hex ? "scale-110 ring-2 ring-white" : "opacity-80"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddClassOpen(false)}
              className="border-slate-800 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
            >
              Save Class Slot
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Deadline / Exam */}
      <Modal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        title="Add Deadline / Exam / Event"
        description="Keep track of upcoming homework, midterms, and project submissions."
      >
        <form onSubmit={handleAddEvent} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="eventTitle" className="text-xs text-slate-300">
              Title *
            </Label>
            <Input
              id="eventTitle"
              placeholder="e.g. Midterm Examination 1"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              required
              className="border-slate-800 bg-slate-950/60 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Event Type</Label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-800 bg-slate-950/60 px-3 text-xs text-white"
              >
                <option value="assignment">Assignment</option>
                <option value="exam">Exam</option>
                <option value="project">Project</option>
                <option value="general">General Deadline</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Priority</Label>
              <select
                value={eventPriority}
                onChange={(e) => setEventPriority(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-800 bg-slate-950/60 px-3 text-xs text-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High (Urgent)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eventDate" className="text-xs text-slate-300">
                Due Date *
              </Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="border-slate-800 bg-slate-950/60 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eventTime" className="text-xs text-slate-300">
                Due Time
              </Label>
              <Input
                id="eventTime"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="border-slate-800 bg-slate-950/60 text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eventSubject" className="text-xs text-slate-300">
              Associated Course (Optional)
            </Label>
            <Input
              id="eventSubject"
              placeholder="e.g. Physics II"
              value={eventSubject}
              onChange={(e) => setEventSubject(e.target.value)}
              className="border-slate-800 bg-slate-950/60 text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddEventOpen(false)}
              className="border-slate-800 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
            >
              Save Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: AI Timetable Photo & Document Scanner */}
      <AiTimetableModal
        isOpen={isAiScanOpen}
        onClose={() => setIsAiScanOpen(false)}
      />
    </AppShell>
  );
}
