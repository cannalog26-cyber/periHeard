import type { Brief } from "@/lib/brief-types";
import type { AgeBand } from "@/lib/brief-types";
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
  BookOpen,
  ArrowUp,
} from "lucide-react";
import { useState } from "react";

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
        : "text-foreground";
  return (
    <section className={`rounded-2xl border ${toneClass} p-6 sm:p-7`}>
      <div className="flex items-center gap-2.5 mb-4">
        <Icon className={`h-5 w-5 shrink-0 ${iconClass}`} aria-hidden="true" />
        <h3 className="text-[15px] font-bold uppercase tracking-[0.08em] text-foreground">
          {title}
        </h3>
      </div>
      <div className="text-base leading-[1.6] text-foreground">{children}</div>
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
  if (b.urgent_banner && !b.red_flags?.length) lines.push(`URGENT: ${b.urgent_banner}`, "");
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

export function BriefCard({
  brief,
  ageBand,
  onUpdateBrief,
}: {
  brief: Brief;
  ageBand?: AgeBand;
  onUpdateBrief?: () => void;
}) {
  if (brief.out_of_scope) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
        <p className="text-base leading-[1.6] text-foreground">{brief.out_of_scope}</p>
        {brief.disclaimer && (
          <p className="mt-4 text-sm text-muted-foreground italic leading-relaxed">{brief.disclaimer}</p>
        )}
      </div>
    );
  }

  if (brief.clarifying_questions?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
        <h3 className="font-serif text-xl mb-2 text-foreground">A few things would help me build a stronger brief</h3>
        <ul className="space-y-2.5 mt-3">
          {brief.clarifying_questions.map((q, i) => (
            <li key={i} className="flex gap-2 text-base leading-[1.6] text-foreground">
              <span className="text-secondary" aria-hidden="true">•</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
        {brief.disclaimer && (
          <p className="mt-4 text-sm text-muted-foreground italic leading-relaxed">{brief.disclaimer}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {brief.urgent_banner && !brief.red_flags?.length && (
        <div className="rounded-2xl border-2 border-[color:var(--urgent)]/50 bg-[color:var(--urgent)]/10 p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[color:var(--urgent)] mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-[15px] font-bold uppercase tracking-[0.08em] text-[color:var(--urgent)] mb-2">
                Please read first
              </p>
              <p className="text-base font-medium text-foreground leading-[1.6]">
                {brief.urgent_banner}
              </p>
            </div>
          </div>
        </div>
      )}

      {brief.one_line_summary && (
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-[15px] font-bold uppercase tracking-[0.08em] text-foreground">
              Open the appointment with this
            </p>
            <CopyButton text={brief.one_line_summary} />
          </div>
          <p className="font-serif text-xl leading-[1.5] text-foreground">
            &ldquo;{brief.one_line_summary}&rdquo;
          </p>
        </div>
      )}

      {brief.symptom_summary?.length > 0 && (
        <Section icon={Activity} title="Symptom summary">
          <ul className="space-y-4">
            {brief.symptom_summary.map((s, i) => {
              const detail = (s.detail ?? "").trim();
              const duration = (s.duration_pattern ?? "").trim();
              const detailHasDuration =
                duration.length > 0 && detail.toLowerCase().includes(duration.toLowerCase());
              const inline =
                duration && !detailHasDuration ? `${detail} - ${duration}` : detail;
              return (
                <li key={i} className="border-l-2 border-secondary pl-4">
                  <div className="font-semibold text-foreground text-base leading-[1.6]">
                    {s.cluster}
                  </div>
                  <div className="text-base text-foreground leading-[1.6]">{inline}</div>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {(() => {
        const timeline = (brief.timeline ?? "").trim();
        if (!timeline) return null;
        const durations = (brief.symptom_summary ?? [])
          .map((s) => (s.duration_pattern ?? "").trim().toLowerCase())
          .filter(Boolean);
        const uniqueDurations = new Set(durations);
        // Hide timeline when it merely repeats the single shared duration.
        if (
          uniqueDurations.size === 1 &&
          timeline.toLowerCase().includes([...uniqueDurations][0])
        ) {
          return null;
        }
        return (
          <Section icon={Clock} title="Timeline">
            <p>{timeline}</p>
          </Section>
        );
      })()}

      {brief.impact_statement && (
        <Section icon={HeartHandshake} title="Impact on your life">
          <p>{brief.impact_statement}</p>
        </Section>
      )}

      {brief.already_tried?.length > 0 && (
        <Section icon={ListChecks} title="Already tried">
          <ul className="space-y-2">
            {brief.already_tried.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-secondary" aria-hidden="true">•</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {brief.questions_to_ask?.length > 0 && (
        <Section icon={Stethoscope} title="Questions to ask your GP">
          <ol className="space-y-3">
            {brief.questions_to_ask.map((q, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-secondary font-serif font-semibold shrink-0">{i + 1}.</span>
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
              <li key={i} className="rounded-lg bg-background/40 border border-border/60 p-4 pr-2 flex items-start justify-between gap-2">
                <span className="italic text-foreground">&ldquo;{x}&rdquo;</span>
                <CopyButton text={x} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {brief.red_flags?.length > 0 && (
        <Section icon={ShieldAlert} title="Red flags - seek prompt review" tone="urgent">
          <ul className="space-y-2">
            {brief.red_flags.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[color:var(--urgent)]" aria-hidden="true">•</span>
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
          <ul className="space-y-2">
            {brief.bring_with_you.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-secondary" aria-hidden="true">•</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="flex flex-wrap items-center justify-end gap-4 pt-2">
        <div className="flex items-center gap-1">
          <CopyButton text={briefToPlainText(brief)} />
          <button
            type="button"
            onClick={async () => {
              try {
                await saveBriefAsPdf(brief);
                toast.success("PDF downloaded");
              } catch (err) {
                console.error("PDF export failed:", err);
                toast.error("Couldn't save PDF. Please try again.");
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            Save as PDF
          </button>
        </div>
      </div>

      {onUpdateBrief && (
        <button
          type="button"
          onClick={onUpdateBrief}
          className="w-full inline-flex items-center justify-center gap-1.5 h-12 rounded-full bg-cta text-cta-foreground text-sm font-bold hover:bg-cta/90 transition-all shadow-sm"
        >
          Update Brief
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      <Section icon={BookOpen} title="Resources">
        <ul className="space-y-2 text-[15px] text-muted-foreground">
          <li>
            <a
              href="https://www.nice.org.uk/guidance/ng23"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              NICE NG23 — Menopause: diagnosis and management
            </a>
          </li>
          <li>
            <a
              href="https://www.womens-health-concern.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Women's Health Concern
            </a>
          </li>
          <li>
            <a
              href="https://balance-menopause.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Balance Menopause
            </a>
          </li>
          <li>
            <a
              href="https://themenopausecharity.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              The Menopause Charity
            </a>
          </li>
          {(ageBand === "under_35" || ageBand === "35_39") && (
            <li>
              <a
                href="https://www.daisynetwork.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                The Daisy Network — support for premature ovarian insufficiency (POI)
              </a>
            </li>
          )}
        </ul>
      </Section>
    </div>
  );
}