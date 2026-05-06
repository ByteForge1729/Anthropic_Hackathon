import type { Language, Medication } from "./types";
import { t } from "./i18n";

export type NextDose = {
  /** The medication name. */
  name: string;
  /** HH:MM (24h) when the next dose is due. */
  time: string;
  /** Date object representing the next dose moment. */
  at: Date;
  /** Minutes from now. */
  inMinutes: number;
  /** Localized "in 1h 24m" string. */
  inLabel: string;
  /** All meds also due at this exact time, for grouping (rare). */
  alsoDue: string[];
};

function parseHHMM(s: string): { h: number; m: number } | null {
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = +m[1];
  const min = +m[2];
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

export function computeNextDose(meds: Medication[], language: Language, now: Date = new Date()): NextDose | null {
  let best: { date: Date; med: Medication; time: string } | null = null;
  for (const med of meds) {
    if (!Array.isArray(med.times)) continue;
    for (const time of med.times) {
      const parsed = parseHHMM(time);
      if (!parsed) continue;
      const candidate = new Date(now);
      candidate.setHours(parsed.h, parsed.m, 0, 0);
      // If past, push to tomorrow
      if (candidate.getTime() <= now.getTime()) {
        candidate.setDate(candidate.getDate() + 1);
      }
      if (!best || candidate.getTime() < best.date.getTime()) {
        best = { date: candidate, med, time };
      }
    }
  }
  if (!best) return null;
  const inMinutes = Math.round((best.date.getTime() - now.getTime()) / 60000);
  const alsoDue = meds
    .filter(
      (m) =>
        m !== best!.med &&
        m.times.some((t) => {
          const p = parseHHMM(t);
          return p && p.h === best!.date.getHours() && p.m === best!.date.getMinutes();
        }),
    )
    .map((m) => m.name);
  return {
    name: best.med.name,
    time: best.time,
    at: best.date,
    inMinutes,
    inLabel: formatRelative(inMinutes, language),
    alsoDue,
  };
}

export function formatRelative(minutes: number, language: Language): string {
  if (minutes < 60) {
    return t(language, "inXmin").replace("{n}", String(Math.max(0, minutes)));
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return t(language, "inXhr").replace("{n}", String(h));
  return t(language, "inXhrYmin").replace("{h}", String(h)).replace("{m}", String(m));
}

export function formatTimeOfDay(time: string, language: Language): string {
  const parsed = parseHHMM(time);
  if (!parsed) return time;
  const d = new Date();
  d.setHours(parsed.h, parsed.m, 0, 0);
  return d.toLocaleTimeString(language === "hi" ? "hi-IN" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
