// Client-side keyword heuristics to decide which "quick questions" to ask
// after the user's free-text description. We only ask about topics the user
// hasn't already mentioned.

export type GapQuestionId =
  | "vasomotor"
  | "menstrual"
  | "sleep"
  | "genitourinary"
  | "goal";

const PATTERNS: Record<Exclude<GapQuestionId, "goal">, RegExp> = {
  vasomotor: /\b(hot\s*(flush|flash)es?|night\s*sweats?|sweating|sweats?\b|flushing)\b/i,
  menstrual:
    /\b(period|periods|menstrua\w*|cycle|cycles|bleed\w*|spotting|lmp|last\s+period|menopaus\w*|amenorrhoea|amenorrhea)\b/i,
  sleep:
    /\b(sleep\w*|insomnia|awake|waking|wake\s+up|can'?t\s+sleep|restless\s+nights?|tired|exhaust\w*|fatigue)\b/i,
  genitourinary:
    /\b(vagina\w*|dryness|painful\s+sex|sex\s+is|libido|sex\s*drive|urin\w*|bladder|uti|utis|incontinen\w*|leak\w*|prolapse|pelvic)\b/i,
};

export function detectGaps(text: string): GapQuestionId[] {
  const t = text ?? "";
  const gaps: GapQuestionId[] = [];
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
  vasomotor?: "yes" | "no" | "not_sure";
  menstrual?: { chips: string[]; note?: string };
  sleep?: "fine" | "disturbed" | "very_poor";
  genitourinary?: "yes" | "no" | "prefer_not";
  goal?: string[];
};

export function formatAnswersForBrief(answers: GapAnswers): string {
  const lines: string[] = [];
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