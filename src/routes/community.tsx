import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { Stethoscope, ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster position="top-center" richColors />
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <h1 className="font-serif text-lg font-semibold">PeriHeard</h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">Community</p>
            </div>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to brief tool
          </Link>
        </div>
      </header>
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