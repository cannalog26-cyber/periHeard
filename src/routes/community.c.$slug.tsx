import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NewPostDialog } from "@/components/NewPostDialog";
import { PostList } from "@/routes/community.index";
import type { ForumCategory } from "@/lib/forum-types";

export const Route = createFileRoute("/community/c/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();

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

  const category = categoriesQ.data?.find((c) => c.slug === slug);

  const postsQ = useQuery({
    queryKey: ["forum-posts", "category", category?.id],
    enabled: !!category?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("*, forum_categories(slug, name), reply_count:forum_replies(count)")
        .eq("category_id", category!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data as any[];
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 space-y-6">
      <Link
        to="/community"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All topics
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-3xl font-semibold">
            {category?.name ?? (categoriesQ.isLoading ? "Loading…" : "Topic not found")}
          </h2>
          {category?.description && (
            <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
          )}
        </div>
        {categoriesQ.data && category && (
          <NewPostDialog categories={categoriesQ.data} defaultCategoryId={category.id} />
        )}
      </div>
      <PostList posts={postsQ.data ?? []} loading={postsQ.isLoading} />
    </div>
  );
}