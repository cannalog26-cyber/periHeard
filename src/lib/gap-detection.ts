// Client-side keyword heuristics to decide which "quick questions" to ask
// after the user's free-text description. We only ask about topics the user
// hasn't already mentioned.

export type GapQuestionId =
  | "age"
  | "vasomotor"
  | "menstrual"
  | "sleep"
  | "genitourinary"
  | "goal";

export type AgeBand = "under_35" | "35_39" | "40_44" | "45_plus";

const PATTERNS: Record<"vasomotor" | "menstrual" | "sleep" | "genitourinary", RegExp> = {
  vasomotor: /\b(hot\s*(flush|flash)es?|night\s*sweats?|sweating|sweats?\b|flushing)\b/i,
  menstrual:
    /\b(period|periods|menstrua\w*|cycle|cycles|bleed\w*|spotting|lmp|last\s+period|menopaus\w*|amenorrhoea|amenorrhea)\b/i,
  sleep:
    /\b(sleep\w*|insomnia|awake|waking|wake\s+up|can'?t\s+sleep|restless\s+nights?|tired|exhaust\w*|fatigue)\b/i,
  genitourinary:
    /\b(vagina\w*|dryness|painful\s+sex|pain\w*\s+(?:during|with|having|in)\s+sex|discomfort\w*\s+(?:during|with|having|in)\s+sex|sex\s+is\s+(?:painful|uncomfortable|sore)|sex\s+hurts?|hurts?\s+(?:during|when)\s+sex|dyspareunia|libido|sex\s*drive|urin\w*|bladder|uti|utis|incontinen\w*|leak\w*|prolapse|pelvic)\b/i,
};

// Try to pull an explicit age out of the user's free text. We only match
// clear, self-referential patterns to avoid grabbing arbitrary numbers
// (e.g. "3 months ago", "period of 5 days"). Returns undefined when unsure.
export function extractAge(text: string): number | undefined {
  const t = text ?? "";
  const patterns: RegExp[] = [
    /\bi(?:'|\s+a)?m\s+(\d{2})\b(?!\s*(?:days?|weeks?|months?|years?\s+ago))/i,
    /\bi\s+am\s+(\d{2})\b(?!\s*(?:days?|weeks?|months?|years?\s+ago))/i,
    /\bage[d]?\s+(\d{2})\b/i,
    /\bmy\s+age\s+is\s+(\d{2})\b/i,
    /\b(\d{2})\s*(?:yrs?|years?)\s*old\b/i,
    /\b(\d{2})\s*[- ]?year[- ]?old\b/i,
    /\b(\d{2})\s*yo\b/i,
    /\b(\d{2})\s*[fF]\b/,
    /\b(?:i\s+(?:just\s+)?turned|turning)\s+(\d{2})\b/i,
    /\b(\d{2})\s*(?:th)?\s+birthday\b/i,
    /^\s*(\d{2})\s*(?=[,.\-;:\s])/,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const n = Number.parseInt(m[1], 10);
      if (n >= 12 && n <= 100) return n;
    }
  }
  return undefined;
}

export function detectGaps(text: string): GapQuestionId[] {
  const t = text ?? "";
  const gaps: GapQuestionId[] = [];
  // Age is required, but skip the question if the user already told us.
  if (extractAge(t) === undefined) gaps.push("age");
  // Vasomotor - always ask if not clearly mentioned (diagnostically important)
  if (!PATTERNS.vasomotor.test(t)) gaps.push("vasomotor");
  if (!PATTERNS.menstrual.test(t)) gaps.push("menstrual");
  if (!PATTERNS.sleep.test(t)) gaps.push("sleep");
  if (!PATTERNS.genitourinary.test(t)) gaps.push("genitourinary");
  // Goal is almost never volunteered up-front - always ask.
  gaps.push("goal");
  return gaps;
}

export type GapAnswers = {
  age?: AgeBand;
  ageYears?: number;
  vasomotor?: "yes" | "no" | "not_sure";
  menstrual?: { chips: string[]; note?: string };
  sleep?: "fine" | "disturbed" | "very_poor";
  genitourinary?: "yes" | "no" | "prefer_not";
  goal?: string[];
};

export function formatAnswersForBrief(answers: GapAnswers): string {
  const lines: string[] = [];
  if (typeof answers.ageYears === "number") {
    lines.push(`Age: ${answers.ageYears}.`);
  } else if (answers.age) {
    const map = {
      under_35: "Under 35",
      "35_39": "35–39",
      "40_44": "40–44",
      "45_plus": "45 or over",
    } as const;
    lines.push(`Age band: ${map[answers.age]}.`);
  }
  if (answers.vasomotor) {
    const map = {
      yes: "Yes, experiencing hot flushes and/or night sweats.",
      no: "No hot flushes or night sweats.",
      not_sure: "Not sure whether these are hot flushes or night sweats.",
    } as const;
    lines.push(`Hot flushes / night sweats: ${map[answers.vasomotor]}`);
  }
  if (answers.menstrual) {
    const parts: string[] = [];
    if (answers.menstrual.chips.length) parts.push(answers.menstrual.chips.join(", "));
    if (answers.menstrual.note?.trim()) parts.push(answers.menstrual.note.trim());
    if (parts.length) lines.push(`Periods: ${parts.join(" - ")}`);
  }
  if (answers.sleep) {
    const map = { fine: "Fine", disturbed: "Disturbed", very_poor: "Very poor" } as const;
    lines.push(`Sleep: ${map[answers.sleep]}.`);
  }
  if (answers.genitourinary) {
    const map = {
      yes: "Yes - vaginal dryness, discomfort during sex, and/or urinary changes.",
      no: "No vaginal or urinary symptoms.",
      prefer_not: "Prefers not to say.",
    } as const;
    lines.push(`Vaginal / urinary symptoms: ${map[answers.genitourinary]}`);
  }
  if (answers.goal && answers.goal.length) {
    lines.push(`What I'd most like from this appointment: ${answers.goal.join("; ")}`);
  }
  if (!lines.length) return "";
  return `\n\nAdditional information from a few quick questions:\n- ${lines.join("\n- ")}`;
}

export const MENSTRUAL_CHIPS = [
  "Closer together",
  "Further apart",
  "Heavier",
  "Lighter",
  "Skipping months",
  "Unpredictable",
];

export const GOAL_CHIPS = [
  "A diagnosis or explanation",
  "To discuss HRT",
  "Tests to rule things out",
  "To be taken seriously",
  "Not sure yet",
];

// --- Symptom-pattern check (perimenopause-typical) ---
// True when the free text OR the quick-question answers suggest a
// perimenopause-pattern picture (any vasomotor, menstrual, genitourinary,
// sleep, or other menopause-typical descriptor). Used to avoid framing
// unrelated symptoms as perimenopause.
const PERI_TEXT_PATTERN =
  /\b(hot\s*(flush|flash)es?|night\s*sweats?|sweating|flushing|period|periods|menstrua\w*|cycle|cycles|bleed\w*|spotting|menopaus\w*|amenorrhoea|amenorrhea|vagina\w*|dryness|painful\s+sex|libido|sex\s*drive|urin\w*|bladder|uti|utis|incontinen\w*|brain\s*fog|word.?finding|memory|joint\s*pain|palpitations|hrt|oestrogen|estrogen|hormone|perimenopaus\w*)\b/i;

export function hasPerimenopausePattern(text: string, answers: GapAnswers): boolean {
  if (PERI_TEXT_PATTERN.test(text ?? "")) return true;
  if (answers.vasomotor === "yes") return true;
  if (answers.genitourinary === "yes") return true;
  if (answers.menstrual?.chips && answers.menstrual.chips.length > 0) return true;
  if (answers.menstrual?.note && PERI_TEXT_PATTERN.test(answers.menstrual.note)) return true;
  return false;
}

// --- Crisis / self-harm detection ---
const CRISIS_PATTERN =
  /\b(suicid\w*|kill\s+(myself|me)|end\s+(it\s+all|my\s+life|it)|self.?harm|hurt(ing)?\s+myself|can'?t\s+go\s+on|no\s+reason\s+to\s+live|want\s+to\s+die|don'?t\s+want\s+to\s+be\s+here|take\s+my\s+(own\s+)?life|hopeless(ness)?)\b/i;

export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERN.test(text ?? "");
}