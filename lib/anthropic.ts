import Anthropic from "@anthropic-ai/sdk";
import type { DischargeSummary, Language, SymptomCheck } from "./types";

export const MODEL = "claude-sonnet-4-20250514";

export function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY missing. Add it to .env.local.");
  }
  return new Anthropic({ apiKey: key });
}

function languageInstruction(lang: Language) {
  return lang === "hi"
    ? "Write all string fields in conversational Hindi (Devanagari script). Use simple words a non-medical reader will understand. Do NOT use clinical jargon."
    : "Write all string fields in plain, simple English at a 6th-grade reading level. Avoid clinical jargon — when you must use a medical term, immediately follow it with a parenthetical plain-language explanation.";
}

const SUMMARY_SCHEMA = `{
  "plan_name": "Short noun phrase identifying this recovery context, max 4 words. Examples: 'Knee arthroscopy', 'Type 2 diabetes', 'Cesarean delivery', 'Cardiac stent'. Pick the dominant procedure or diagnosis from the discharge.",
  "summary": "2-3 short paragraphs explaining what happened, what the patient should focus on now, and what's expected to feel normal vs concerning during recovery",
  "medications": [
    {
      "name": "string",
      "dose": "string",
      "frequency": "string (human-readable, e.g. 'Every 8 hours' or 'Twice daily after meals')",
      "instructions": "string",
      "purpose": "ONE short sentence (max 8 words) in plain language explaining what the drug does. Examples: 'Pain and inflammation', 'Antibiotic — prevents infection', 'Blood thinner — daily', 'Lowers blood sugar'.",
      "times": ["array of HH:MM strings in 24h format spread sensibly across waking hours, e.g. ['08:00','14:00','20:00']. Empty array [] for PRN / as-needed only."]
    }
  ],
  "red_flags": [
    {
      "symptom": "short concrete symptom name (3-6 words, e.g. 'High fever or chills', 'Heavy bleeding at incision')",
      "severity": "emergency" | "urgent" | "watch",
      "category": "incision_wound" | "infection_fever" | "breathing_circulation" | "pain_mobility" | "mental_state" | "medication_side_effect" | "digestive" | "other",
      "description": "2-3 sentences in patient-friendly language: what this symptom looks/feels like, why it's a concern after this procedure, and what's normal vs not. Avoid jargon.",
      "watch_for": "1-2 sentences: specific objective markers the patient can self-check (e.g. 'temperature above 101°F (38.3°C) lasting 4+ hours', 'soaking through more than one bandage per hour', 'pain not relieved by prescribed medication').",
      "examples": ["3-5 concrete observable signs as separate strings, e.g. 'red streaks spreading from the incision', 'yellow or green pus drainage', 'incision feels hot to touch'"],
      "when_to_call": "explicit action: 'Call 911 immediately' OR 'Call your doctor today' OR 'Mention at next appointment' — followed by a brief why if helpful"
    }
  ],
  "follow_up": [
    { "task": "string", "deadline": "string (e.g. 'within 7 days', '2026-05-12', 'as needed')", "contact": "string" }
  ],
  "language": "en" | "hi"
}`;

export async function summarizeDischarge(pdfText: string, language: Language): Promise<DischargeSummary> {
  const client = getClient();
  const system = `You are a careful medical communicator helping a patient understand their hospital discharge papers. The patient is recovering at home and needs detailed, calm, specific guidance — not just a list of warnings.

${languageInstruction(language)}

You MUST respond with a single JSON object — no prose before or after, no markdown fences. The JSON must conform exactly to this shape:
${SUMMARY_SCHEMA}

Rules:
- Do NOT invent medications, doses, or appointments not present in the source.
- If the source is missing meds/follow-ups, return empty arrays — never guess.

Red-flag rules — these are the patient's safety net, so be thorough:
- Always include AT LEAST 6 red flags, ideally 7–9, covering DIFFERENT categories (don't list 4 fever-related flags). Even if the source is terse, draw on standard post-discharge guidance for the procedure/diagnosis.
- Try to span these categories where relevant to the patient's condition: infection_fever, incision_wound, breathing_circulation, pain_mobility, mental_state, medication_side_effect, digestive.
- Each red flag MUST have ALL fields populated (symptom, severity, category, description, watch_for, examples [3-5 strings], when_to_call). Never use null. Never leave examples empty.
- "severity":
   - "emergency" → call 911 / go to ER (chest pain, trouble breathing, stroke signs, heavy uncontrolled bleeding, sudden severe headache, signs of anaphylaxis)
   - "urgent" → call doctor today (fever ≥101°F lasting hours, infection signs, severe pain not controlled, persistent vomiting, new confusion)
   - "watch" → mention at next visit if it persists (mild swelling, intermittent low-grade discomfort, sleep changes)
- "description" should be reassuring but specific — explain what the symptom feels like AND what's normal vs not so the patient doesn't panic over expected recovery sensations.
- "examples" are concrete, observable signs the patient can identify themselves (no medical instruments needed). Each example is a complete short phrase, not a fragment.
- "language" must be exactly "${language}".`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system,
    messages: [
      {
        role: "user",
        content: `Here is the discharge document text. Produce the JSON summary with 6+ detailed red flags.\n\n<discharge>\n${pdfText.slice(0, 60000)}\n</discharge>`,
      },
    ],
  });

  const text = extractText(message);
  return parseSummary(text, language);
}

export async function checkSymptom(
  symptom: string,
  redFlags: string[],
  language: Language,
): Promise<SymptomCheck> {
  const client = getClient();
  const system = `You are a triage assistant for a patient recovering at home. The patient's doctor has flagged these warning symptoms:
${redFlags.map((f) => `- ${f}`).join("\n") || "(none provided)"}

The patient just reported a new symptom. Decide how urgent it is.

${languageInstruction(language)}

Respond with a single JSON object — no prose, no markdown fences:
{
  "urgency": "emergency" | "urgent" | "monitor" | "ok",
  "reason": "1 short sentence explaining the urgency level",
  "matched_red_flag": "the matching red flag from the list, or null if no match",
  "advice": "1-2 short sentences telling the patient what to do right now"
}

Urgency rules:
- "emergency" = call 911 / go to ER immediately (chest pain, trouble breathing, sudden severe pain, stroke signs, heavy bleeding)
- "urgent" = call your doctor today (matches a listed red flag, or worsening trend)
- "monitor" = keep watching, log it, but no action needed yet
- "ok" = expected part of recovery, reassure the patient`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system,
    messages: [{ role: "user", content: `Symptom: ${symptom}` }],
  });

  const text = extractText(message);
  return parseSymptomCheck(text);
}

function extractText(message: Anthropic.Message): string {
  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text content.");
  }
  return block.text.trim();
}

function stripFences(s: string): string {
  let out = s.trim();
  if (out.startsWith("```")) {
    out = out.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  const first = out.indexOf("{");
  const last = out.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    out = out.slice(first, last + 1);
  }
  return out.trim();
}

function parseSummary(raw: string, language: Language): DischargeSummary {
  const cleaned = stripFences(raw);
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Could not parse Claude response as JSON. Raw: ${raw.slice(0, 200)}`);
  }
  return {
    plan_name: typeof parsed.plan_name === "string" && parsed.plan_name.trim()
      ? parsed.plan_name.trim()
      : (language === "hi" ? "रिकवरी योजना" : "Recovery plan"),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    medications: Array.isArray(parsed.medications)
      ? parsed.medications.map((m: any) => ({
          name: String(m?.name ?? ""),
          dose: String(m?.dose ?? ""),
          frequency: String(m?.frequency ?? ""),
          instructions: String(m?.instructions ?? ""),
          purpose: String(m?.purpose ?? "").trim(),
          times: Array.isArray(m?.times)
            ? (m.times as any[])
                .map((t) => String(t ?? "").trim())
                .filter((t) => /^\d{1,2}:\d{2}$/.test(t))
            : [],
        }))
      : [],
    red_flags: Array.isArray(parsed.red_flags)
      ? (parsed.red_flags
          .map((f: any) => normalizeRedFlag(f))
          .filter((f: any) => !!f) as DischargeSummary["red_flags"])
      : [],
    follow_up: Array.isArray(parsed.follow_up)
      ? parsed.follow_up.map((f: any) => ({
          task: String(f?.task ?? ""),
          deadline: String(f?.deadline ?? ""),
          contact: String(f?.contact ?? ""),
        }))
      : [],
    language: parsed.language === "hi" || parsed.language === "en" ? parsed.language : language,
  };
}

const VALID_CATEGORIES = new Set([
  "incision_wound",
  "infection_fever",
  "breathing_circulation",
  "pain_mobility",
  "mental_state",
  "medication_side_effect",
  "digestive",
  "other",
]);

function normalizeRedFlag(input: any) {
  if (!input) return null;
  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return null;
    return {
      symptom: s,
      severity: "urgent" as const,
      category: "other" as const,
      description: "",
      watch_for: "",
      examples: [] as string[],
      when_to_call: "Call your doctor if this happens.",
    };
  }
  const symptom = String(input.symptom ?? input.name ?? "").trim();
  if (!symptom) return null;
  const sev = input.severity;
  const severity: "emergency" | "urgent" | "watch" =
    sev === "emergency" || sev === "urgent" || sev === "watch" ? sev : "urgent";
  const rawCat = String(input.category ?? "").trim();
  const category = (VALID_CATEGORIES.has(rawCat) ? rawCat : "other") as
    | "incision_wound"
    | "infection_fever"
    | "breathing_circulation"
    | "pain_mobility"
    | "mental_state"
    | "medication_side_effect"
    | "digestive"
    | "other";
  const examples = Array.isArray(input.examples)
    ? (input.examples as any[])
        .map((e) => String(e ?? "").trim())
        .filter((s) => !!s)
        .slice(0, 6)
    : [];
  return {
    symptom,
    severity,
    category,
    description: String(input.description ?? "").trim(),
    watch_for: String(input.watch_for ?? input.watchFor ?? "").trim(),
    examples,
    when_to_call: String(input.when_to_call ?? input.whenToCall ?? "").trim(),
  };
}

function parseSymptomCheck(raw: string): SymptomCheck {
  const cleaned = stripFences(raw);
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Could not parse symptom check response. Raw: ${raw.slice(0, 200)}`);
  }
  const urgency = ["emergency", "urgent", "monitor", "ok"].includes(parsed?.urgency)
    ? (parsed.urgency as SymptomCheck["urgency"])
    : "monitor";
  return {
    urgency,
    reason: String(parsed?.reason ?? ""),
    matched_red_flag:
      typeof parsed?.matched_red_flag === "string" && parsed.matched_red_flag.trim()
        ? parsed.matched_red_flag
        : null,
    advice: String(parsed?.advice ?? ""),
  };
}
