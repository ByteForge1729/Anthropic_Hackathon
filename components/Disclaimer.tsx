"use client";
import type { Language } from "@/lib/types";
import { t } from "@/lib/i18n";

export function Disclaimer({ language, variant = "full" }: { language: Language; variant?: "full" | "compact" }) {
  const text = variant === "full" ? t(language, "disclaimer") : t(language, "disclaimerShort");
  return (
    <div className="flex items-start gap-2 rounded-[16px] bg-accent-2-soft border border-accent-2/20 px-3 py-2.5">
      <span className="material-symbols-outlined text-accent-2-ink text-[18px] mt-0.5">info</span>
      <p className="text-[13px] text-accent-2-ink leading-relaxed">{text}</p>
    </div>
  );
}
