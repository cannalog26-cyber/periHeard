import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, HelpCircle, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DISPLAY_NAME_KEY,
  timeAgo,
  type ForumPost,
  type ForumReply,
} from "@/lib/forum-types";

export const Route = createFileRoute("/community/p/$id")({
  component: PostPage,
});

type PostFull = ForumPost & {
  forum_categories: { slug: string; name: string } | null;
};

function PostPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const postQ = useQuery({
    queryKey: ["forum-post", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("*, forum_categories(slug, name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as PostFull | null;
    },
  });

  const repliesQ = useQuery({
    queryKey: ["forum-replies", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_replies")
        .select("*")
        .eq("post_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ForumReply[];
    },
  });

  const [displayName, setDisplayName] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(DISPLAY_NAME_KEY);
    if (saved) setDisplayName(saved);
  }, []);

  const reply = useMutation({
    mutationFn: async () => {
      const name = displayName.trim();
      const b = body.trim();
      if (!name || name.length > 40) throw new Error("Please enter a display name (1–40 chars).");
      if (b.length < 1 || b.length > 5000) throw new Error("Reply must be 1–5,000 characters.");
      const { error } = await supabase.from("forum_replies").insert({
        post_id: id,
        body: b,
        display_name: name,
      });
      if (error) throw error;
      window.localStorage.setItem(DISPLAY_NAME_KEY, name);
    },
    onSuccess: () => {
      setBody("");
      toast.success("Reply posted");
      qc.invalidateQueries({ queryKey: ["forum-replies", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const p = postQ.data;

  return (
    <div className="max-w-3xl mx-auto px-5 py-8 space-y-6">
      <Link
        to="/community"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to community
      </Link>

      {postQ.isLoading && <div className="h-40 rounded-xl bg-muted/50 animate-pulse" />}
      {!postQ.isLoading && !p && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          This post doesn&apos;t exist or has been removed.
        </div>
      )}

      {p && (
        <article className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                p.kind === "story"
                  ? "bg-accent/15 text-accent-foreground"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {p.kind === "story" ? (
                <BookOpen className="h-3 w-3" />
              ) : (
                <HelpCircle className="h-3 w-3" />
              )}
              {p.kind === "story" ? "Story" : "Question"}
            </span>
            {p.forum_categories && (
              <Link
                to="/community/c/$slug"
                params={{ slug: p.forum_categories.slug }}
                className="hover:text-foreground"
              >
                · {p.forum_categories.name}
              </Link>
            )}
            <span>· {timeAgo(p.created_at)}</span>
            <span>· by {p.display_name}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">
            {p.title}
          </h1>
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{p.body}</div>
        </article>
      )}

      {p && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
            {(repliesQ.data?.length ?? 0)}{" "}
            {(repliesQ.data?.length ?? 0) === 1 ? "reply" : "replies"}
          </h2>

          {repliesQ.isLoading && <div className="h-16 rounded-xl bg-muted/50 animate-pulse" />}

          <ul className="space-y-2">
            {(repliesQ.data ?? []).map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="text-[11px] text-muted-foreground mb-1">
                  {r.display_name} · {timeAgo(r.created_at)}
                </div>
                <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{r.body}</div>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium">Add a reply</h3>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              placeholder="Display name"
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={5000}
              rows={4}
              placeholder={
                p.kind === "question"
                  ? "Share your experience or answer their question…"
                  : "Respond with kindness…"
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">{body.length}/5,000</p>
              <button
                onClick={() => reply.mutate()}
                disabled={reply.isPending}
                className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {reply.isPending ? "Posting…" : "Post reply"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}