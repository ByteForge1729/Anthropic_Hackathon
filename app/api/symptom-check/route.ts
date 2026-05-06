import { NextRequest, NextResponse } from "next/server";
import { checkSymptom } from "@/lib/anthropic";
import type { Language } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const symptom = String(body?.symptom ?? "").trim();
    const redFlags = Array.isArray(body?.red_flags)
      ? body.red_flags
          .map((f: any) => {
            if (typeof f === "string") return f;
            const sym = String(f?.symptom ?? "").trim();
            const watch = String(f?.watch_for ?? "").trim();
            return watch ? `${sym} — ${watch}` : sym;
          })
          .filter((s: string) => !!s)
      : [];
    const language = (body?.language as Language) === "hi" ? "hi" : "en";

    if (!symptom) {
      return NextResponse.json({ error: "Describe a symptom." }, { status: 400 });
    }

    const result = await checkSymptom(symptom, redFlags, language);
    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("[symptom-check] failed:", err);
    return NextResponse.json({ error: err?.message || "Something went wrong." }, { status: 500 });
  }
}
