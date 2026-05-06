import type {
  AppTheme,
  DischargeSummary,
  EmergencyContact,
  Language,
  Plan,
  SymptomLogEntry,
} from "./types";

const KEYS = {
  language: "pdc.language",
  // Legacy single-summary key (V2-era). On read we migrate it into pdc.plans then never write it again.
  legacySummary: "pdc.summary",
  plans: "pdc.plans",
  activeId: "pdc.activeId",
  symptoms: "pdc.symptoms",
  theme: "pdc.theme",
  emergencyContacts: "pdc.emergency",
} as const;

function safeRead<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

function safeRemove(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function migrateMedications(meds: any[] | undefined): any[] {
  if (!Array.isArray(meds)) return [];
  return meds.map((m: any) => ({
    ...m,
    purpose: typeof m?.purpose === "string" ? m.purpose : "",
    times: Array.isArray(m?.times)
      ? m.times.filter((t: any) => typeof t === "string" && /^\d{1,2}:\d{2}$/.test(t))
      : [],
  }));
}

function migrateRedFlags(flags: any[] | undefined): any[] {
  if (!Array.isArray(flags)) return [];
  return flags.map((f: any) => {
    if (typeof f === "string") {
      return {
        symptom: f,
        severity: "urgent",
        category: "other",
        description: "",
        watch_for: "",
        examples: [],
        when_to_call: "Call your doctor if this happens.",
      };
    }
    return {
      ...f,
      category: typeof f.category === "string" ? f.category : "other",
      examples: Array.isArray(f.examples) ? f.examples : [],
    };
  });
}

function migrateSummary(raw: any, fallbackLang: Language = "en"): DischargeSummary {
  return {
    plan_name:
      typeof raw?.plan_name === "string" && raw.plan_name.trim()
        ? raw.plan_name.trim()
        : fallbackLang === "hi"
          ? "रिकवरी योजना"
          : "Recovery plan",
    summary: typeof raw?.summary === "string" ? raw.summary : "",
    medications: migrateMedications(raw?.medications),
    red_flags: migrateRedFlags(raw?.red_flags),
    follow_up: Array.isArray(raw?.follow_up) ? raw.follow_up : [],
    language: raw?.language === "hi" ? "hi" : "en",
  };
}

function loadPlans(): { plans: Plan[]; activeId: string | null } {
  if (typeof window === "undefined") return { plans: [], activeId: null };

  let plans = safeRead<Plan[]>(KEYS.plans) ?? [];
  let activeId = window.localStorage.getItem(KEYS.activeId);

  // Migrate legacy single-summary blob if found and no plans yet
  if (plans.length === 0) {
    const legacy = safeRead<any>(KEYS.legacySummary);
    if (legacy) {
      const migrated: Plan = {
        id: newId(),
        createdAt: Date.now(),
        source: "discharge.pdf",
        summary: migrateSummary(legacy, legacy?.language === "hi" ? "hi" : "en"),
      };
      plans = [migrated];
      activeId = migrated.id;
      safeWrite(KEYS.plans, plans);
      window.localStorage.setItem(KEYS.activeId, activeId);
      safeRemove(KEYS.legacySummary);
    }
  } else {
    // Re-run plan-shape migrations on existing plans (idempotent)
    plans = plans.map((p) => ({
      ...p,
      summary: migrateSummary(p.summary, p.summary?.language ?? "en"),
    }));
  }

  if (!activeId || !plans.find((p) => p.id === activeId)) {
    activeId = plans[0]?.id ?? null;
    if (activeId) window.localStorage.setItem(KEYS.activeId, activeId);
  }

  return { plans, activeId };
}

export const storage = {
  /* ------------------- Language ------------------- */
  getLanguage(): Language | null {
    return safeRead<Language>(KEYS.language);
  },
  setLanguage(lang: Language) {
    safeWrite(KEYS.language, lang);
  },

  /* ------------------- Plans ------------------- */
  getPlans(): Plan[] {
    return loadPlans().plans;
  },
  getActivePlan(): Plan | null {
    const { plans, activeId } = loadPlans();
    return plans.find((p) => p.id === activeId) ?? null;
  },
  getActivePlanId(): string | null {
    return loadPlans().activeId;
  },
  setActivePlan(id: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEYS.activeId, id);
  },
  addPlan(summary: DischargeSummary, source = "discharge.pdf"): Plan {
    const { plans } = loadPlans();
    const plan: Plan = {
      id: newId(),
      createdAt: Date.now(),
      source,
      summary: migrateSummary(summary, summary.language),
    };
    const next = [...plans, plan];
    safeWrite(KEYS.plans, next);
    if (typeof window !== "undefined") window.localStorage.setItem(KEYS.activeId, plan.id);
    return plan;
  },
  updatePlanSummary(id: string, summary: DischargeSummary) {
    const { plans } = loadPlans();
    const next = plans.map((p) =>
      p.id === id
        ? { ...p, summary: migrateSummary(summary, summary.language) }
        : p,
    );
    safeWrite(KEYS.plans, next);
  },
  deletePlan(id: string) {
    if (typeof window === "undefined") return;
    const { plans, activeId } = loadPlans();
    const next = plans.filter((p) => p.id !== id);
    safeWrite(KEYS.plans, next);
    if (activeId === id) {
      const newActive = next[0]?.id ?? null;
      if (newActive) window.localStorage.setItem(KEYS.activeId, newActive);
      else window.localStorage.removeItem(KEYS.activeId);
    }
  },
  /** Replace the entire plans array — used after batch translation. */
  setPlans(plans: Plan[]) {
    safeWrite(KEYS.plans, plans);
  },
  clearAllPlans() {
    safeRemove(KEYS.plans);
    safeRemove(KEYS.activeId);
    safeRemove(KEYS.legacySummary);
  },

  /* ------------------- Compatibility (active plan as "summary") ------------------- */
  /** Convenience: returns the active plan's DischargeSummary or null. */
  getSummary(): DischargeSummary | null {
    return this.getActivePlan()?.summary ?? null;
  },
  setSummary(summary: DischargeSummary) {
    const id = this.getActivePlanId();
    if (id) this.updatePlanSummary(id, summary);
    else this.addPlan(summary);
  },
  clearSummary() {
    const id = this.getActivePlanId();
    if (id) this.deletePlan(id);
  },

  /* ------------------- Symptoms ------------------- */
  getSymptoms(): SymptomLogEntry[] {
    return safeRead<SymptomLogEntry[]>(KEYS.symptoms) ?? [];
  },
  addSymptom(entry: SymptomLogEntry) {
    const list = this.getSymptoms();
    list.unshift(entry);
    safeWrite(KEYS.symptoms, list.slice(0, 50));
  },
  clearSymptoms() {
    safeRemove(KEYS.symptoms);
  },

  /* ------------------- Theme ------------------- */
  getTheme(): AppTheme {
    if (typeof window === "undefined") return "light";
    return (window.localStorage.getItem(KEYS.theme) as AppTheme) || "light";
  },
  setTheme(theme: AppTheme) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEYS.theme, theme);
    if (theme === "dark") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
  },

  /* ------------------- Emergency contacts ------------------- */
  getEmergencyContacts(): EmergencyContact[] {
    const stored = safeRead<EmergencyContact[]>(KEYS.emergencyContacts);
    if (stored && stored.length > 0) return stored;
    // Reasonable defaults so the SOS modal isn't empty on first run
    return [
      { id: "default-911", name: "Emergency services", relation: "Emergency", phone: "911" },
      { id: "default-doc", name: "Your doctor", relation: "Primary provider", phone: "—" },
    ];
  },
  setEmergencyContacts(contacts: EmergencyContact[]) {
    safeWrite(KEYS.emergencyContacts, contacts);
  },
};
