import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle, BookOpen, HelpCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NewPostDialog } from "@/components/NewPostDialog";
import { timeAgo, type ForumCategory, type ForumPost } from "@/lib/forum-types";

export const Route = createFileRoute("/community/")({
  component: CommunityIndex,
});

type PostWithMeta = ForumPost & {
  forum_categories: { slug: string; name: string } | null;
  reply_count: { count: number }[] | null;
};

function CommunityIndex() {
  const [filter, setFilter] = useState<"all" | "story" | "question">("all");

  const categoriesQ = useQuery({
    queryKey: ["forum-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as ForumCategory[];
    },
  });

  const postsQ = useQuery({
    queryKey: ["forum-posts", "recent", filter],
    queryFn: async () => {
      let q = supabase
        .from("forum_posts")
        .select(
          "*, forum_categories(slug, name), reply_count:forum_replies(count)",
        )
        .order("created_at", { ascending: false })
        .limit(30);
      if (filter !== "all") q = q.eq("kind", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as PostWithMeta[];
    },
  });

  const categories = categoriesQ.data ?? [];

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 space-y-8">
      <section className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3 text-accent" />
          Community
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
          You&apos;re not the only one.
        </h2>
        <p className="text-[15px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Share your story, ask a question, or read what others are going through. Posts are
          anonymous — you just pick a display name.
        </p>
        <div className="flex justify-center pt-2">
          <NewPostDialog categories={categories} />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Browse by topic
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoriesQ.isLoading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
          ))}
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/community/c/$slug"
              params={{ slug: c.slug }}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="font-medium text-sm">{c.name}</div>
              {c.description && (
                <div className="text-xs text-muted-foreground mt-0.5">{c.description}</div>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recent posts
          </h3>
          <div className="flex gap-1 p-1 rounded-lg bg-muted/60">
            {(["all", "story", "question"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 h-7 rounded-md text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f + "s"}
              </button>
            ))}
          </div>
        </div>
        <PostList posts={postsQ.data ?? []} loading={postsQ.isLoading} />
      </section>
    </div>
  );
}

export function PostList({
  posts,
  loading,
}: {
  posts: PostWithMeta[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No posts yet. Be the first to share.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {posts.map((p) => {
        const replies = p.reply_count?.[0]?.count ?? 0;
        return (
          <li key={p.id}>
            <Link
              to="/community/p/$id"
              params={{ id: p.id }}
              className="block rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground mb-1.5">
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
                {p.forum_categories && <span>· {p.forum_categories.name}</span>}
                <span>· {timeAgo(p.created_at)}</span>
                <span>· by {p.display_name}</span>
              </div>
              <div className="font-medium text-[15px] leading-snug">{p.title}</div>
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.body}</div>
              <div className="text-[11px] text-muted-foreground mt-2 inline-flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {replies} {replies === 1 ? "reply" : "replies"}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}