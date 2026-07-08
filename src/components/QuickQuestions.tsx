import { useState } from "react";
import { ArrowUp } from "lucide-react";
import {
  type GapAnswers,
  type GapQuestionId,
  MENSTRUAL_CHIPS,
  GOAL_CHIPS,
} from "@/lib/gap-detection";
import { cn } from "@/lib/utils";

type Props = {
  questions: GapQuestionId[];
  onSubmit: (answers: GapAnswers) => void;
  onSkip: () => void;
  disabled?: boolean;
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors",
        active
          ? "bg-cta text-cta-foreground border-cta"
          : "bg-input-card text-foreground border-input-card-border hover:border-secondary/60",
      )}
    >
      {children}
    </button>
  );
}

export function QuickQuestions({ questions, onSubmit, onSkip, disabled }: Props) {
  const [answers, setAnswers] = useState<GapAnswers>({});

  const update = <K extends keyof GapAnswers>(k: K, v: GapAnswers[K]) =>
    setAnswers((prev) => ({ ...prev, [k]: v }));

  const toggleMenstrualChip = (chip: string) => {
    setAnswers((prev) => {
      const current = prev.menstrual ?? { chips: [], note: "" };
      const has = current.chips.includes(chip);
      return {
        ...prev,
        menstrual: {
          ...current,
          chips: has ? current.chips.filter((c) => c !== chip) : [...current.chips, chip],
        },
      };
    });
  };

  const toggleGoal = (chip: string) => {
    setAnswers((prev) => {
      const current = prev.goal ?? [];
      const has = current.includes(chip);
      return { ...prev, goal: has ? current.filter((c) => c !== chip) : [...current, chip] };
    });
  };

  return (
    <div className="rounded-2xl border border-input-card-border bg-input-card shadow-sm p-5 sm:p-6 space-y-6">
      <div className="space-y-1">
        <h3 className="font-serif text-2xl font-semibold text-foreground">A few quick questions</h3>
        <p className="text-sm text-muted-foreground">
          These help fill in the picture so your brief is as useful as possible. All optional - skip
          any that don't apply.
        </p>
      </div>

      {questions.includes("vasomotor") && (
        <div className="space-y-2">
          <label className="block text-[15px] font-medium text-foreground">
            Do you get hot flushes or night sweats?
          </label>
          <div className="flex flex-wrap gap-2">
            {(["yes", "no", "not_sure"] as const).map((v) => (
              <Chip
                key={v}
                active={answers.vasomotor === v}
                onClick={() => update("vasomotor", answers.vasomotor === v ? undefined : v)}
              >
                {v === "yes" ? "Yes" : v === "no" ? "No" : "Not sure"}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {questions.includes("menstrual") && (
        <div className="space-y-2">
          <label className="block text-[15px] font-medium text-foreground">
            Tell us a bit about your periods: roughly when was your last one, and what's changed?
          </label>
          <div className="flex flex-wrap gap-2">
            {MENSTRUAL_CHIPS.map((chip) => (
              <Chip
                key={chip}
                active={!!answers.menstrual?.chips.includes(chip)}
                onClick={() => toggleMenstrualChip(chip)}
              >
                {chip}
              </Chip>
            ))}
          </div>
          <textarea
            value={answers.menstrual?.note ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({
                ...prev,
                menstrual: { chips: prev.menstrual?.chips ?? [], note: e.target.value },
              }))
            }
            rows={2}
            placeholder="Optional - e.g. last period was about 3 months ago, or anything else that feels relevant"
            className="w-full mt-1 rounded-xl border border-input-card-border bg-background/40 px-3 py-2 text-[14px] leading-relaxed placeholder:text-foreground/60 focus:outline-none focus:border-secondary/60"
          />
        </div>
      )}

      {questions.includes("sleep") && (
        <div className="space-y-2">
          <label className="block text-[15px] font-medium text-foreground">How's your sleep?</label>
          <div className="flex flex-wrap gap-2">
            {(["fine", "disturbed", "very_poor"] as const).map((v) => (
              <Chip
                key={v}
                active={answers.sleep === v}
                onClick={() => update("sleep", answers.sleep === v ? undefined : v)}
              >
                {v === "fine" ? "Fine" : v === "disturbed" ? "Disturbed" : "Very poor"}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {questions.includes("genitourinary") && (
        <div className="space-y-2">
          <label className="block text-[15px] font-medium text-foreground">
            Some symptoms are easy to overlook or feel awkward to mention - any vaginal dryness,
            discomfort during sex, or urinary changes?
          </label>
          <div className="flex flex-wrap gap-2">
            {(["yes", "no", "prefer_not"] as const).map((v) => (
              <Chip
                key={v}
                active={answers.genitourinary === v}
                onClick={() => update("genitourinary", answers.genitourinary === v ? undefined : v)}
              >
                {v === "yes" ? "Yes" : v === "no" ? "No" : "Prefer not to say"}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {questions.includes("already_tried") && (
        <div className="space-y-2">
          <label className="block text-[15px] font-medium text-foreground">
            Have you seen a GP about this before, or tried anything yourself (medication,
            supplements, lifestyle changes)?
          </label>
          <textarea
            value={answers.already_tried ?? ""}
            onChange={(e) => update("already_tried", e.target.value)}
            rows={2}
            placeholder="Optional"
            className="w-full rounded-xl border border-input-card-border bg-background/40 px-3 py-2 text-[14px] leading-relaxed placeholder:text-foreground/60 focus:outline-none focus:border-secondary/60"
          />
        </div>
      )}

      {questions.includes("goal") && (
        <div className="space-y-2">
          <label className="block text-[15px] font-medium text-foreground">
            What would you most like from this appointment?
          </label>
          <div className="flex flex-wrap gap-2">
            {GOAL_CHIPS.map((chip) => (
              <Chip
                key={chip}
                active={!!answers.goal?.includes(chip)}
                onClick={() => toggleGoal(chip)}
              >
                {chip}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button
          onClick={() => onSubmit(answers)}
          disabled={disabled}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-12 rounded-full bg-cta text-cta-foreground text-sm font-bold hover:bg-cta/90 disabled:opacity-40 transition-all shadow-sm"
        >
          Build my brief
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          onClick={onSkip}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-1.5 h-12 px-5 rounded-full border border-cta/40 text-cta text-sm font-medium hover:bg-cta/10 disabled:opacity-40 transition-all"
        >
          Skip
        </button>
      </div>
    </div>
  );
}