import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all attendance subjects with computed stats
 */
export const getSubjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const subjects = await ctx.db
      .query("attendanceSubjects")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return subjects.map((sub) => {
      const percentage = sub.total > 0 ? (sub.attended / sub.total) * 100 : 100;
      const target = sub.minTargetPercentage || 75;

      // Safe bunks calculation:
      // How many classes can I miss before falling below target%?
      // (attended) / (total + x) >= target/100  =>  attended / (target/100) >= total + x
      // x = Math.floor(attended / (target / 100) - total)
      let safeBunks = 0;
      let requiredClasses = 0;

      if (percentage >= target) {
        safeBunks = Math.max(0, Math.floor(sub.attended / (target / 100) - sub.total));
      } else {
        // Classes needed to reach target%:
        // (attended + y) / (total + y) >= target/100
        // attended + y >= (target/100)*total + (target/100)*y
        // y * (1 - target/100) >= (target/100)*total - attended
        // y = Math.ceil(((target/100)*total - attended) / (1 - target/100))
        const num = (target / 100) * sub.total - sub.attended;
        const den = 1 - target / 100;
        requiredClasses = Math.max(0, Math.ceil(num / den));
      }

      return {
        ...sub,
        percentage: Math.round(percentage * 10) / 10,
        safeBunks,
        requiredClasses,
        isSafe: percentage >= target,
      };
    });
  },
});

/**
 * Get overall attendance summary
 */
export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { totalAttended: 0, totalClasses: 0, overallPercentage: 0, subjectCount: 0 };
    }

    const subjects = await ctx.db
      .query("attendanceSubjects")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    let totalAttended = 0;
    let totalClasses = 0;

    for (const sub of subjects) {
      totalAttended += sub.attended;
      totalClasses += sub.total;
    }

    const overallPercentage =
      totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 1000) / 10 : 100;

    return {
      totalAttended,
      totalClasses,
      overallPercentage,
      subjectCount: subjects.length,
    };
  },
});

/**
 * Add a new attendance subject
 */
export const addSubject = mutation({
  args: {
    name: v.string(),
    code: v.optional(v.string()),
    attended: v.number(),
    total: v.number(),
    minTargetPercentage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("attendanceSubjects", {
      userId: identity.subject,
      name: args.name,
      code: args.code,
      attended: Math.max(0, args.attended),
      total: Math.max(args.attended, args.total),
      minTargetPercentage: args.minTargetPercentage || 75,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark class attendance (+1 present or +1 absent)
 */
export const markAttendance = mutation({
  args: {
    id: v.id("attendanceSubjects"),
    present: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const subject = await ctx.db.get(args.id);
    if (!subject || subject.userId !== identity.subject) {
      throw new Error("Subject not found or unauthorized");
    }

    const newAttended = args.present ? subject.attended + 1 : subject.attended;
    const newTotal = subject.total + 1;

    await ctx.db.patch(args.id, {
      attended: newAttended,
      total: newTotal,
      updatedAt: Date.now(),
    });

    return { success: true, attended: newAttended, total: newTotal };
  },
});

/**
 * Delete attendance subject
 */
export const deleteSubject = mutation({
  args: { id: v.id("attendanceSubjects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const subject = await ctx.db.get(args.id);
    if (!subject || subject.userId !== identity.subject) {
      throw new Error("Subject not found or unauthorized");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Update / recalibrate attendance subject
 */
export const updateSubject = mutation({
  args: {
    id: v.id("attendanceSubjects"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    attended: v.optional(v.number()),
    total: v.optional(v.number()),
    minTargetPercentage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const subject = await ctx.db.get(args.id);
    if (!subject || subject.userId !== identity.subject) {
      throw new Error("Subject not found or unauthorized");
    }

    const patch: {
      updatedAt: number;
      name?: string;
      code?: string;
      attended?: number;
      total?: number;
      minTargetPercentage?: number;
    } = { updatedAt: Date.now() };

    if (args.name !== undefined) patch.name = args.name;
    if (args.code !== undefined) patch.code = args.code;
    if (args.attended !== undefined) patch.attended = Math.max(0, args.attended);
    if (args.total !== undefined) patch.total = Math.max(0, args.total);
    if (args.minTargetPercentage !== undefined) patch.minTargetPercentage = args.minTargetPercentage;

    await ctx.db.patch(args.id, patch);
    return { success: true };
  },
});

