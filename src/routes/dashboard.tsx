import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Activity,
  ArrowLeft,
  Calendar as CalendarIcon,
  FileText,
  Printer,
  Save,
  Trash2,
  TrendingUp,
  Droplet,
  Stethoscope,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useTracker,
  SYMPTOMS,
  emptyEntry,
  todayKey,
  type DailyEntry,
  type Bleeding,
  type SymptomId,
} from "@/lib/use-tracker";
import { useVault } from "@/lib/use-vault";
import { openBriefForPrint } from "@/lib/print-brief";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — Say This To Your GP" },
      {
        name: "description",
        content:
          "Track your perimenopause symptoms day by day and keep every GP brief in one place.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

const BLEEDING: { value: Bleeding; label: string }[] = [
  { value: "none", label: "None" },
  { value: "spotting", label: "Spotting" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
  { value: "flooding", label: "Flooding" },
];

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function DashboardPage() {
  const { entries, hydrated, upsert, remove, list } = useTracker();
  const vault = useVault();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [draft, setDraft] = useState<DailyEntry>(emptyEntry(todayKey()));

  // Load draft when date or entries change
  useEffect(() => {
    if (!hydrated) return;
    setDraft(entries[selectedDate] ?? emptyEntry(selectedDate));
  }, [selectedDate, entries, hydrated]);

  const history = useMemo(() => list(), [list]);

  function setSymptom(id: SymptomId, value: number) {
    setDraft((d) => ({ ...d, symptoms: { ...d.symptoms, [id]: value } }));
  }

  function saveEntry() {
    upsert(draft);
    toast.success(`Saved entry for ${formatDate(draft.date)}`);
  }

  const trend = useMemo(() => {
    // last 14 days average severity across all rated symptoms
    const days = 14;
    const now = new Date();
    const points: { date: string; avg: number; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = todayKey(d);
      const entry = entries[key];
      if (entry) {
        const vals = Object.values(entry.symptoms).filter(
          (v): v is number => typeof v === "number",
        );
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        points.push({ date: key, avg, count: vals.length });
      } else {
        points.push({ date: key, avg: 0, count: 0 });
      }
    }
    return points;
  }, [entries]);

  const maxAvg = Math.max(...trend.map((t) => t.avg), 10);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <h1 className="font-serif text-lg font-semibold">Your dashboard</h1>
              <p className="text-xs text-muted-foreground">Symptom diary & brief vault</p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to brief builder
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-8">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Log
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> History
            </TabsTrigger>
            <TabsTrigger value="vault" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Brief vault
              {vault.items.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/15 text-primary text-[10px] px-1.5">
                  {vault.items.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ============ LOG ============ */}
          <TabsContent value="today" className="mt-6 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <label className="text-sm font-medium">Date</label>
                </div>
                <Input
                  type="date"
                  value={selectedDate}
                  max={todayKey()}
                  onChange={(e) => setSelectedDate(e.target.value || todayKey())}
                  className="w-auto"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Slide each symptom from 0 (not present) to 10 (severe). Leave untouched
                if it didn't apply.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
                Symptoms
              </h2>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                {SYMPTOMS.map((s) => {
                  const val = draft.symptoms[s.id] ?? 0;
                  return (
                    <div key={s.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-foreground">{s.label}</label>
                        <span
                          className={`text-xs font-mono tabular-nums w-6 text-right ${
                            val >= 7
                              ? "text-[color:var(--urgent)] font-semibold"
                              : val >= 4
                                ? "text-[color:var(--warning-foreground)]"
                                : "text-muted-foreground"
                          }`}
                        >
                          {val}
                        </span>
                      </div>
                      <Slider
                        value={[val]}
                        min={0}
                        max={10}
                        step={1}
                        onValueChange={(v) => setSymptom(s.id, v[0] ?? 0)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
                    Cycle / bleeding
                  </h2>
                </div>
                <Select
                  value={draft.bleeding}
                  onValueChange={(v) => setDraft((d) => ({ ...d, bleeding: v as Bleeding }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLEEDING.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
                  Triggers today
                </h2>
                <Input
                  placeholder="e.g. alcohol, poor sleep, stress"
                  value={draft.triggers}
                  onChange={(e) => setDraft((d) => ({ ...d, triggers: e.target.value }))}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
                HRT / medications / supplements taken
              </h2>
              <Input
                placeholder="e.g. Estradiol 50mcg patch, utrogestan 100mg, vitamin D"
                value={draft.meds}
                onChange={(e) => setDraft((d) => ({ ...d, meds: e.target.value }))}
              />
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
                Notes for the day
              </h2>
              <Textarea
                rows={4}
                placeholder="Anything you want to remember — what you were doing when a flush hit, how the night went, how it felt at work…"
                value={draft.note}
                onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-end gap-2 sticky bottom-4">
              {entries[selectedDate] && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete entry for ${formatDate(selectedDate)}?`)) {
                      remove(selectedDate);
                      setDraft(emptyEntry(selectedDate));
                      toast.success("Entry deleted");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              )}
              <Button onClick={saveEntry} className="shadow-sm">
                <Save className="h-4 w-4 mr-1.5" />
                Save entry
              </Button>
            </div>
          </TabsContent>

          {/* ============ HISTORY ============ */}
          <TabsContent value="history" className="mt-6 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80 mb-4">
                Last 14 days — average severity
              </h2>
              {trend.every((t) => t.count === 0) ? (
                <p className="text-sm text-muted-foreground">
                  No entries yet. Log a day on the Log tab to see your pattern.
                </p>
              ) : (
                <div className="flex items-end gap-1.5 h-32">
                  {trend.map((t) => {
                    const h = t.count === 0 ? 4 : Math.max(6, (t.avg / maxAvg) * 100);
                    const tone =
                      t.avg >= 7
                        ? "bg-[color:var(--urgent)]"
                        : t.avg >= 4
                          ? "bg-[color:var(--warning-foreground)]"
                          : t.count === 0
                            ? "bg-muted"
                            : "bg-primary";
                    return (
                      <div key={t.date} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t-md ${tone} transition-all`}
                          style={{ height: `${h}%` }}
                          title={
                            t.count
                              ? `${formatDate(t.date)} — avg ${t.avg.toFixed(1)}/10`
                              : `${formatDate(t.date)} — no entry`
                          }
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {t.date.slice(-2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card divide-y divide-border">
              <div className="p-5 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
                  All entries ({history.length})
                </h2>
              </div>
              {history.length === 0 && (
                <div className="p-5 text-sm text-muted-foreground">Nothing logged yet.</div>
              )}
              {history.map((e) => {
                const rated = Object.entries(e.symptoms).filter(
                  ([, v]) => typeof v === "number" && v > 0,
                ) as [SymptomId, number][];
                const top = rated.sort((a, b) => b[1] - a[1]).slice(0, 3);
                return (
                  <div key={e.date} className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{formatDate(e.date)}</span>
                        {e.bleeding !== "none" && (
                          <span className="text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">
                            bleeding: {e.bleeding}
                          </span>
                        )}
                      </div>
                      {top.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {top
                            .map(
                              ([id, v]) =>
                                `${SYMPTOMS.find((s) => s.id === id)?.label ?? id} ${v}`,
                            )
                            .join(" · ")}
                        </div>
                      )}
                      {e.note && (
                        <p className="text-sm text-foreground/80 mt-1.5 line-clamp-2">
                          {e.note}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDate(e.date)}
                    >
                      Open
                    </Button>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ============ VAULT ============ */}
          <TabsContent value="vault" className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                Every brief you build is saved here automatically. Open one to print it
                or save it as a PDF to take to your GP.
              </p>
            </div>
            {vault.items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No briefs yet. Build one on the{" "}
                  <Link to="/" className="text-primary underline underline-offset-2">
                    brief builder
                  </Link>
                  .
                </p>
              </div>
            )}
            <div className="grid gap-3">
              {vault.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-5 flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      {new Date(item.createdAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="font-serif text-base leading-snug">
                      &ldquo;{item.title}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openBriefForPrint(item.brief)}
                    >
                      <Printer className="h-4 w-4 mr-1.5" />
                      Open / PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Remove this brief from your vault?")) {
                          vault.remove(item.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-[11px] text-muted-foreground text-center mt-8">
          Everything is stored only in this browser. Clearing your browser data will
          erase your diary and vault.
        </p>
      </main>
    </div>
  );
}