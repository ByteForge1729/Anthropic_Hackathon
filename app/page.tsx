"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const lang = storage.getLanguage();
    const summary = storage.getSummary();
    if (!lang) {
      router.replace("/onboarding");
    } else if (!summary) {
      router.replace("/upload");
    } else {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3 text-ink-3">
        <span className="material-symbols-outlined animate-pulse text-accent text-[36px] fill">spa</span>
        <p className="mono text-[12px] uppercase tracking-wider">Loading…</p>
      </div>
    </div>
  );
}
