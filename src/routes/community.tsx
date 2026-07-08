import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "PeriHeard Community — Share your story, ask questions" },
      {
        name: "description",
        content:
          "A community forum where people share perimenopause stories and ask questions. Read what others are going through and add your own voice.",
      },
      { property: "og:title", content: "PeriHeard Community" },
      {
        property: "og:description",
        content:
          "Share stories and ask questions about perimenopause, HRT, GP appointments and more.",
      },
    ],
  }),
  component: CommunityLayout,
});

function CommunityLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background-bottom">
      <Toaster position="top-center" richColors />
      <Header />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <footer className="border-t border-border/60 py-6">
        <p className="text-[11px] text-muted-foreground text-center max-w-2xl mx-auto px-5">
          Community posts are shared by users and are not medical advice. Please be kind. In an
          emergency call 999.
        </p>
      </footer>
    </div>
  );
}
