# Post-Discharge Companion

> Built at the **AIC x Anthropic Hackathon** · Biology & Physical Health Track

A web app that transforms hospital discharge summaries — written in clinical jargon by doctors for other doctors — into clear, actionable health plans that patients and caregivers can actually understand.

**Upload a discharge summary → get a plain-language breakdown in seconds.**

---

## The Problem

Most patients walk out of Indian hospitals holding a discharge summary they cannot read. It's written in English medical shorthand, handed over with a 3-minute verbal briefing, and is the *only* document guiding their recovery at home.

This leads to missed medications, wrong dosages, ignored red-flag symptoms, and avoidable hospital readmissions — costing patients a median of ~₹44,000 per readmission. Studies show that poor discharge communication triples the risk of death, and nearly 1 in 8 chronic-disease patients in India is readmitted within four months.

No tool today takes the document the patient already has and turns it into something they can act on.

## What It Does

The patient or a family member uploads a photo or PDF of their discharge summary. The app parses it using Claude's API and returns four outputs:

1. **Plain-language summary** — what happened, in simple sentences, no jargon
2. **Medication schedule** — every drug with dose, timing, food rules, and a one-line reason ("controls blood pressure", "antibiotic — finish all 5 days")
3. **Red-flag symptoms** — specific warning signs derived from *this patient's* diagnosis and medications, with clear "call your doctor" vs "go to ER" guidance
4. **Follow-up checklist** — every appointment with date, doctor, department, and why it matters

## What Makes It Different

- **Zero behavior change** — works on the document the patient already has. Photo → output.
- **Bounded scope** — only explains what the doctor already wrote. Does not diagnose, prescribe, or override. This is a translator, not a doctor.
- **Multilingual** — supports English, Hindi, and regional languages to bridge the actual literacy gap.
- **Caregiver-shareable** — the entire family can access the same medication schedule.
- **Patient-specific alerts** — red-flag symptoms are derived from *this* patient's conditions, not a generic list.

---

## Project Structure

```
├── app/                                  # Next.js app router (pages & API routes)
├── components/                           # Reusable UI components
├── lib/                                  # Utility functions and API helpers
├── types/                                # TypeScript type definitions
├── public/                               # Static assets
├── DesignElements/                       # Design references
├── stitch_medical_recovery_dashboard/    # Dashboard module
├── .env.local.example                    # Environment variable template
├── next.config.js                        # Next.js configuration
├── tailwind.config.ts                    # Tailwind CSS configuration
├── tsconfig.json                         # TypeScript configuration
└── package.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/ByteForge1729/Anthropic_Hackathon.git
cd Anthropic_Hackathon

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Open .env.local and add your Anthropic API key

# 4. Run the dev server
npm run dev
```

The app should now be running at `http://localhost:3000`.

---

## Ethical Design

This project is deliberately constrained:

- **Not a doctor** — the app restates the doctor's existing instructions in plain language. It never adds a dose, recommends a new drug, or provides medical advice.
- **Hallucination guardrails** — outputs are constrained to extract-and-translate. Ambiguous information is flagged ("not sure about this medicine — please verify with your pharmacist") rather than silently guessed.
- **Privacy-first** — minimal data retention, no cross-patient training, explicit consent at upload, option for ephemeral processing.
- **Persistent disclaimer** — every output includes: *"This explains your doctor's instructions. It is not medical advice. Call your doctor if unsure."*

---

## Built With

- [Next.js](https://nextjs.org/) — React framework
- [TypeScript](https://www.typescriptlang.org/) — type safety
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Anthropic Claude API](https://docs.anthropic.com/) — discharge summary parsing and translation

## Hackathon Context

**AIC x Anthropic Hackathon** — 24-hour hackathon judged on Impact Potential (25 pts), Technical Execution (30 pts), Ethical Alignment (25 pts), and Presentation (20 pts).

---

## Team

Tirth Sheth - 25B3915
Srinath Sridhar - 25B1251
