import { useEffect, useState, useCallback } from "react";
import type { Brief } from "./brief-types";

const KEY = "sttyg.vault.v1";

export type VaultItem = {
  id: string;
  createdAt: number;
  title: string;
  brief: Brief;
};

function load(): VaultItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(items: VaultItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function addToVault(brief: Brief): VaultItem {
  const item: VaultItem = {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    createdAt: Date.now(),
    title: brief.one_line_summary?.slice(0, 90) || "Appointment brief",
    brief,
  };
  const items = load();
  // Dedupe: don't save if identical one_line_summary saved in the last minute
  const recent = items[0];
  if (
    recent &&
    recent.title === item.title &&
    Date.now() - recent.createdAt < 60_000
  ) {
    return recent;
  }
  const next = [item, ...items].slice(0, 100);
  save(next);
  return item;
}

export function useVault() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(load());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      save(next);
      return next;
    });
  }, []);

  const refresh = useCallback(() => setItems(load()), []);

  return { items, hydrated, remove, refresh };
}