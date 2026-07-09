import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { ArrowUp, Download, Printer, RotateCcw, UserCircle2 } from "lucide-react";
import { BriefCard } from "@/components/BriefCard";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { useConversation } from "@/lib/use-conversation";
import { saveConversationAsPdf, saveBriefAsPdf, openBriefForPrint } from "@/lib/print-brief";
import type { AgeBand, Brief, ChatTurn } from "@/lib/brief-types";
import { Header } from "@/components/Header";
import { QuickQuestions } from "@/components/QuickQuestions";
import {
  detectGaps,
  detectCrisis,
  formatAnswersForBrief,
  hasPerimenopausePattern,
  type GapAnswers,
  type GapQuestionId,
} from "@/lib/gap-detection";

export const Route = createFileRoute("/")({
  component: Index,
});

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function Index() {
  const { turns, append, reset, hydrated } = useConversation();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputOpen, setInputOpen] = useState(false);
  const [gapQuestions, setGapQuestions] = useState<GapQuestionId[] | null>(null);
  const [pendingText, setPendingText] = useState<string>("");
  const [crisisAcknowledged, setCrisisAcknowledged] = useState(false);
  const [crisisPending, setCrisisPending] = useState(false);
  const [noPatternPrompt, setNoPatternPrompt] = useState<{
    text: string;
    ageBand: AgeBand;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-grow the textarea while keeping a comfortable minimum height.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24;
    const minHeight = Math.round(6.5 * lineHeight);
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
  }, [input, inputOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, loading, gapQuestions]);

  async function runBrief(
    userText: string,
    opts?: { ageBand?: AgeBand; mode?: "perimenopause" | "general" },
  ) {
    const userTurn: ChatTurn = {
      role: "user",
      text: userText,
      id: newId(),
      createdAt: Date.now(),
    };
    const nextTurns: ChatTurn[] = [...turns, userTurn];
    append(userTurn);
    setLoading(true);
    try {
      const payload = {
        turns: nextTurns.map((t) =>
          t.role === "user" ? { role: "user", text: t.text } : { role: "assistant", brief: t.brief },
        ),
        ageBand: opts?.ageBand,
        mode: opts?.mode,
      };
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { brief?: Brief; error?: string };
      if (!res.ok || !data.brief) {
        throw new Error(data.error ?? "Something went wrong.");
      }
      append({
        role: "assistant",
        brief: data.brief,
        id: newId(),
        createdAt: Date.now(),
        ageBand: opts?.ageBand,
        mode: opts?.mode,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setInputOpen(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function submit() {
    const text = input.trim();
    if (!text || loading) return;
    // First submission: interpose quick questions to fill clinical gaps.
    if (turns.length === 0) {
      // Crisis signposting always leads.
      if (!crisisAcknowledged && detectCrisis(text)) {
        setPendingText(text);
        setInput("");
        setCrisisPending(true);
        return;
      }
      const gaps = detectGaps(text);
      setPendingText(text);
      setInput("");
      setGapQuestions(gaps);
      return;
    }
    setInput("");
    void runBrief(text);
  }

  function handleGapSubmit(answers: GapAnswers) {
    const ageBand = (answers.age ?? "45_plus") as AgeBand;
    const combined = pendingText + formatAnswersForBrief(answers);
    const perimenopausePattern = hasPerimenopausePattern(pendingText, answers);
    setGapQuestions(null);
    if (!perimenopausePattern) {
      // Don't push a perimenopause-framed brief for an unrelated pattern.
      setNoPatternPrompt({ text: combined, ageBand });
      setPendingText("");
      return;
    }
    setPendingText("");
    void runBrief(combined, { ageBand, mode: "perimenopause" });
  }

  function handleGapSkip() {
    // Age is required, so QuickQuestions blocks skip until age is set.
    // We reuse handleGapSubmit's logic by treating skip as "submit with only age".
    // In practice QuickQuestions won't call skip with no age; guard anyway.
    handleGapSubmit({});
  }

  function acknowledgeCrisisAndContinue() {
    setCrisisAcknowledged(true);
    setCrisisPending(false);
    const gaps = detectGaps(pendingText);
    setGapQuestions(gaps);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submit();
    }
  }

  const isEmpty =
    hydrated && turns.length === 0 && !gapQuestions && !crisisPending && !noPatternPrompt;
  const showingGaps = hydrated && turns.length === 0 && !!gapQuestions;
  const showingCrisis = hydrated && turns.length === 0 && crisisPending;
  const showingNoPattern = hydrated && turns.length === 0 && !!noPatternPrompt;
  const latestBrief = [...turns].reverse().find(
    (t): t is ChatTurn & { brief: Brief } => t.role === "assistant" && !!t.brief,
  )?.brief;
  const latestAssistant = [...turns].reverse().find(
    (t): t is Extract<ChatTurn, { role: "assistant" }> => t.role === "assistant",
  );
  const latestAgeBand = latestAssistant?.ageBand;

  const chatInput = (expanded = false) => (
    <>
      <div
        className="rounded-2xl border border-input-card-border shadow-sm focus-within:border-secondary/50 focus-within:ring-2 focus-within:ring-secondary/30 transition-all overflow-hidden bg-input-card"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            turns.length === 0
              ? "Describe what you've been experiencing - how long, how often, what it stops you doing. Ramble if you need to."
              : "Add more detail, correct something, or ask a follow-up…"
          }
          rows={6}
          className="w-full resize-none px-4 py-3 text-[15px] leading-relaxed placeholder:text-foreground/75 focus:outline-none bg-transparent min-h-[160px]"
        />
        <div className="flex items-center justify-between gap-3 px-3 pb-3">
          <VoiceRecorder
            disabled={loading}
            onTranscript={(t) => {
              setInput((prev) => (prev ? prev + " " + t : t));
              textareaRef.current?.focus();
            }}
          />
              <button
                onClick={submit}
                disabled={!input.trim() || loading}
                className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-cta text-cta-foreground text-sm font-bold hover:bg-cta/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {turns.length === 0 ? "Build My Brief" : "Update Brief"}
                <ArrowUp className="h-4 w-4" />
              </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background-bottom">
      <Toaster position="top-center" richColors />
      <Header
        actions={
          turns.length > 0 ? (
            <>
              <button
                onClick={() => {
                  void saveConversationAsPdf(turns);
                }}
                title="Save conversation"
                aria-label="Save conversation"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Save conversation</span>
              </button>
              <button
                onClick={() => {
                  if (confirm("Start a new conversation? Your current brief will be cleared.")) {
                    reset();
                    setTimeout(() => textareaRef.current?.focus(), 50);
                  }
                }}
                title="New conversation"
                aria-label="New conversation"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">New conversation</span>
              </button>
            </>
          ) : null
        }
      />

      <main className="flex-1 w-full flex flex-col">
        {isEmpty ? (
          <div id="brief-builder" className="max-w-3xl mx-auto px-5 py-5 flex-1 flex flex-col items-center gap-3">
            <section className="text-center space-y-2">
              <h2 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight leading-tight text-foreground">
                Turn your symptoms into a brief your&nbsp;GP will actually&nbsp;act&nbsp;on.
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                1 in 5 women say they've been brushed off. We built periHeard so everyone walks in prepared, and walks out heard.
              </p>
            </section>
            <div className="w-full flex flex-col">
              {chatInput(true)}
            </div>
            <p className="text-[11px] text-foreground/75 text-center leading-relaxed max-w-xl">
              This tool is intended to support symptom awareness and consultation preparation. It does not provide a diagnosis or replace medical advice.
            </p>
          </div>
        ) : showingGaps ? (
          <div className="max-w-3xl mx-auto px-5 py-8 w-full">
            <QuickQuestions
              questions={gapQuestions!}
              onSubmit={handleGapSubmit}
              onSkip={handleGapSkip}
              disabled={loading}
            />
            <div ref={bottomRef} />
          </div>
        ) : showingCrisis ? (
          <div className="max-w-3xl mx-auto px-5 py-8 w-full space-y-4">
            <div className="rounded-2xl border-2 border-[color:var(--urgent)]/40 bg-[color:var(--urgent)]/8 p-6 sm:p-7 space-y-4">
              <h3 className="font-serif text-2xl font-semibold text-foreground">
                Thank you for telling me — you don't have to go through this on your own.
              </h3>
              <p className="text-[15px] leading-relaxed text-foreground">
                Some of what you wrote suggests you're having a really hard time. Before we
                build anything, please look at these first — they're free, confidential, and there
                right now:
              </p>
              <ul className="space-y-2 text-[15px] leading-relaxed text-foreground">
                <li>
                  <strong>Samaritans</strong> — call <a className="underline" href="tel:116123">116 123</a>{" "}
                  (free, 24 hours a day, every day) or email{" "}
                  <a className="underline" href="mailto:jo@samaritans.org">jo@samaritans.org</a>.
                </li>
                <li>
                  <strong>NHS 111</strong> — call <a className="underline" href="tel:111">111</a> and
                  choose the mental health option for urgent support.
                </li>
                <li>
                  Ask your GP for an <strong>urgent same-day appointment</strong> and tell them how
                  you're feeling.
                </li>
                <li>
                  If you're in immediate danger, please call{" "}
                  <a className="underline" href="tel:999">999</a> or go to your nearest A&amp;E.
                </li>
              </ul>
              <p className="text-[15px] leading-relaxed text-foreground">
                When you're ready, we can still put together a brief for your GP — reaching out for
                that appointment is a good next step too.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={acknowledgeCrisisAndContinue}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-12 rounded-full bg-cta text-cta-foreground text-sm font-bold hover:bg-cta/90 transition-all shadow-sm"
                >
                  Continue and build my GP brief
                </button>
              </div>
            </div>
            <div ref={bottomRef} />
          </div>
        ) : showingNoPattern ? (
          <div className="max-w-3xl mx-auto px-5 py-8 w-full space-y-4">
            <div className="rounded-2xl border border-input-card-border bg-input-card p-6 sm:p-7 space-y-4">
              <h3 className="font-serif text-2xl font-semibold text-foreground">
                Let's make sure this brief actually fits you
              </h3>
              <p className="text-[15px] leading-relaxed text-foreground">
                What you've described doesn't sound like a typical perimenopause pattern — but
                preparing for your GP is still worth doing. Want a general appointment brief
                instead?
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={() => {
                    const p = noPatternPrompt!;
                    setNoPatternPrompt(null);
                    void runBrief(p.text, { ageBand: p.ageBand, mode: "general" });
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-12 rounded-full bg-cta text-cta-foreground text-sm font-bold hover:bg-cta/90 transition-all shadow-sm"
                >
                  Yes — build a general GP brief
                </button>
                <button
                  onClick={() => {
                    setNoPatternPrompt(null);
                    setInput("");
                    setTimeout(() => textareaRef.current?.focus(), 50);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 h-12 px-5 rounded-full border border-cta/40 text-cta text-sm font-medium hover:bg-cta/10 transition-all"
                >
                  Start over
                </button>
              </div>
            </div>
            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-5 py-8 space-y-6">
            {turns.map((t) =>
              t.role === "user" ? (
                <div key={t.id} className="flex gap-3 items-start">
                  <div className="h-8 w-8 rounded-full bg-muted grid place-items-center shrink-0 mt-0.5">
                    <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 rounded-2xl rounded-tl-sm bg-muted/50 border border-border/50 px-4 py-3">
                    <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{t.text}</p>
                  </div>
                </div>
              ) : (
                <div key={t.id}>
                  <BriefCard
                    brief={t.brief}
                    ageBand={t.ageBand ?? latestAgeBand}
                    onUpdateBrief={t.brief === latestBrief ? () => setInputOpen(true) : undefined}
                  />
                </div>
              ),
            )}

            {loading && (
              <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-accent animate-bounce" />
                </div>
                <span className="text-sm text-muted-foreground">Building your brief…</span>
              </div>
            )}

            <div ref={bottomRef} />

            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-3">
              {latestBrief?.disclaimer && (
                <p className="text-sm text-muted-foreground italic leading-relaxed">{latestBrief.disclaimer}</p>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
              </p>
            </div>
          </div>
        )}
      </main>

      {!isEmpty && (
        <div className="sticky bottom-0 border-t border-border/60 bg-background/90 backdrop-blur">
          <div className="max-w-3xl mx-auto px-5 py-4">
            {inputOpen ? (
              chatInput()
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {latestBrief && (
                  <>
                    <button
                      onClick={() => {
                        void saveBriefAsPdf(latestBrief);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 h-12 rounded-full bg-cta text-cta-foreground text-sm font-bold hover:bg-cta/90 transition-all shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download as PDF
                    </button>
                    <button
                      onClick={() => openBriefForPrint(latestBrief)}
                      title="Print"
                      aria-label="Print"
                      className="inline-flex items-center justify-center gap-1.5 h-12 px-4 rounded-full border border-cta/40 text-cta text-sm font-medium hover:bg-cta/10 transition-all"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
