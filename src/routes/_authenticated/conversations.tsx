import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Trash2, MessageSquare } from "lucide-react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import type { ChatTurn } from "@/lib/brief-types";

export const Route = createFileRoute("/_authenticated/conversations")({
  head: () => ({
    meta: [
      { title: "Saved conversations - PeriHeard" },
      { name: "description", content: "Your saved symptom briefs and conversations." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SavedConversations,
});

type Row = {
  id: string;
  title: string;
  turns: unknown;
  updated_at: string;
};

function SavedConversations() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const navigate = useNavigate();

  async function refresh() {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, turns, updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    setRows(data ?? []);
  }

  useEffect(() => {
    void refresh();
  }, []);

  function openConversation(row: Row) {
    const turns = Array.isArray(row.turns) ? (row.turns as ChatTurn[]) : [];
    try {
      window.localStorage.setItem("sttyg.conversation.v1", JSON.stringify(turns));
      window.localStorage.setItem("sttyg.conversationId.v1", row.id);
    } catch {
      /* ignore */
    }
    void navigate({ to: "/" });
  }

  async function deleteConversation(id: string) {
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    // If the deleted one is the active local convo, clear it.
    if (typeof window !== "undefined" && window.localStorage.getItem("sttyg.conversationId.v1") === id) {
      window.localStorage.removeItem("sttyg.conversation.v1");
      window.localStorage.removeItem("sttyg.conversationId.v1");
    }
    toast.success("Conversation deleted.");
    void refresh();
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background-bottom">
      <Toaster position="top-center" richColors />
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-8 space-y-5">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-semibold text-foreground">Saved conversations</h1>
          <p className="text-sm text-muted-foreground">
            Every brief you build while signed in is saved here automatically.
          </p>
        </div>

        {rows === null ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-2">
            <MessageSquare className="h-6 w-6 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No saved conversations yet. Start a brief from the home page and it will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => {
              const turnsCount = Array.isArray(row.turns) ? (row.turns as unknown[]).length : 0;
              return (
                <li
                  key={row.id}
                  className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3"
                >
                  <button
                    onClick={() => openConversation(row)}
                    className="flex-1 text-left space-y-1"
                  >
                    <p className="text-[15px] font-medium text-foreground line-clamp-2">
                      {row.title || "Untitled conversation"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(row.updated_at), { addSuffix: true })}
                      {" · "}
                      {turnsCount} {turnsCount === 1 ? "message" : "messages"}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteConversation(row.id)}
                    aria-label="Delete conversation"
                    className="text-muted-foreground hover:text-destructive p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}