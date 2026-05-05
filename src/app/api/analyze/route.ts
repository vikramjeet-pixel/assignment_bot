import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
// pdf-parse v1 — use internal lib path to skip the test-file check at module init
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;

const SYSTEM_PROMPT = `You are an academic assignment analyzer. Extract deadlines and requirements from the provided text.
Output ONLY a valid JSON object with this exact shape:
{
  "assignmentName": "string",
  "dueDate": "YYYY-MM-DD",
  "tasks": [
    {
      "step": 1,
      "description": "string",
      "daysAllocated": number,
      "phase": "research" | "writing" | "action"
    }
  ]
}
Rules:
- Infer phases: 'research' for reading/gathering, 'writing' for drafting/editing, 'action' for submitting/presenting.
- If dueDate is not found, estimate 14 days from today.
- Break work into 4-8 concrete tasks with realistic day allocations.
- Total daysAllocated across all tasks should not exceed the days until dueDate.
- Output ONLY the JSON. No markdown, no explanation.`;

const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

async function callGemini(genAI: GoogleGenerativeAI, text: string) {
  let lastErr: unknown;
  for (const modelName of MODEL_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: `Assignment content:\n\n${text.slice(0, 30000)}` },
      ]);
      return result.response.text().trim();
    } catch (err) {
      console.warn(`[analyze] ${modelName} failed:`, err);
      lastErr = err;
    }
  }
  throw lastErr;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not set." }, { status: 500 });
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let extractedText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file in request." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text;
      console.log(`[analyze] extracted ${extractedText.length} chars from "${file.name}"`);

      if (!extractedText.trim()) {
        return NextResponse.json(
          { error: "Could not extract text from this PDF. It may be scanned or image-only." },
          { status: 422 }
        );
      }
    } else {
      const body = await req.json();
      extractedText = body.text ?? "";
      if (!extractedText) {
        return NextResponse.json({ error: "No text provided." }, { status: 400 });
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const raw = await callGemini(genAI, extractedText);
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const result = JSON.parse(cleaned);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyze] fatal:", message);
    return NextResponse.json({ error: `Analysis failed: ${message}` }, { status: 500 });
  }
}
