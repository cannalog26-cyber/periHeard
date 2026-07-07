import type { Brief } from "@/lib/brief-types";
import {
  AlertTriangle,
  Clock,
  Activity,
  HeartHandshake,
  MessageSquareQuote,
  ShieldAlert,
  Stethoscope,
  ListChecks,
  Briefcase,
  Copy,
  Check,
  Printer,
} from "lucide-react";
import { useState } from "react";
import { openBriefForPrint } from "@/lib/print-brief";

function Section({
  icon: Icon,
  title,
  children,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "urgent" | "warning";
}) {
  const toneClass =
    tone === "urgent"
      ? "bg-[color:var(--urgent)]/8 border-[color:var(--urgent)]/30"
      : tone === "warning"
        ? "bg-[color:var(--warning)]/10 border-[color:var(--warning)]/30"
        : "bg-card border-border";
  const iconClass =
    tone === "urgent"
      ? "text-[color:var(--urgent)]"
      : tone === "warning"
        ? "text-[color:var(--warning-foreground)]"
        : "text-primary";
  return (
    <section className={`rounded-2xl border ${toneClass} p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
          {title}
        </h3>
      </div>
      <div className="text-[15px] leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function briefToPlainText(b: Brief): string {
  const lines: string[] = [];
  if (b.urgent_banner) lines.push(`URGENT: ${b.urgent_banner}`, "");
  if (b.one_line_summary) lines.push(`Opening line: ${b.one_line_summary}`, "");
  if (b.symptom_summary?.length) {
    lines.push("Symptoms:");
    for (const s of b.symptom_summary) {
      lines.push(`- ${s.cluster}: ${s.detail} (${s.duration_pattern})`);
    }
    lines.push("");
  }
  if (b.timeline) lines.push(`Timeline: ${b.timeline}`, "");
  if (b.impact_statement) lines.push(`Impact: ${b.impact_statement}`, "");
  if (b.already_tried?.length) {
    lines.push("Already tried:");
    b.already_tried.forEach((x) => lines.push(`- ${x}`));
    lines.push("");
  }
  if (b.questions_to_ask?.length) {
    lines.push("Questions to ask:");
    b.questions_to_ask.forEach((x) => lines.push(`- ${x}`));
    lines.push("");
  }
  if (b.if_dismissed?.length) {
    lines.push("If dismissed, try:");
    b.if_dismissed.forEach((x) => lines.push(`- ${x}`));
    lines.push("");
  }
  if (b.red_flags?.length) {
    lines.push("Red flags:");
    b.red_flags.forEach((x) => lines.push(`- ${x}`));
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function BriefCard({ brief }: { brief: Brief }) {
  if (brief.out_of_scope) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-[15px] leading-relaxed">{brief.out_of_scope}</p>
        {brief.disclaimer && (
          <p className="mt-4 text-xs text-muted-foreground italic">{brief.disclaimer}</p>
        )}
      </div>
    );
  }

  if (brief.clarifying_questions?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-serif text-xl mb-2">A few things would help me build a stronger brief</h3>
        <ul className="space-y-2 mt-3">
          {brief.clarifying_questions.map((q, i) => (
            <li key={i} className="flex gap-2 text-[15px]">
              <span className="text-accent">•</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
        {brief.disclaimer && (
          <p className="mt-4 text-xs text-muted-foreground italic">{brief.disclaimer}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {brief.urgent_banner && (
        <div className="rounded-2xl border-2 border-[color:var(--urgent)]/40 bg-[color:var(--urgent)]/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[color:var(--urgent)] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--urgent)] mb-1">
                Please read first
              </p>
              <p className="text-[15px] font-medium text-foreground leading-relaxed">
                {brief.urgent_banner}
              </p>
            </div>
          </div>
        </div>
      )}

      {brief.one_line_summary && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Open the appointment with this
            </p>
            <CopyButton text={brief.one_line_summary} />
          </div>
          <p className="font-serif text-lg leading-snug text-foreground">
            &ldquo;{brief.one_line_summary}&rdquo;
          </p>
        </div>
      )}

      {brief.symptom_summary?.length > 0 && (
        <Section icon={Activity} title="Symptom summary">
          <ul className="space-y-3">
            {brief.symptom_summary.map((s, i) => (
              <li key={i} className="border-l-2 border-accent/40 pl-3">
                <div className="font-medium text-foreground">{s.cluster}</div>
                <div className="text-sm text-foreground/80">{s.detail}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.duration_pattern}</div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {brief.timeline && (
        <Section icon={Clock} title="Timeline">
          <p>{brief.timeline}</p>
        </Section>
      )}

      {brief.impact_statement && (
        <Section icon={HeartHandshake} title="Impact on your life">
          <p>{brief.impact_statement}</p>
        </Section>
      )}

      {brief.already_tried?.length > 0 && (
        <Section icon={ListChecks} title="Already tried">
          <ul className="space-y-1.5">
            {brief.already_tried.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent">•</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {brief.questions_to_ask?.length > 0 && (
        <Section icon={Stethoscope} title="Questions to ask your GP">
          <ol className="space-y-2">
            {brief.questions_to_ask.map((q, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-accent font-serif font-semibold shrink-0">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {brief.if_dismissed?.length > 0 && (
        <Section icon={MessageSquareQuote} title="If you feel dismissed, try">
          <ul className="space-y-3">
            {brief.if_dismissed.map((x, i) => (
              <li key={i} className="rounded-lg bg-muted/60 p-3 pr-2 flex items-start justify-between gap-2">
                <span className="italic text-foreground/90">&ldquo;{x}&rdquo;</span>
                <CopyButton text={x} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {brief.red_flags?.length > 0 && (
        <Section icon={ShieldAlert} title="Red flags — seek prompt review" tone="urgent">
          <ul className="space-y-1.5">
            {brief.red_flags.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[color:var(--urgent)]">•</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {brief.what_to_expect && (
        <Section icon={Briefcase} title="What a good consultation looks like">
          <p>{brief.what_to_expect}</p>
        </Section>
      )}

      {brief.bring_with_you?.length > 0 && (
        <Section icon={ListChecks} title="Bring with you">
          <ul className="space-y-1.5">
            {brief.bring_with_you.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent">•</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-xs text-muted-foreground italic">{brief.disclaimer}</p>
        <div className="flex items-center gap-1">
          <CopyButton text={briefToPlainText(brief)} />
          <button
            type="button"
            onClick={() => openBriefForPrint(brief)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            <Printer className="h-3.5 w-3.5" />
            Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}