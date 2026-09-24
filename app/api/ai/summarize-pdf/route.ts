import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

export const maxDuration = 60; // Allow sufficient execution time for large files

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    let extractedText = "";
    let style = "cheat-sheet";
    let customPrompt = "";
    let fileName = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      style = (formData.get("style") as string) || "cheat-sheet";
      customPrompt = (formData.get("customPrompt") as string) || "";

      if (!file) {
        return NextResponse.json(
          { error: "No file was uploaded." },
          { status: 400 }
        );
      }

      fileName = file.name;
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);
          const pdfResult = await extractText(uint8);
          extractedText = Array.isArray(pdfResult.text)
            ? pdfResult.text.join("\n\n")
            : pdfResult.text;
        } catch (pdfErr: unknown) {
          const message =
            pdfErr instanceof Error ? pdfErr.message : "PDF extraction failed";
          return NextResponse.json(
            {
              error: `Failed to read PDF text: ${message}. Make sure the file contains extractable text and is not encrypted.`,
            },
            { status: 400 }
          );
        }
      } else {
        // Plain text, markdown, or doc text
        extractedText = await file.text();
      }
    } else {
      // JSON body
      const body = await req.json();
      extractedText = body.text || "";
      style = body.style || "cheat-sheet";
      customPrompt = body.customPrompt || "";
      fileName = body.fileName || "Pasted Notes";
    }

    // Clean and validate text
    const cleanText = extractedText.replace(/\r\n/g, "\n").trim();
    if (cleanText.length < 25) {
      return NextResponse.json(
        {
          error:
            "Could not find sufficient readable text in the document (under 25 characters). If your PDF consists of scanned raster images, please provide a text-based PDF or paste your notes directly.",
        },
        { status: 400 }
      );
    }

    // Cap text to ~30,000 characters for token efficiency and ultra-fast generation
    const truncatedText =
      cleanText.length > 30000
        ? cleanText.slice(0, 30000) + "\n\n[... Remaining content truncated for optimal generation ...]"
        : cleanText;

    // Style instruction
    let styleInstruction = "";
    if (style === "cheat-sheet") {
      styleInstruction =
        "Style: High-Yield Exam Cheat Sheet. Focus heavily on must-know definitions, formulas, essential equations, critical test traps, comparison matrices, and quick recall memory anchors.";
    } else if (style === "summary") {
      styleInstruction =
        "Style: Executive Summary. Focus on high-level conceptual clarity, 2-3 sentence intuition, and punchy bulleted takeaways.";
    } else {
      styleInstruction =
        "Style: In-Depth Comprehensive Lecture Notes. Provide thorough breakdowns, detailed conceptual explanations, step-by-step logic, and real-world examples.";
    }

    const systemPrompt = `You are an elite academic tutor and note-synthesizing specialist (like ChatGPT).
Your task is to transform raw lecture slides, textbooks, or course syllabus text into exceptionally structured, high-yield study notes.

${styleInstruction}
${customPrompt ? `Additional student instruction: ${customPrompt}` : ""}

Formatting rules:
- Format the 'content' field in clean, engaging Markdown.
- Use bold text for key terms.
- Use bullet points, numbered lists, or sub-bullets for scannability.
- Include dedicated sections in 'content':
  - ## 📌 Core Concepts & Definitions
  - ## ⚡ Key Principles & Formulas (include equations or step-by-step rules)
  - ## 🎯 High-Yield Exam Pitfalls & Test Traps (what professors love to test, common mistakes)
  - ## 💡 Real-World Mental Model / Analogy (intuitive explanation)
- Provide 3 to 5 high-yield flashcards in the 'flashcards' array to help the student test their recall immediately.

You MUST reply ONLY with a valid JSON object matching this structure:
{
  "title": "Engaging & Informative Topic Title",
  "subject": "Inferred Academic Subject (e.g. Computer Science, Physics, Economics, Organic Chemistry, etc.)",
  "summary": "A concise 2-3 sentence executive summary explaining the fundamental concept.",
  "content": "Rich markdown notes according to the guidelines above.",
  "tags": ["Topic1", "Topic2", "Topic3"],
  "flashcards": [
    { "front": "Concise, high-yield question testing a core concept", "back": "Clear, precise answer" }
  ]
}`;

    // Call Groq API with fallback
    const modelsToTry = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];
    let lastError = "";
    let completionData: unknown = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              response_format: { type: "json_object" },
              temperature: 0.3,
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: `Document Name: ${fileName || "Course Document"}\n\nDocument Text:\n${truncatedText}`,
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          const errBody = await response.text();
          lastError = `Model ${model} returned ${response.status}: ${errBody}`;
          continue;
        }

        const resJson = await response.json();
        const rawMessage = resJson.choices?.[0]?.message?.content;
        if (rawMessage) {
          completionData = JSON.parse(rawMessage);
          break;
        }
      } catch (err: unknown) {
        const anyErr = err as { message?: string; cause?: unknown };
        const causeMsg = anyErr.cause ? JSON.stringify(anyErr.cause) : "";
        lastError = `Fetch failed: ${anyErr.message || String(err)} - Cause: ${causeMsg}`;
        console.error("Groq fetch failure:", err, anyErr.cause);
      }
    }

    if (!completionData) {
      return NextResponse.json(
        {
          error: `Groq AI generation failed: ${lastError || "Could not parse response"}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: completionData,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
