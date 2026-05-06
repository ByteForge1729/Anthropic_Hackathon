"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import { Brand, SwayamMark } from "@/components/AppShell";

export default function Onboarding() {
  const router = useRouter();

  useEffect(() => {
    if (!storage.getLanguage()) storage.setLanguage("en");
  }, []);

  function handleContinue() {
    storage.setLanguage("en");
    router.push("/upload");
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-12 pb-32 px-5 bg-bg">
      <main className="w-full max-w-md flex flex-col flex-1 items-center">
        <header className="flex flex-col items-center text-center mb-8 w-full">
          <div className="mb-4">
            <SwayamMark size={56} />
          </div>
          <Brand showMark={false} />
          <p className="mono text-[11px] text-ink-3 uppercase tracking-wider mb-4 mt-1">
            Patient companion
          </p>
          <h1 className="text-[30px] font-semibold text-ink mb-2 tracking-tight leading-tight">
            Welcome to Swayam.
          </h1>
          <p className="text-[14.5px] text-ink-2">
            Upload your discharge papers and we&apos;ll turn them into a clear, calm recovery plan.
          </p>
        </header>

        <section className="w-full bg-surface border border-line rounded-[18px] p-5 shadow-sm mb-8">
          <ul className="space-y-3 text-[14px] text-ink-2">
            <FeatureItem icon="upload_file">Upload your hospital discharge PDF</FeatureItem>
            <FeatureItem icon="auto_awesome">
              We summarize meds, follow-ups, and warning signs in plain language
            </FeatureItem>
            <FeatureItem icon="picture_as_pdf">
              Export a shareable PDF for family or your caregiver
            </FeatureItem>
          </ul>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full p-5 bg-bg/80 backdrop-blur-sm flex justify-center pb-8 pt-4 border-t border-line z-10">
        <button
          onClick={handleContinue}
          className="w-full max-w-md h-[56px] rounded-[16px] bg-accent text-white font-medium hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center shadow-md"
          type="button"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function FeatureItem({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="material-symbols-outlined text-accent mt-0.5 text-[20px] fill">
        {icon}
      </span>
      <span className="leading-snug">{children}</span>
    </li>
  );
}
