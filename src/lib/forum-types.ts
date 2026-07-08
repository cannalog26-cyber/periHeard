export type ForumCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export type ForumPost = {
  id: string;
  category_id: string;
  kind: "story" | "question";
  title: string;
  body: string;
  display_name: string;
  created_at: string;
};

export type ForumReply = {
  id: string;
  post_id: string;
  body: string;
  display_name: string;
  created_at: string;
};

export const DISPLAY_NAME_KEY = "periheard-display-name";

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}