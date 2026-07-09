import { useEffect, useRef, useState, useCallback } from "react";
import type { ChatTurn } from "./brief-types";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./use-session";

const KEY = "sttyg.conversation.v1";
const ID_KEY = "sttyg.conversationId.v1";

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

function loadId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ID_KEY);
}

function deriveTitle(turns: ChatTurn[]): string {
  const firstUser = turns.find((t) => t.role === "user");
  if (!firstUser || firstUser.role !== "user") return "Untitled conversation";
  const text = firstUser.text.trim().replace(/\s+/g, " ");
  return text.length > 80 ? text.slice(0, 77) + "..." : text || "Untitled conversation";
}

export function useConversation() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const { user } = useSession();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTurns(load());
    setConversationId(loadId());
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

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (conversationId) window.localStorage.setItem(ID_KEY, conversationId);
    else window.localStorage.removeItem(ID_KEY);
  }, [conversationId, hydrated]);

  // Auto-save to database when signed in.
  useEffect(() => {
    if (!hydrated || !user || turns.length === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const title = deriveTitle(turns);
      const payloadTurns = turns as unknown as never;
      if (conversationId) {
        await supabase
          .from("conversations")
          .update({ turns: payloadTurns, title })
          .eq("id", conversationId);
      } else {
        const { data, error } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, turns: payloadTurns, title })
          .select("id")
          .single();
        if (!error && data) setConversationId(data.id);
      }
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [turns, user, hydrated, conversationId]);

  const append = useCallback((turn: ChatTurn) => {
    setTurns((prev) => [...prev, turn]);
  }, []);

  const reset = useCallback(() => {
    setTurns([]);
    setConversationId(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(KEY);
      window.localStorage.removeItem(ID_KEY);
    }
  }, []);

  const loadSaved = useCallback((id: string, savedTurns: ChatTurn[]) => {
    setTurns(savedTurns);
    setConversationId(id);
  }, []);

  return { turns, append, reset, hydrated, conversationId, loadSaved };
}