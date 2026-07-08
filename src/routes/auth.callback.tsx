import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth
      .exchangeCodeForSession(new URLSearchParams(window.location.search).get("code") ?? "")
      .then(({ error }) => {
        if (error) {
          console.error(error);
        }
        navigate({ to: "/" });
      })
      .catch(() => navigate({ to: "/" }));
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background-bottom p-5">
      <div className="flex items-center gap-2 text-foreground">
        <span className="h-2 w-2 rounded-full bg-accent animate-bounce" />
        <span className="h-2 w-2 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Completing sign in…</p>
    </div>
  );
}
