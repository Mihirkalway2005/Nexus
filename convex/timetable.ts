import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the current user's weekly timetable
 */
export const getWeeklyTimetable = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("timetable")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

/**
 * Get classes for a specific day (1 = Mon ... 7 = Sun)
 */
export const getDayClasses = query({
  args: { dayOfWeek: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const slots = await ctx.db
      .query("timetable")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("dayOfWeek"), args.dayOfWeek))
      .collect();

    // Sort by startTime
    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  },
});

/**
 * Add a new class slot to the timetable
 */
export const addClassSlot = mutation({
  args: {
    dayOfWeek: v.number(),
    subject: v.string(),
    code: v.optional(v.string()),
    room: v.optional(v.string()),
    instructor: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    color: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("timetable", {
      userId: identity.subject,
      dayOfWeek: args.dayOfWeek,
      subject: args.subject,
      code: args.code,
      room: args.room,
      instructor: args.instructor,
      startTime: args.startTime,
      endTime: args.endTime,
      color: args.color,
      type: args.type,
    });
  },
});

/**
 * Delete a class slot
 */
export const deleteClassSlot = mutation({
  args: { id: v.id("timetable") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const slot = await ctx.db.get(args.id);
    if (!slot || slot.userId !== identity.subject) {
      throw new Error("Class slot not found or unauthorized");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Update an existing class slot
 */
export const updateClassSlot = mutation({
  args: {
    id: v.id("timetable"),
    dayOfWeek: v.number(),
    subject: v.string(),
    code: v.optional(v.string()),
    room: v.optional(v.string()),
    instructor: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    color: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const slot = await ctx.db.get(args.id);
    if (!slot || slot.userId !== identity.subject) {
      throw new Error("Class slot not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      dayOfWeek: args.dayOfWeek,
      subject: args.subject,
      code: args.code,
      room: args.room,
      instructor: args.instructor,
      startTime: args.startTime,
      endTime: args.endTime,
      color: args.color,
      type: args.type,
    });

    return { success: true };
  },
});

/**
 * Clear the entire timetable for the user
 */
export const clearTimetable = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const slots = await ctx.db
      .query("timetable")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    for (const slot of slots) {
      await ctx.db.delete(slot._id);
    }

    return { success: true, count: slots.length };
  },
});

/**
 * Batch import slots (e.g. from AI Timetable photo/document scan)
 */
export const importTimetableBatch = mutation({
  args: {
    slots: v.array(
      v.object({
        dayOfWeek: v.number(),
        subject: v.string(),
        code: v.optional(v.string()),
        room: v.optional(v.string()),
        instructor: v.optional(v.string()),
        startTime: v.string(),
        endTime: v.string(),
        color: v.string(),
        type: v.string(),
      })
    ),
    replaceExisting: v.boolean(),
    syncAttendance: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // 1. If replaceExisting, delete previous timetable entries
    if (args.replaceExisting) {
      const existingSlots = await ctx.db
        .query("timetable")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .collect();

      for (const slot of existingSlots) {
        await ctx.db.delete(slot._id);
      }
    }

    // 2. Insert new timetable slots
    const insertedIds = [];
    for (const slot of args.slots) {
      const id = await ctx.db.insert("timetable", {
        userId: identity.subject,
        dayOfWeek: slot.dayOfWeek,
        subject: slot.subject,
        code: slot.code,
        room: slot.room,
        instructor: slot.instructor,
        startTime: slot.startTime,
        endTime: slot.endTime,
        color: slot.color,
        type: slot.type,
      });
      insertedIds.push(id);
    }

    // 3. Optional: Synchronize detected subjects into Attendance Tracker
    let syncedSubjectsCount = 0;
    if (args.syncAttendance) {
      const existingAttendance = await ctx.db
        .query("attendanceSubjects")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .collect();

      const existingNames = new Set(
        existingAttendance.map((a) => a.name.trim().toLowerCase())
      );

      // Collect unique subjects
      const subjectMap = new Map<string, { name: string; code?: string }>();
      for (const slot of args.slots) {
        const key = slot.subject.trim().toLowerCase();
        if (key && !subjectMap.has(key)) {
          subjectMap.set(key, { name: slot.subject.trim(), code: slot.code });
        }
      }

      for (const [key, sub] of subjectMap.entries()) {
        if (!existingNames.has(key)) {
          await ctx.db.insert("attendanceSubjects", {
            userId: identity.subject,
            name: sub.name,
            code: sub.code,
            attended: 0,
            total: 0,
            minTargetPercentage: 75,
            updatedAt: Date.now(),
          });
          existingNames.add(key);
          syncedSubjectsCount++;
        }
      }
    }

    return {
      success: true,
      importedCount: insertedIds.length,
      syncedAttendanceCount: syncedSubjectsCount,
    };
  },
});
