"use client";
import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { t } from "@/lib/i18n";
import type { EmergencyContact, Language } from "@/lib/types";

export function SOS({ language }: { language: Language }) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    setContacts(storage.getEmergencyContacts());
  }, []);

  // Lock scroll while modal is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t(language, "sos")}
        className="fixed bottom-24 right-5 md:bottom-6 md:right-6 z-50 h-14 px-5 rounded-full bg-danger text-white shadow-lg flex items-center gap-2 active:scale-95 hover:opacity-95 transition-all"
        style={{
          boxShadow:
            "0 8px 24px -6px rgba(184, 50, 50, 0.55), 0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <span className="material-symbols-outlined fill text-[20px]">favorite</span>
        <span className="text-[14px] font-bold tracking-wide">{t(language, "sos")}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-ink/40 backdrop-blur-sm p-0 md:p-5"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full md:max-w-md bg-surface rounded-t-[24px] md:rounded-[24px] shadow-lg flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 p-5 border-b border-line">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined fill text-danger text-[22px]">
                    emergency
                  </span>
                  <h2 className="text-[18px] font-semibold text-ink">
                    {t(language, "sosTitle")}
                  </h2>
                </div>
                <p className="text-[13px] text-ink-2 leading-relaxed">
                  {t(language, "sosSubtitle")}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={t(language, "closeBtn")}
                className="text-ink-3 hover:text-ink p-1 -m-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <ul className="p-3 max-h-[60vh] overflow-y-auto">
              {contacts.map((c) => (
                <li key={c.id}>
                  <a
                    href={c.phone === "—" ? undefined : `tel:${c.phone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-3 p-3 rounded-[14px] hover:bg-line-2 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-danger-soft text-danger flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined fill text-[20px]">call</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-semibold text-ink truncate">
                        {c.name}
                      </p>
                      <p className="text-[12px] text-ink-3 truncate">
                        {c.relation} · {c.phone}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-accent">arrow_forward</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
