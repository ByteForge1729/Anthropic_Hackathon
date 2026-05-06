"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import { t } from "@/lib/i18n";
import type { Language, DischargeSummary } from "@/lib/types";
import { Disclaimer } from "@/components/Disclaimer";
import { Brand } from "@/components/AppShell";

export default function UploadPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const lang = storage.getLanguage();
    if (!lang) {
      router.replace("/onboarding");
    } else {
      setLanguage(lang);
    }
  }, [router]);

  function pickFile(f: File | null) {
    setError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError(language === "hi" ? "केवल PDF फ़ाइल अपलोड करें।" : "Please upload a PDF file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError(language === "hi" ? "फ़ाइल बहुत बड़ी है (अधिकतम 10MB)।" : "File too large (max 10MB).");
      return;
    }
    setFile(f);
  }

  async function handleSubmit() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("language", language);
      const res = await fetch("/api/summarize", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to process");
      const summary = data.summary as DischargeSummary;
      // Append as a new plan and switch to it (multi-plan support)
      storage.addPlan(summary, file.name);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-bg">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-accent-soft animate-ping opacity-50" />
            <div className="relative w-24 h-24 rounded-full bg-accent-soft flex items-center justify-center">
              <span className="material-symbols-outlined text-accent text-[44px] fill">description</span>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-[24px] font-semibold text-ink tracking-tight">{t(language, "analyzing")}</h2>
            <p className="text-[15px] text-ink-2">{t(language, "analyzingSub")}</p>
          </div>
          <div className="mono text-[12px] text-ink-3 uppercase tracking-wider mt-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
            Reading · Analyzing · Translating
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="flex justify-between items-center px-5 h-16 w-full border-b border-line bg-surface">
        <button
          aria-label="Back"
          onClick={() => router.push("/onboarding")}
          className="text-accent-ink hover:bg-line-2 transition-colors rounded-full p-2 -ml-2 active:opacity-70"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <Brand size="small" />
        <span className="mono text-[11px] text-ink-3 uppercase tracking-wider">{t(language, "step2of2")}</span>
      </header>

      <main className="flex-grow flex flex-col px-5 py-6 gap-4 max-w-2xl mx-auto w-full">
        <div className="mb-1">
          <h1 className="text-[28px] md:text-[32px] font-semibold text-ink tracking-tight leading-tight">
            {t(language, "uploadTitle")}
          </h1>
          <p className="text-[15px] text-ink-2 mt-1.5">{t(language, "uploadSubtitle")}</p>
        </div>

        <Disclaimer language={language} />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const f = e.dataTransfer.files?.[0];
            if (f) pickFile(f);
          }}
          className={`relative w-full h-72 rounded-[22px] border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-colors cursor-pointer ${
            dragActive
              ? "border-accent bg-accent-soft"
              : file
                ? "border-accent bg-accent-soft/40"
                : "border-line bg-surface hover:bg-accent-soft/40 hover:border-accent/40"
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-4 shadow-sm border border-line">
            <span className="material-symbols-outlined text-[40px] text-accent fill">
              {file ? "description" : "upload_file"}
            </span>
          </div>
          {file ? (
            <>
              <p className="text-[15px] text-accent-ink font-semibold truncate max-w-full px-4">{file.name}</p>
              <p className="mono text-[12px] text-ink-3 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="mt-3 text-[13px] text-accent-ink underline"
                type="button"
              >
                {language === "hi" ? "बदलें" : "Change file"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="bg-surface text-accent-ink border border-line hover:border-accent text-[14px] font-medium py-3 px-6 rounded-[14px] transition-colors shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                {t(language, "selectFile")}
              </button>
              <p className="mt-4 mono text-[12px] text-ink-3">{t(language, "supported")}</p>
            </>
          )}
          <input
            ref={inputRef}
            aria-label="File Upload Input"
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && (
          <div className="rounded-[16px] bg-danger-soft border border-danger/30 p-4 flex items-start gap-2">
            <span className="material-symbols-outlined text-danger">error</span>
            <p className="text-[14px] text-danger">{error}</p>
          </div>
        )}

        <div className="mt-auto flex items-center justify-center gap-2 text-ink-3 pt-4">
          <span className="material-symbols-outlined text-[18px]">lock</span>
          <p className="text-[13px]">{t(language, "encrypted")}</p>
        </div>

        <button
          disabled={!file}
          onClick={handleSubmit}
          className={`w-full mt-2 h-[56px] rounded-[16px] text-[14px] font-medium flex items-center justify-center transition-colors ${
            file
              ? "bg-accent text-white hover:opacity-90 shadow-md"
              : "bg-accent text-white opacity-40 cursor-not-allowed"
          }`}
        >
          {t(language, "continue")}
        </button>
      </main>
    </div>
  );
}
