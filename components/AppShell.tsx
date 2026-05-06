"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Language } from "@/lib/types";
import { t } from "@/lib/i18n";
import { SOS } from "@/components/SOS";
import { storage } from "@/lib/storage";

type NavKey = "home" | "medications" | "symptoms" | "followups" | "share" | "settings";

const navItems: Array<{
  key: NavKey;
  href: string;
  icon: string;
}> = [
  { key: "home", href: "/dashboard", icon: "grid_view" },
  { key: "medications", href: "/medications", icon: "medication" },
  { key: "symptoms", href: "/symptoms", icon: "monitor_heart" },
  { key: "followups", href: "/follow-ups", icon: "calendar_month" },
  { key: "share", href: "/share", icon: "share" },
  { key: "settings", href: "/settings", icon: "settings" },
];

const NAV_LABEL_EN: Record<NavKey, string> = {
  home: "Home",
  medications: "Medications",
  symptoms: "Symptoms",
  followups: "Follow-ups",
  share: "Share",
  settings: "Settings",
};

const NAV_LABEL_HI: Record<NavKey, string> = {
  home: "होम",
  medications: "दवाइयाँ",
  symptoms: "लक्षण",
  followups: "फॉलो-अप",
  share: "साझा करें",
  settings: "सेटिंग्स",
};

export function SwayamMark({ size = 28 }: { size?: number }) {
  return (
    <img
      src="/swayam-logo.png"
      alt="Swayam"
      width={size}
      height={size}
      className="swayam-logo"
      style={{ height: size, width: "auto", display: "block" }}
    />
  );
}

export function Brand({
  size = "default",
  showMark = true,
}: {
  size?: "default" | "small" | "hero";
  showMark?: boolean;
}) {
  const markSize = size === "hero" ? 72 : size === "small" ? 30 : 40;
  return (
    <div className="flex items-center gap-2">
      {showMark && <SwayamMark size={markSize} />}
    </div>
  );
}

export function AppShell({
  language,
  active,
  showBack = false,
  fillViewport = false,
  children,
}: {
  language: Language;
  active?: NavKey;
  showBack?: boolean;
  fillViewport?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const navLabel = language === "hi" ? NAV_LABEL_HI : NAV_LABEL_EN;

  // Apply persisted theme on mount so all screens stay in the user's chosen mode
  useEffect(() => {
    const theme = storage.getTheme();
    if (theme === "dark") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
  }, []);

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-64">
      <header className="sticky top-0 z-40 flex justify-between items-center px-5 h-16 w-full bg-surface border-b border-line md:hidden">
        <button
          aria-label="Back"
          onClick={() => router.back()}
          className={`text-accent-ink hover:bg-line-2 transition-colors active:opacity-70 p-2 -ml-2 rounded-full ${
            showBack ? "" : "invisible"
          }`}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <Brand size="small" />
        <div className="flex items-center gap-2 text-ink-3">
          <span className="material-symbols-outlined text-[20px]">person</span>
        </div>
      </header>

      <main className={`max-w-5xl mx-auto px-5 ${fillViewport ? "py-4" : "py-6"} md:py-7`}>
        {children}
      </main>

      {/* Mobile bottom nav: trim to 4 most-used items so it still fits */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 h-20 bg-surface border-t border-line shadow-[0_-4px_20px_rgba(13,27,50,0.06)] rounded-t-[22px]">
        {navItems
          .filter((i) => i.key === "home" || i.key === "medications" || i.key === "symptoms" || i.key === "share")
          .map((item) => {
            const isActive = active === item.key || pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-[16px] active:scale-95 transition-transform ${
                  isActive ? "bg-accent-soft text-accent-ink" : "text-ink-3"
                }`}
              >
                <span className={`material-symbols-outlined mb-1 text-[22px] ${isActive ? "fill" : ""}`}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider">
                  {navLabel[item.key]}
                </span>
              </Link>
            );
          })}
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-line p-4 z-30">
        <div className="px-2 pt-2 pb-4 mb-3 border-b border-line">
          <SwayamMark size={56} />
          <p className="mono text-[11px] text-ink-3 mt-2 tracking-wide">
            {t(language, "patientCompanion")}
          </p>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = active === item.key || pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-colors ${
                  isActive
                    ? "bg-accent-soft text-accent-ink font-semibold"
                    : "text-ink-2 hover:bg-line-2"
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? "fill" : ""}`}>
                  {item.icon}
                </span>
                <span className="text-[13.5px]">{navLabel[item.key]}</span>
                {isActive && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line pt-3 mt-2">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-9 h-9 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center text-[12px] font-semibold shrink-0">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate">
                {language === "hi" ? "मरीज़" : "Patient"}
              </div>
              <div className="text-[11px] text-ink-3 truncate">
                {language === "hi" ? "रिकवरी मोड" : "Recovery mode"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <SOS language={language} />
    </div>
  );
}
