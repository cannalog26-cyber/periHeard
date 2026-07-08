import { useEffect, useState, useCallback } from "react";

const KEY = "sttyg.tracker.v1";

export const SYMPTOMS = [
  { id: "hot_flushes", label: "Hot flushes" },
  { id: "night_sweats", label: "Night sweats" },
  { id: "sleep", label: "Poor sleep" },
  { id: "mood", label: "Low mood" },
  { id: "anxiety", label: "Anxiety" },
  { id: "brain_fog", label: "Brain fog" },
  { id: "joint_pain", label: "Joint / muscle pain" },
  { id: "headaches", label: "Headaches" },
  { id: "fatigue", label: "Fatigue" },
  { id: "libido", label: "Low libido" },
  { id: "vaginal_dryness", label: "Vaginal dryness" },
  { id: "palpitations", label: "Palpitations" },
] as const;

export type SymptomId = (typeof SYMPTOMS)[number]["id"];

export type Bleeding = "none" | "spotting" | "light" | "medium" | "heavy" | "flooding";

export type DailyEntry = {
  date: string; // YYYY-MM-DD
  symptoms: Partial<Record<SymptomId, number>>; // 0-10
  note: string;
  bleeding: Bleeding;
  triggers: string; // comma separated
  meds: string; // free text (HRT dose, supplements)
  updatedAt: number;
};

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function emptyEntry(date: string): DailyEntry {
  return {
    date,
    symptoms: {},
    note: "",
    bleeding: "none",
    triggers: "",
    meds: "",
    updatedAt: Date.now(),
  };
}

function load(): Record<string, DailyEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function useTracker() {
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(entries));
    } catch {
      /* ignore */
    }
  }, [entries, hydrated]);

  const upsert = useCallback((entry: DailyEntry) => {
    setEntries((prev) => ({ ...prev, [entry.date]: { ...entry, updatedAt: Date.now() } }));
  }, []);

  const remove = useCallback((date: string) => {
    setEntries((prev) => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
  }, []);

  const list = useCallback(() => {
    return Object.values(entries).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [entries]);

  return { entries, hydrated, upsert, remove, list };
}