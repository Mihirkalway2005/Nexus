import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

export const maxDuration = 60;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const PALETTE_COLORS = [
  "#6366f1", // Indigo
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#f43f5e", // Rose
];

const DAY_MAP: Record<string, number> = {
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
  sun: 7,
  sunday: 7,
};

interface RawClassSlot {
  dayOfWeek?: number | string;
  day?: number | string;
  subject?: string;
  title?: string;
  code?: string;
  room?: string;
  hall?: string;
  location?: string;
  instructor?: string;
  professor?: string;
  teacher?: string;
  startTime?: string;
  start?: string;
  endTime?: string;
  end?: string;
  type?: string;
  color?: string;
}

/**
 * Standardize time string into 24-hour "HH:MM"
 */
function normalizeTime(raw: string | undefined, defaultTime: string): string {
  if (!raw) return defaultTime;
  let str = raw.trim().toUpperCase();

  // Check 12-hour AM/PM
  const ampmMatch = str.match(/(\d{1,2})[:.]?(\d{2})?\s*(AM|PM)/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2] ? ampmMatch[2] : "00";
    const isPm = ampmMatch[3].toUpperCase() === "PM";

    if (isPm && hours < 12) hours += 12;
    if (!isPm && hours === 12) hours = 0;

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // Check standard HH:MM or H:MM or HH.MM
  const match24 = str.match(/(\d{1,2})[:.](\d{2})/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = match24[2];
    if (hours >= 0 && hours <= 23) {
      return `${String(hours).padStart(2, "0")}:${minutes}`;
    }
  }

  // Check solitary hour like "9" or "14"
  const matchHourOnly = str.match(/^(\d{1,2})$/);
  if (matchHourOnly) {
    const hours = parseInt(matchHourOnly[1], 10);
    if (hours >= 0 && hours <= 23) {
      return `${String(hours).padStart(2, "0")}:00`;
    }
  }

  return defaultTime;
}

/**
 * Map day identifier to 1 (Mon) - 7 (Sun)
 */
function normalizeDay(day: unknown): number {
  if (typeof day === "number" && day >= 1 && day <= 7) {
    return Math.round(day);
  }
  if (typeof day === "string") {
    const lower = day.trim().toLowerCase();
    if (DAY_MAP[lower]) return DAY_MAP[lower];
    const num = parseInt(lower, 10);
    if (!isNaN(num) && num >= 1 && num <= 7) return num;
  }
  return 1; // Default to Monday
}

/**
 * Clean JSON output from LLM (removing markdown backticks or think tags)
 */
function extractJson(text: string): unknown {
  let cleaned = text;

  // Remove <think> ... </think> reasoning tags if present
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Remove ```json ... ``` blocks
  if (cleaned.includes("```")) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }

  // Find first { and last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let isImage = false;
    let isPdf = false;
    let base64DataUri = "";
    let extractedText = "";
    let userInstructions = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      userInstructions = (formData.get("notes") as string) || "";

      if (!file) {
        return NextResponse.json(
          { error: "No timetable file was provided." },
          { status: 400 }
        );
      }

      const mime = file.type.toLowerCase();
      const name = file.name.toLowerCase();

      if (
        mime.startsWith("image/") ||
        name.endsWith(".png") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".webp") ||
        name.endsWith(".avif")
      ) {
        isImage = true;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const imageType = mime || (name.endsWith(".png") ? "image/png" : "image/jpeg");
        base64DataUri = `data:${imageType};base64,${buffer.toString("base64")}`;
      } else if (mime === "application/pdf" || name.endsWith(".pdf")) {
        isPdf = true;
        try {
          const arrayBuffer = await file.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);
          const pdfResult = await extractText(uint8);
          extractedText = Array.isArray(pdfResult.text)
            ? pdfResult.text.join("\n\n")
            : pdfResult.text;
        } catch (pdfErr) {
          return NextResponse.json(
            {
              error: `Failed to read PDF: ${pdfErr instanceof Error ? pdfErr.message : "Unknown error"}. Make sure it is not password protected.`,
            },
            { status: 400 }
          );
        }
      } else {
        // Plain text schedule
        extractedText = await file.text();
      }
    } else {
      // JSON body
      const body = await req.json();
      userInstructions = body.notes || "";
      if (body.imageData) {
        isImage = true;
        base64DataUri = body.imageData.startsWith("data:")
          ? body.imageData
          : `data:image/jpeg;base64,${body.imageData}`;
      } else if (body.text) {
        extractedText = body.text;
      }
    }

    const systemPrompt = `You are an elite academic timetable & university schedule parser.
Your task is to analyze the provided timetable (photo, screenshot, grid, or schedule document) and extract all recurring weekly class slots into structured JSON.

Rules:
1. Identify every individual class session across the week.
2. For dayOfWeek: use 1 for Monday, 2 for Tuesday, 3 for Wednesday, 4 for Thursday, 5 for Friday, 6 for Saturday, 7 for Sunday.
3. For startTime and endTime: use strict 24-hour "HH:MM" format (e.g., "09:00", "11:30", "14:15", "16:00"). If 12-hour AM/PM is shown, convert correctly to 24-hour.
4. For subject: give the canonical course name (e.g. "Operating Systems", "Microeconomics", "Calculus II").
5. For code: include course code if visible (e.g., "CS-204", "PHYS101"), otherwise empty string.
6. For room: room number or hall (e.g., "Hall B-302", "Lab 2", "LH-1"), otherwise empty string.
7. For instructor: faculty/professor name if visible, otherwise empty string.
8. For type: assign one of "Lecture", "Lab", "Tutorial", "Seminar".
9. Do not hallucinate classes that are not present. If a slot is lunch/break/free period, do NOT include it.
${userInstructions ? `Student specific request: ${userInstructions}` : ""}

You MUST return ONLY a valid JSON object matching this exact schema:
{
  "confidence": "high" | "medium" | "low",
  "detectedDays": ["Monday", "Tuesday", ...],
  "classes": [
    {
      "dayOfWeek": 1,
      "subject": "Data Structures",
      "code": "CS201",
      "room": "Room 401",
      "instructor": "Dr. Alan",
      "startTime": "09:00",
      "endTime": "10:30",
      "type": "Lecture"
    }
  ]
}`;

interface ParsedResponseData {
  confidence?: string;
  detectedDays?: string[];
  classes?: RawClassSlot[];
}

    let parsedResponse: ParsedResponseData | null = null;
    let lastError = "";

    if (isImage) {
      // Vision model pipeline using Groq
      const visionModels = ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b"];

      for (const model of visionModels) {
        try {
          const groqRes = await fetch(
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
                max_tokens: 1200,
                temperature: 0.1,
                messages: [
                  { role: "system", content: systemPrompt },
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: "Parse this timetable image and extract all classes, days, times, and lecture rooms into the required JSON format.",
                      },
                      {
                        type: "image_url",
                        image_url: { url: base64DataUri },
                      },
                    ],
                  },
                ],
              }),
            }
          );

          if (!groqRes.ok) {
            const errText = await groqRes.text();
            lastError = `Model ${model} returned ${groqRes.status}: ${errText}`;
            continue;
          }

          const resJson = await groqRes.json();
          const rawContent = resJson.choices?.[0]?.message?.content;
          if (rawContent) {
            const parsed = extractJson(rawContent) as ParsedResponseData;
            if (parsed && Array.isArray(parsed.classes)) {
              parsedResponse = parsed;
              break;
            }
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }
    } else {
      // PDF or Text parsing pipeline
      const cleanText = (extractedText || "").trim();
      if (cleanText.length < 25) {
        return NextResponse.json(
          {
            error:
              "Could not extract sufficient readable text from this document. If this PDF is a scanned photo, please export or take a screenshot and upload it as a PNG/JPG image so Groq Vision can read it directly!",
          },
          { status: 400 }
        );
      }

      const textModels = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"];
      for (const model of textModels) {
        try {
          const groqRes = await fetch(
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
                max_tokens: 1400,
                temperature: 0.2,
                messages: [
                  { role: "system", content: systemPrompt },
                  {
                    role: "user",
                    content: `Timetable Document Content:\n${cleanText.slice(0, 25000)}`,
                  },
                ],
              }),
            }
          );

          if (!groqRes.ok) {
            const errText = await groqRes.text();
            lastError = `Model ${model} returned ${groqRes.status}: ${errText}`;
            continue;
          }

          const resJson = await groqRes.json();
          const rawContent = resJson.choices?.[0]?.message?.content;
          if (rawContent) {
            const parsed = extractJson(rawContent) as ParsedResponseData;
            if (parsed && Array.isArray(parsed.classes)) {
              parsedResponse = parsed;
              break;
            }
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }
    }

    const detectedClasses: RawClassSlot[] =
      parsedResponse && Array.isArray(parsedResponse.classes)
        ? parsedResponse.classes
        : [];

    if (!parsedResponse || detectedClasses.length === 0) {
      return NextResponse.json(
        {
          error: `Could not parse timetable schedule: ${lastError || "No class entries detected. Please ensure the image is clear and contains a timetable."}`,
        },
        { status: 422 }
      );
    }

    // Color map to keep same subject with same color
    const subjectColorMap = new Map<string, string>();
    let colorIdx = 0;

    // Sanitize and format each class slot
    const sanitizedClasses = detectedClasses
      .map((item: RawClassSlot) => {
        const subject = (item.subject || item.title || "Academic Class").trim();
        if (!subject) return null;

        const subjectKey = subject.toLowerCase();
        if (!subjectColorMap.has(subjectKey)) {
          subjectColorMap.set(
            subjectKey,
            PALETTE_COLORS[colorIdx % PALETTE_COLORS.length]
          );
          colorIdx++;
        }

        const assignedColor = subjectColorMap.get(subjectKey) || "#6366f1";
        const dayOfWeek = normalizeDay(item.dayOfWeek ?? item.day);
        const startTime = normalizeTime(item.startTime ?? item.start, "09:00");
        const endTime = normalizeTime(item.endTime ?? item.end, "10:30");

        let type = (item.type || "Lecture").trim();
        const typeLower = type.toLowerCase();
        if (typeLower.includes("lab") || typeLower.includes("practical")) {
          type = "Lab";
        } else if (typeLower.includes("tut")) {
          type = "Tutorial";
        } else if (typeLower.includes("sem")) {
          type = "Seminar";
        } else {
          type = "Lecture";
        }

        return {
          dayOfWeek,
          subject,
          code: (item.code || "").trim() || undefined,
          room: (item.room || item.hall || item.location || "").trim() || undefined,
          instructor:
            (item.instructor || item.professor || item.teacher || "").trim() ||
            undefined,
          startTime,
          endTime,
          type,
          color: assignedColor,
        };
      })
      .filter((slot): slot is NonNullable<typeof slot> => slot !== null);

    // Sort by dayOfWeek, then startTime
    sanitizedClasses.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });

    return NextResponse.json({
      success: true,
      confidence: parsedResponse.confidence || "high",
      detectedDays: parsedResponse.detectedDays || [],
      totalDetected: sanitizedClasses.length,
      classes: sanitizedClasses,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
