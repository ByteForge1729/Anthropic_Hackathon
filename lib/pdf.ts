"use client";
import type {
  DischargeSummary,
  Language,
  RedFlag,
  RedFlagCategory,
  SymptomLogEntry,
} from "./types";
import { t } from "./i18n";

type ShareOptions = {
  includeSummary: boolean;
  includeMedications: boolean;
  includeSymptoms: boolean;
};

const CATEGORY_KEY: Record<RedFlagCategory, "catIncisionWound" | "catInfectionFever" | "catBreathingCirculation" | "catPainMobility" | "catMentalState" | "catMedicationSideEffect" | "catDigestive" | "catOther"> = {
  incision_wound: "catIncisionWound",
  infection_fever: "catInfectionFever",
  breathing_circulation: "catBreathingCirculation",
  pain_mobility: "catPainMobility",
  mental_state: "catMentalState",
  medication_side_effect: "catMedicationSideEffect",
  digestive: "catDigestive",
  other: "catOther",
};

const CATEGORY_ORDER: RedFlagCategory[] = [
  "infection_fever",
  "incision_wound",
  "breathing_circulation",
  "pain_mobility",
  "medication_side_effect",
  "digestive",
  "mental_state",
  "other",
];

// Brand palette — matches Swayam design tokens
const C = {
  accent: "#0E7C7C",
  accentInk: "#0A5C5C",
  accentSoft: "#DBEEEE",
  accent2: "#C97A2B",
  accent2Soft: "#FBEDD9",
  accent2Ink: "#8F5316",
  ink: "#0B1B2B",
  ink2: "#41506B",
  ink3: "#7A8AA3",
  line: "#E4EAF2",
  line2: "#EFF3F8",
  danger: "#B83232",
  dangerSoft: "#FBECEC",
  ok: "#1F8A5B",
  white: "#FFFFFF",
};

async function fetchLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/swayam-logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateSharePdf(
  summary: DischargeSummary,
  symptoms: SymptomLogEntry[],
  options: ShareOptions,
  language: Language,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const logoDataUrl = await fetchLogoDataUrl();

  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const M = 48; // outer margin
  const TEXT_W = PAGE_W - M * 2;
  let y = M;
  let pageNum = 1;

  function setFont(size: number, weight: "normal" | "bold" = "normal") {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
  }

  function setFill(hex: string) {
    doc.setFillColor(hex);
  }
  function setStroke(hex: string) {
    doc.setDrawColor(hex);
  }
  function setText(hex: string) {
    doc.setTextColor(hex);
  }

  function newPage() {
    drawPageFooter();
    doc.addPage();
    pageNum += 1;
    y = M;
    drawPageHeader();
  }

  function ensureSpace(needed: number) {
    if (y + needed > PAGE_H - M - 24) newPage();
  }

  function drawPageHeader() {
    // Slim brand bar at top
    setFill(C.white);
    doc.rect(0, 0, PAGE_W, 36, "F");
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, "PNG", M, 8, 84, 24, undefined, "FAST");
      } catch {
        setFont(9, "bold");
        setText(C.accentInk);
        doc.text("Swayam", M, 22);
      }
    } else {
      setFont(9, "bold");
      setText(C.accentInk);
      doc.text("स्वयम्  Swayam", M, 22);
    }
    setFont(8, "normal");
    setText(C.ink3);
    const headerRight =
      summary.plan_name ||
      (language === "hi" ? "रिकवरी सारांश" : "Recovery Summary");
    doc.text(headerRight, PAGE_W - M, 22, { align: "right" });
    setStroke(C.line);
    doc.setLineWidth(0.5);
    doc.line(M, 36, PAGE_W - M, 36);
    y = M + 12;
  }

  function drawPageFooter() {
    const fy = PAGE_H - 28;
    setStroke(C.line);
    doc.setLineWidth(0.5);
    doc.line(M, fy - 10, PAGE_W - M, fy - 10);
    setFont(8, "normal");
    setText(C.ink3);
    doc.text(t(language, "disclaimerShort"), M, fy);
    doc.text(`${pageNum}`, PAGE_W - M, fy, { align: "right" });
  }

  function writeWrapped(
    text: string,
    opts: { size?: number; weight?: "normal" | "bold"; color?: string; x?: number; maxW?: number; gap?: number } = {},
  ) {
    const size = opts.size ?? 10;
    const weight = opts.weight ?? "normal";
    const color = opts.color ?? C.ink;
    const x = opts.x ?? M;
    const maxW = opts.maxW ?? TEXT_W;
    const gap = opts.gap ?? size * 1.4;
    setFont(size, weight);
    setText(color);
    const lines = doc.splitTextToSize(text, maxW);
    for (const line of lines) {
      ensureSpace(gap);
      doc.text(line, x, y);
      y += gap;
    }
  }

  function sectionHeading(label: string, accentColor: string, icon?: string) {
    ensureSpace(54);
    y += 14;
    // Tinted header chip
    setFill(accentColor);
    doc.roundedRect(M, y - 14, 4, 22, 2, 2, "F");
    setFont(15, "bold");
    setText(C.ink);
    doc.text(label, M + 14, y);
    y += 10;
    setStroke(C.line);
    doc.setLineWidth(0.5);
    doc.line(M, y, PAGE_W - M, y);
    y += 14;
  }

  /* ----------- COVER PAGE ----------- */
  // Teal hero band
  setFill(C.accent);
  doc.rect(0, 0, PAGE_W, 220, "F");

  // Logo (embedded PNG) — placed top-left, scaled to ~64pt tall
  if (logoDataUrl) {
    try {
      const logoH = 64;
      const logoW = 200; // approx aspect; jsPDF will accept overlarge w + smaller h
      doc.addImage(logoDataUrl, "PNG", M, 36, logoW, logoH, undefined, "FAST");
    } catch {
      // fall through to text brand
    }
  } else {
    setFont(13, "bold");
    setText(C.white);
    doc.text("स्वयम्  Swayam", M, 70);
  }
  setFont(9, "normal");
  setText(C.accentSoft);
  doc.text(
    (language === "hi" ? "आपका साथी" : "PATIENT COMPANION").toUpperCase(),
    M,
    116,
  );

  // Title — show plan name on the cover
  setFont(26, "bold");
  setText(C.white);
  const titleText =
    summary.plan_name && summary.plan_name.trim()
      ? summary.plan_name
      : language === "hi"
        ? "रिकवरी सारांश"
        : "Recovery Summary";
  doc.text(titleText, M, 154);
  setFont(12, "normal");
  setText(C.accentSoft);
  doc.text(
    language === "hi"
      ? "डॉक्टर के निर्देश आसान भाषा में"
      : "Your discharge plan, in plain language",
    M,
    176,
  );

  // Date pill
  setFill(C.white);
  doc.roundedRect(M, 188, 220, 22, 11, 11, "F");
  setFont(9, "bold");
  setText(C.accentInk);
  const dateStr = new Date().toLocaleString(language === "hi" ? "hi-IN" : "en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });
  doc.text(dateStr, M + 12, 202);

  // Below the band: counts strip
  y = 252;
  drawCountsStrip(summary, options, symptoms);

  // Severity distribution chart (only if including red flags)
  if (options.includeSummary && summary.red_flags.length > 0) {
    y += 18;
    drawSeverityChart(summary, language);
  }

  // Disclaimer card
  y += 18;
  drawDisclaimerCard(language);

  // Quick contents
  y += 18;
  setFont(11, "bold");
  setText(C.ink);
  doc.text(language === "hi" ? "इस रिपोर्ट में:" : "Inside this report:", M, y);
  y += 16;
  setFont(10, "normal");
  setText(C.ink2);
  const toc: string[] = [];
  if (options.includeSummary && summary.summary) toc.push(`• ${t(language, "planOverview")}`);
  if (options.includeMedications && summary.medications.length > 0)
    toc.push(`• ${t(language, "medications")} (${summary.medications.length})`);
  if (options.includeSummary && summary.red_flags.length > 0)
    toc.push(`• ${t(language, "redFlags")} (${summary.red_flags.length})`);
  if (options.includeSummary && summary.follow_up.length > 0)
    toc.push(`• ${t(language, "followUp")} (${summary.follow_up.length})`);
  if (options.includeSymptoms && symptoms.length > 0)
    toc.push(`• ${t(language, "symptomHistory")} (${symptoms.length})`);
  for (const item of toc) {
    doc.text(item, M + 8, y);
    y += 14;
  }

  drawPageFooter();
  doc.addPage();
  pageNum += 1;
  y = M;
  drawPageHeader();

  /* ----------- SECTIONS ----------- */

  if (options.includeSummary && summary.summary) {
    sectionHeading(t(language, "planOverview"), C.accent);
    setFill(C.accentSoft);
    const para = doc.splitTextToSize(summary.summary, TEXT_W - 24);
    const boxH = para.length * 14 + 20;
    ensureSpace(boxH + 4);
    doc.roundedRect(M, y - 4, TEXT_W, boxH, 8, 8, "F");
    y += 12;
    for (const line of para) {
      setFont(10.5, "normal");
      setText(C.ink);
      doc.text(line, M + 12, y);
      y += 14;
    }
    y += 8;
  }

  if (options.includeMedications && summary.medications.length > 0) {
    sectionHeading(t(language, "medications"), C.accent2);
    drawMedicationsTable(summary, language);
  }

  if (options.includeSummary && summary.red_flags.length > 0) {
    sectionHeading(t(language, "redFlags"), C.danger);
    drawRedFlagsLegend(language);
    drawRedFlagsGrouped(summary.red_flags, language);
  }

  if (options.includeSummary && summary.follow_up.length > 0) {
    sectionHeading(t(language, "followUp"), C.accent);
    drawFollowupsTable(summary, language);
  }

  if (options.includeSymptoms && symptoms.length > 0) {
    sectionHeading(t(language, "symptomHistory"), C.accent2);
    drawSymptomsTable(symptoms, language);
  }

  drawPageFooter();

  const filename = `swayam-summary-${new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);

  // Trigger a real download via an anchor click
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Also open in a new tab so the user sees the result immediately
  window.open(url, "_blank");

  // Release the object URL after a delay to allow the new tab to load
  setTimeout(() => URL.revokeObjectURL(url), 60_000);

  return { filename, url };

  /* ============== HELPERS BOUND TO doc / y ============== */

  function drawCountsStrip(s: DischargeSummary, opts: ShareOptions, syms: SymptomLogEntry[]) {
    const items: Array<{ label: string; value: number; color: string }> = [];
    if (opts.includeMedications) items.push({ label: language === "hi" ? "दवाइयाँ" : "Medications", value: s.medications.length, color: C.accent2 });
    if (opts.includeSummary) items.push({ label: language === "hi" ? "चेतावनी" : "Red flags", value: s.red_flags.length, color: C.danger });
    if (opts.includeSummary) items.push({ label: language === "hi" ? "फॉलो-अप" : "Follow-ups", value: s.follow_up.length, color: C.accent });
    if (opts.includeSymptoms) items.push({ label: language === "hi" ? "लक्षण लॉग" : "Symptom logs", value: syms.length, color: C.ink2 });
    if (items.length === 0) return;
    const tileW = (TEXT_W - (items.length - 1) * 8) / items.length;
    let x = M;
    for (const item of items) {
      setFill(C.white);
      setStroke(C.line);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, tileW, 56, 8, 8, "FD");
      setFont(20, "bold");
      setText(item.color);
      doc.text(String(item.value), x + 12, y + 28);
      setFont(8, "normal");
      setText(C.ink3);
      doc.text(item.label.toUpperCase(), x + 12, y + 46, { maxWidth: tileW - 16 });
      x += tileW + 8;
    }
    y += 56;
  }

  function drawDisclaimerCard(lang: Language) {
    const lines = doc.splitTextToSize(t(lang, "disclaimer"), TEXT_W - 24);
    const h = lines.length * 12 + 16;
    setFill(C.accent2Soft);
    doc.roundedRect(M, y, TEXT_W, h, 8, 8, "F");
    setFont(9, "bold");
    setText(C.accent2Ink);
    doc.text(lang === "hi" ? "ध्यान दें" : "Important", M + 12, y + 14);
    setFont(9, "normal");
    let ly = y + 28;
    for (const line of lines) {
      doc.text(line, M + 12, ly);
      ly += 12;
    }
    y += h;
  }

  function drawMedicationsTable(s: DischargeSummary, lang: Language) {
    const cols = [
      { key: "name", label: lang === "hi" ? "दवा" : "Medication", w: 0.22 },
      { key: "purpose", label: lang === "hi" ? "किसके लिए" : "Used for", w: 0.22 },
      { key: "dose", label: lang === "hi" ? "मात्रा" : "Dose", w: 0.14 },
      { key: "frequency", label: lang === "hi" ? "कब लें" : "How often", w: 0.18 },
      { key: "times", label: lang === "hi" ? "समय" : "Schedule", w: 0.24 },
    ];
    drawTableHeader(cols, C.accent2Soft, C.accent2Ink);
    for (let i = 0; i < s.medications.length; i++) {
      const m = s.medications[i];
      const schedule =
        m.times && m.times.length > 0
          ? m.times.join(" · ")
          : lang === "hi"
            ? "ज़रूरत पड़ने पर"
            : "PRN / as needed";
      const row = [m.name, m.purpose || "—", m.dose, m.frequency, schedule];
      drawTableRow(cols, row, i % 2 === 1);
    }
    y += 6;
  }

  function drawFollowupsTable(s: DischargeSummary, lang: Language) {
    const cols = [
      { key: "task", label: lang === "hi" ? "कार्य" : "What", w: 0.40 },
      { key: "deadline", label: lang === "hi" ? "कब तक" : "When", w: 0.28 },
      { key: "contact", label: lang === "hi" ? "संपर्क" : "Contact", w: 0.32 },
    ];
    drawTableHeader(cols, C.accentSoft, C.accentInk);
    for (let i = 0; i < s.follow_up.length; i++) {
      const f = s.follow_up[i];
      drawTableRow(cols, [f.task, f.deadline, f.contact || "—"], i % 2 === 1);
    }
    y += 6;
  }

  function drawSymptomsTable(syms: SymptomLogEntry[], lang: Language) {
    const cols = [
      { key: "when", label: lang === "hi" ? "समय" : "Date", w: 0.22 },
      { key: "symptom", label: lang === "hi" ? "लक्षण" : "Symptom", w: 0.40 },
      { key: "urgency", label: lang === "hi" ? "स्तर" : "Level", w: 0.16 },
      { key: "advice", label: lang === "hi" ? "सलाह" : "Advice", w: 0.22 },
    ];
    drawTableHeader(cols, C.accent2Soft, C.accent2Ink);
    for (let i = 0; i < syms.slice(0, 30).length; i++) {
      const e = syms[i];
      const when = new Date(e.timestamp).toLocaleString(lang === "hi" ? "hi-IN" : "en-US", {
        dateStyle: "short",
        timeStyle: "short",
      });
      drawTableRow(
        cols,
        [when, e.symptom, e.result.urgency.toUpperCase(), e.result.advice || "—"],
        i % 2 === 1,
      );
    }
    y += 6;
  }

  function drawTableHeader(cols: Array<{ label: string; w: number }>, bg: string, fg: string) {
    ensureSpace(28);
    setFill(bg);
    doc.rect(M, y - 12, TEXT_W, 22, "F");
    setFont(9, "bold");
    setText(fg);
    let x = M + 8;
    for (const c of cols) {
      doc.text(c.label.toUpperCase(), x, y + 2);
      x += c.w * TEXT_W;
    }
    y += 14;
  }

  function drawTableRow(
    cols: Array<{ label: string; w: number }>,
    values: string[],
    striped: boolean,
  ) {
    // Pre-measure tallest cell
    setFont(9.5, "normal");
    let maxLines = 1;
    const wrapped: string[][] = [];
    for (let i = 0; i < cols.length; i++) {
      const w = cols[i].w * TEXT_W - 16;
      const lines = doc.splitTextToSize(values[i] || "", w);
      wrapped.push(lines);
      maxLines = Math.max(maxLines, lines.length);
    }
    const rowH = maxLines * 12 + 8;
    ensureSpace(rowH + 2);
    if (striped) {
      setFill(C.line2);
      doc.rect(M, y - 8, TEXT_W, rowH, "F");
    }
    let x = M + 8;
    for (let i = 0; i < cols.length; i++) {
      setText(C.ink);
      let ly = y + 2;
      for (const line of wrapped[i]) {
        doc.text(line, x, ly);
        ly += 12;
      }
      x += cols[i].w * TEXT_W;
    }
    setStroke(C.line);
    doc.setLineWidth(0.3);
    doc.line(M, y + rowH - 8, PAGE_W - M, y + rowH - 8);
    y += rowH;
  }

  function drawRedFlagCard(flag: RedFlag, lang: Language) {
    const sevColor =
      flag.severity === "emergency" ? C.danger : flag.severity === "urgent" ? C.accent2 : C.ink2;
    const sevSoft =
      flag.severity === "emergency"
        ? C.dangerSoft
        : flag.severity === "urgent"
          ? C.accent2Soft
          : C.line2;
    const sevLabel =
      flag.severity === "emergency"
        ? lang === "hi" ? "आपातकाल" : "EMERGENCY"
        : flag.severity === "urgent"
          ? lang === "hi" ? "आज ही फोन करें" : "URGENT"
          : lang === "hi" ? "ध्यान रखें" : "WATCH";

    // Pre-measure
    setFont(10, "normal");
    const descLines = flag.description ? doc.splitTextToSize(flag.description, TEXT_W - 28) : [];
    const watchLines = flag.watch_for ? doc.splitTextToSize(flag.watch_for, TEXT_W - 28) : [];
    const callLines = flag.when_to_call ? doc.splitTextToSize(flag.when_to_call, TEXT_W - 28) : [];
    const examples = Array.isArray(flag.examples) ? flag.examples : [];
    const exampleLines: string[][] = examples.map((ex) =>
      doc.splitTextToSize(ex, TEXT_W - 40),
    );
    const labelGap = 14;
    const rowH = descLines.length * 12;
    const watchH = watchLines.length ? labelGap + watchLines.length * 12 : 0;
    const exH = examples.length
      ? labelGap + exampleLines.reduce((n, l) => n + l.length * 12, 0) + 4
      : 0;
    const callH = callLines.length ? labelGap + callLines.length * 12 + 6 : 0;
    const cardH = 30 + rowH + exH + watchH + callH + 18;

    ensureSpace(cardH + 6);

    setFill(sevSoft);
    doc.roundedRect(M, y, TEXT_W, cardH, 8, 8, "F");
    setFill(sevColor);
    doc.rect(M, y, 4, cardH, "F");

    // Header (symptom + severity chip)
    setFont(11.5, "bold");
    setText(C.ink);
    doc.text(flag.symptom, M + 14, y + 18);
    setFont(8, "bold");
    setText(C.white);
    const sevW = doc.getTextWidth(sevLabel) + 14;
    setFill(sevColor);
    doc.roundedRect(PAGE_W - M - sevW - 8, y + 8, sevW, 16, 8, 8, "F");
    doc.text(sevLabel, PAGE_W - M - sevW / 2 - 8, y + 19, { align: "center" });

    let cy = y + 34;
    if (descLines.length) {
      setFont(10, "normal");
      setText(C.ink2);
      for (const line of descLines) {
        doc.text(line, M + 14, cy);
        cy += 12;
      }
    }
    if (examples.length) {
      cy += 4;
      setFont(8, "bold");
      setText(C.ink3);
      doc.text(
        (lang === "hi" ? "स्पष्ट संकेत" : "CONCRETE SIGNS").toUpperCase(),
        M + 14,
        cy,
      );
      cy += 10;
      setFont(10, "normal");
      setText(C.ink);
      for (const lines of exampleLines) {
        // bullet
        setFill(sevColor);
        doc.circle(M + 18, cy - 3, 1.5, "F");
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], M + 26, cy);
          cy += 12;
        }
      }
    }
    if (watchLines.length) {
      cy += 4;
      setFont(8, "bold");
      setText(C.ink3);
      doc.text(lang === "hi" ? "ध्यान दें" : "WATCH FOR", M + 14, cy);
      cy += 10;
      setFont(10, "normal");
      setText(C.ink2);
      for (const line of watchLines) {
        doc.text(line, M + 14, cy);
        cy += 12;
      }
    }
    if (callLines.length) {
      cy += 6;
      setFont(8, "bold");
      setText(sevColor);
      doc.text(lang === "hi" ? "क्या करें" : "WHEN TO CALL", M + 14, cy);
      cy += 10;
      setFont(10, "bold");
      setText(C.ink);
      for (const line of callLines) {
        doc.text(line, M + 14, cy);
        cy += 12;
      }
    }

    y += cardH + 8;
  }

  function drawSeverityChart(s: DischargeSummary, lang: Language) {
    const counts: Record<"emergency" | "urgent" | "watch", number> = {
      emergency: 0,
      urgent: 0,
      watch: 0,
    };
    for (const f of s.red_flags) counts[f.severity]++;
    const total = counts.emergency + counts.urgent + counts.watch;
    if (total === 0) return;

    const cardH = 96;
    setFill(C.white);
    setStroke(C.line);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, y, TEXT_W, cardH, 10, 10, "FD");

    setFont(10, "bold");
    setText(C.ink);
    doc.text(
      lang === "hi" ? "गंभीरता वितरण" : "Severity distribution",
      M + 14,
      y + 18,
    );
    setFont(8, "normal");
    setText(C.ink3);
    doc.text(
      lang === "hi"
        ? `${total} चेतावनी लक्षण`
        : `${total} warning symptoms`,
      M + 14,
      y + 30,
    );

    // Stacked bar
    const barX = M + 14;
    const barY = y + 44;
    const barW = TEXT_W - 28;
    const barH = 12;
    const segs: Array<{ count: number; color: string }> = [
      { count: counts.emergency, color: C.danger },
      { count: counts.urgent, color: C.accent2 },
      { count: counts.watch, color: C.ink3 },
    ];
    let cx = barX;
    setStroke(C.line2);
    setFill(C.line2);
    doc.roundedRect(barX, barY, barW, barH, 6, 6, "FD");
    for (const seg of segs) {
      if (seg.count === 0) continue;
      const w = (seg.count / total) * barW;
      setFill(seg.color);
      doc.rect(cx, barY, w, barH, "F");
      cx += w;
    }
    // Round corner mask
    setFill(C.white);
    // (skipping rounded corner masking for simplicity — looks fine without)

    // Legend
    const legendY = barY + barH + 16;
    const items: Array<{ label: string; count: number; color: string }> = [
      {
        label: lang === "hi" ? "आपातकाल" : "Emergency",
        count: counts.emergency,
        color: C.danger,
      },
      {
        label: lang === "hi" ? "तत्काल" : "Urgent",
        count: counts.urgent,
        color: C.accent2,
      },
      {
        label: lang === "hi" ? "निगरानी" : "Watch",
        count: counts.watch,
        color: C.ink3,
      },
    ];
    let lx = barX;
    const colW = barW / 3;
    for (const it of items) {
      setFill(it.color);
      doc.circle(lx + 4, legendY - 3, 3, "F");
      setFont(9, "bold");
      setText(C.ink);
      doc.text(String(it.count), lx + 12, legendY);
      setFont(8, "normal");
      setText(C.ink3);
      doc.text(it.label, lx + 12 + doc.getTextWidth(String(it.count)) + 4, legendY);
      lx += colW;
    }

    y += cardH;
  }

  function drawRedFlagsLegend(lang: Language) {
    setFont(8.5, "normal");
    setText(C.ink3);
    const txt =
      lang === "hi"
        ? "श्रेणी अनुसार समूहित। बाएँ रंग की पट्टी गंभीरता दर्शाती है।"
        : "Grouped by category. The colored stripe on the left shows severity.";
    doc.text(txt, M, y);
    y += 14;
  }

  function drawRedFlagsGrouped(flags: RedFlag[], lang: Language) {
    const grouped = new Map<RedFlagCategory, RedFlag[]>();
    for (const f of flags) {
      const cat = (f.category ?? "other") as RedFlagCategory;
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(f);
    }
    const sevOrder = { emergency: 0, urgent: 1, watch: 2 } as const;
    for (const cat of CATEGORY_ORDER) {
      const list = grouped.get(cat);
      if (!list || list.length === 0) continue;
      // Sub-heading
      ensureSpace(28);
      setFont(10, "bold");
      setText(C.accentInk);
      doc.text(t(lang, CATEGORY_KEY[cat]).toUpperCase(), M, y + 4);
      y += 14;
      const sorted = [...list].sort(
        (a, b) => sevOrder[a.severity] - sevOrder[b.severity],
      );
      for (const flag of sorted) {
        drawRedFlagCard(flag, lang);
      }
      y += 4;
    }
  }
}
