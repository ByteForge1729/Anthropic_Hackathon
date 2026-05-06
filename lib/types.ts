export type Language = "en" | "hi";

export type Medication = {
  name: string;
  dose: string;
  frequency: string;
  instructions: string;
  /** One-line plain-language explanation of what this drug is for, e.g. "Pain and inflammation" */
  purpose: string;
  /** Daily schedule as 24h HH:MM strings, e.g. ["08:00","14:00","20:00"]. Empty for PRN/as-needed. */
  times: string[];
};

export type FollowUp = {
  task: string;
  deadline: string;
  contact: string;
};

export type RedFlagSeverity = "emergency" | "urgent" | "watch";

export type RedFlagCategory =
  | "incision_wound"
  | "infection_fever"
  | "breathing_circulation"
  | "pain_mobility"
  | "mental_state"
  | "medication_side_effect"
  | "digestive"
  | "other";

export type RedFlag = {
  symptom: string;
  severity: RedFlagSeverity;
  category: RedFlagCategory;
  description: string;
  watch_for: string;
  examples: string[];
  when_to_call: string;
};

export type DischargeSummary = {
  /** Short noun phrase identifying this recovery context, e.g. "Knee arthroscopy", "Type 2 diabetes". */
  plan_name: string;
  summary: string;
  medications: Medication[];
  red_flags: RedFlag[];
  follow_up: FollowUp[];
  language: Language;
};

export type Plan = {
  id: string;
  createdAt: number;
  /** Original PDF file name, kept for display only. */
  source: string;
  summary: DischargeSummary;
};

export type Urgency = "emergency" | "urgent" | "monitor" | "ok";

export type SymptomCheck = {
  urgency: Urgency;
  reason: string;
  matched_red_flag: string | null;
  advice: string;
};

export type SymptomLogEntry = {
  id: string;
  timestamp: number;
  symptom: string;
  result: SymptomCheck;
};

export type EmergencyContact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
};

export type AppTheme = "light" | "dark";
