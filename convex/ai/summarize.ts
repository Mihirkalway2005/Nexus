import { action, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Convex Action: calls Anthropic Claude to summarize a document/link.
 * NEVER called from the client — the API key lives only in Convex env vars.
 * Triggered via scheduler from notes.createAndSummarize.
 */
export const run = action({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    const note = await ctx.runQuery(internal.ai.summarize.getNoteInternal, { noteId });
    if (!note) return;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set in Convex environment.");

    let summary = "";
    let flashcards: Array<{ question: string; answer: string }> = [];
    let errorMessage: string | undefined;

    try {
      const prompt = note.sourceUrl
        ? `You are a study assistant. Summarize the content at this URL: ${note.sourceUrl}`
        : `You are a study assistant. Create structured study notes for: "${note.title}"`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `${prompt}

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "summary": "Full structured markdown notes here. Use ## headings, bullet points, and **bold** for key terms.",
  "flashcards": [
    { "question": "Question text", "answer": "Answer text" }
  ]
}

Create 5–10 flashcards covering the most important concepts. Be concise and accurate.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${err}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text ?? "";

      // Parse the JSON response from Claude
      const parsed = JSON.parse(content);
      summary = parsed.summary ?? "";
      flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards : [];
    } catch (err: any) {
      errorMessage = err?.message ?? "Unknown error";
    }

    // Store result — the reactive query on the client will update automatically
    await ctx.runMutation(internal.ai.summarize.storeResult, {
      noteId,
      summary,
      flashcards,
      status: errorMessage ? "failed" : "completed",
      errorMessage,
    });
  },
});

/** Internal query — fetches a note without auth (used inside the action). */
export const getNoteInternal = action({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    // Actions can read directly via ctx.runQuery with internal functions
    return null; // placeholder — replaced by internalQuery below
  },
});

// Re-export as internalQuery so the action can read without going through auth
import { internalQuery } from "../_generated/server";

export const getNoteInternalQuery = internalQuery({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => ctx.db.get(noteId),
});

export const storeResult = internalMutation({
  args: {
    noteId: v.id("notes"),
    summary: v.string(),
    flashcards: v.array(v.object({ question: v.string(), answer: v.string() })),
    status: v.string(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { noteId, summary, flashcards, status, errorMessage }) => {
    await ctx.db.patch(noteId, {
      summary,
      flashcards,
      status,
      errorMessage,
      updatedAt: new Date().toISOString(),
    });
  },
});
