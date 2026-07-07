import { useEffect, useState, useCallback } from "react";
import type { ChatTurn } from "./brief-types";

const KEY = "sttyg.conversation.v1";

function load(): ChatTurn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatTurn[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useConversation() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTurns(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(turns));
    } catch {
      /* ignore quota */
    }
  }, [turns, hydrated]);

  const append = useCallback((turn: ChatTurn) => {
    setTurns((prev) => [...prev, turn]);
  }, []);

  const reset = useCallback(() => {
    setTurns([]);
    if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  }, []);

  return { turns, append, reset, hydrated };
}