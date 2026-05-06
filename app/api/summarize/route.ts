import { NextRequest, NextResponse } from "next/server";
import { summarizeDischarge } from "@/lib/anthropic";
import type { Language } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const language = (form.get("language") as Language) || "en";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractPdfText(buffer);

    if (!text || text.trim().length < 30) {
      return NextResponse.json(
        { error: "Could not read text from this PDF. Try a different file." },
        { status: 422 },
      );
    }

    const summary = await summarizeDischarge(text, language);
    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error("[summarize] failed:", err);
    return NextResponse.json(
      { error: err?.message || "Something went wrong." },
      { status: 500 },
    );
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const mod: any = await import("pdf-parse/lib/pdf-parse.js");
  const pdfParse = mod.default ?? mod;
  const result = await pdfParse(buffer);
  return result.text as string;
}
