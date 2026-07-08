import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { ArrowUp, RotateCcw, Sparkles, Stethoscope, UserCircle2 } from "lucide-react";
import { BriefCard } from "@/components/BriefCard";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { useConversation } from "@/lib/use-conversation";
import type { Brief, ChatTurn } from "@/lib/brief-types";

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, loading]);

  async function submit() {
    const text = input.trim();
    if (!text || loading) return;
    const userTurn: ChatTurn = { role: "user", text, id: newId(), createdAt: Date.now() };
    const nextTurns: ChatTurn[] = [...turns, userTurn];
    append(userTurn);
    setInput("");
    setLoading(true);
    try {
      const payload = {
        turns: nextTurns.map((t) =>
          t.role === "user" ? { role: "user", text: t.text } : { role: "assistant", brief: t.brief },
        ),
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
      append({ role: "assistant", brief: data.brief, id: newId(), createdAt: Date.now() });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submit();
    }
  }

  const isEmpty = hydrated && turns.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster position="top-center" richColors />
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <h1 className="font-serif text-lg font-semibold">Say This To Your GP</h1>
            </div>
          </div>
          {turns.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Start a new conversation? Your current brief will be cleared.")) {
                  reset();
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New conversation
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-3xl mx-auto px-5 py-8 space-y-6">
          {isEmpty && (
            <section className="text-center py-8 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-accent" />
                Focused on perimenopause &amp; menopause
              </div>
              <h2 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight leading-tight text-foreground">
                Turn your symptoms into a brief your&nbsp;GP will actually&nbsp;act&nbsp;on.
              </h2>
              <p className="text-[15px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Tell it your story in your own words — messy, rambling, whatever. It organises the
                pattern, chronology, and impact into a one-page brief anchored in NICE guidance,
                plus exact wording for the moment you feel dismissed.
              </p>
            </section>
          )}

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
                <BriefCard brief={t.brief} />
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
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-border/60 bg-background/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-5 py-4">
          <div className="rounded-2xl border border-border bg-card shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                turns.length === 0
                  ? "Describe what you've been experiencing — how long, how often, what it stops you doing. Ramble if you need to."
                  : "Add more detail, correct something, or ask a follow-up…"
              }
              rows={4}
              className="w-full bg-transparent resize-none px-4 py-3 text-[15px] leading-relaxed placeholder:text-muted-foreground/70 focus:outline-none"
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
                className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {turns.length === 0 ? "Build my brief" : "Update brief"}
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Not a diagnostic tool. Nothing you type leaves your browser except to build the brief.
            In an emergency call 999.
          </p>
        </div>
      </div>
    </div>
  );
}
