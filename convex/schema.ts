import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    provider: v.string(), // "password" | "google"
    createdAt: v.number(),
    updatedAt: v.number(),
    onboardingCompleted: v.boolean(),
    theme: v.string(), // "light" | "dark" | "system"
    authUserId: v.string(), // Links to Better Auth's internal user ID
    college: v.optional(v.string()),
    major: v.optional(v.string()),
    semester: v.optional(v.string()),
    rollNo: v.optional(v.string()),
    targetAttendance: v.optional(v.number()), // e.g. 75
    currency: v.optional(v.string()), // e.g. "$" or "₹"
  })
    .index("by_email", ["email"])
    .index("by_authUserId", ["authUserId"]),

  // Weekly recurring class schedule
  timetable: defineTable({
    userId: v.string(),
    dayOfWeek: v.number(), // 1 (Mon) - 7 (Sun)
    subject: v.string(),
    code: v.optional(v.string()),
    room: v.optional(v.string()),
    instructor: v.optional(v.string()),
    startTime: v.string(), // "09:00"
    endTime: v.string(), // "10:30"
    color: v.string(), // CSS color or hex
    type: v.string(), // "Lecture" | "Lab" | "Tutorial" | "Seminar"
  }).index("by_user", ["userId"]),

  // Calendar events, exams, assignments, and deadlines
  events: defineTable({
    userId: v.string(),
    title: v.string(),
    type: v.string(), // "assignment" | "exam" | "project" | "general"
    date: v.string(), // "YYYY-MM-DD"
    time: v.optional(v.string()),
    completed: v.boolean(),
    priority: v.string(), // "low" | "medium" | "high"
    subject: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  // Subject-wise attendance tracking
  attendanceSubjects: defineTable({
    userId: v.string(),
    name: v.string(),
    code: v.optional(v.string()),
    attended: v.number(),
    total: v.number(),
    minTargetPercentage: v.number(), // default 75
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Focus and study sessions
  studySessions: defineTable({
    userId: v.string(),
    subject: v.optional(v.string()),
    durationMinutes: v.number(),
    mode: v.string(), // "pomodoro" | "deepwork" | "review"
    completedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Study notes
  studyNotes: defineTable({
    userId: v.string(),
    title: v.string(),
    subject: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Flashcards
  flashcards: defineTable({
    userId: v.string(),
    deck: v.string(),
    front: v.string(),
    back: v.string(),
    mastered: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Monthly budgets
  budgets: defineTable({
    userId: v.string(),
    month: v.string(), // "YYYY-MM"
    monthlyLimit: v.number(),
  }).index("by_user_month", ["userId", "month"]),

  // Expense records
  expenses: defineTable({
    userId: v.string(),
    title: v.string(),
    amount: v.number(),
    category: v.string(), // "food" | "transport" | "books" | "leisure" | "bills" | "other"
    date: v.string(), // "YYYY-MM-DD"
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
