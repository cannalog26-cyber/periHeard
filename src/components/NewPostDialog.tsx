import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DISPLAY_NAME_KEY, type ForumCategory } from "@/lib/forum-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  categories: ForumCategory[];
  defaultCategoryId?: string;
  trigger?: React.ReactNode;
};

export function NewPostDialog({ categories, defaultCategoryId, trigger }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? categories[0]?.id ?? "");
  const [kind, setKind] = useState<"story" | "question">("story");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(DISPLAY_NAME_KEY);
    if (saved) setDisplayName(saved);
  }, []);

  useEffect(() => {
    if (defaultCategoryId) setCategoryId(defaultCategoryId);
  }, [defaultCategoryId]);

  const create = useMutation({
    mutationFn: async () => {
      const name = displayName.trim();
      const t = title.trim();
      const b = body.trim();
      if (!name || name.length > 40) throw new Error("Please enter a display name (1–40 chars).");
      if (t.length < 3 || t.length > 200) throw new Error("Title must be 3–200 characters.");
      if (b.length < 1 || b.length > 10000) throw new Error("Body must be 1–10,000 characters.");
      if (!categoryId) throw new Error("Please pick a category.");
      const { error } = await supabase.from("forum_posts").insert({
        category_id: categoryId,
        kind,
        title: t,
        body: b,
        display_name: name,
      });
      if (error) throw error;
      window.localStorage.setItem(DISPLAY_NAME_KEY, name);
    },
    onSuccess: () => {
      toast.success("Posted");
      setTitle("");
      setBody("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["forum-posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 shadow-sm">
            <PenLine className="h-4 w-4" />
            New post
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Share with the community</DialogTitle>
          <DialogDescription>
            Post anonymously under a display name. Please don&apos;t share full names, emails or
            phone numbers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKind("story")}
              className={`h-10 rounded-md border text-sm font-medium transition-colors ${
                kind === "story"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              Share a story
            </button>
            <button
              type="button"
              onClick={() => setKind("question")}
              className={`h-10 rounded-md border text-sm font-medium transition-colors ${
                kind === "question"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              Ask a question
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              placeholder="e.g. Sunflower47"
              className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder={kind === "story" ? "A short headline for your story" : "What do you want to ask?"}
              className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {kind === "story" ? "Your story" : "Details"}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={10000}
              rows={6}
              placeholder={
                kind === "story"
                  ? "Tell people what you've been going through…"
                  : "Add any context that would help someone answer…"
              }
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed resize-none"
            />
            <p className="text-[11px] text-muted-foreground mt-1">{body.length}/10,000</p>
          </div>
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-10 px-4 rounded-md border border-border text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {create.isPending ? "Posting…" : "Post"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}