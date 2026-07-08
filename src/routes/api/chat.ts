import { createFileRoute } from "@tanstack/react-router";
import { SYSTEM_PROMPT } from "@/lib/system-prompt.server";

type IncomingTurn =
  | { role: "user"; text: string }
  | { role: "assistant"; brief: unknown };

function buildMessages(turns: IncomingTurn[]) {
  const msgs: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
  ];
  for (const t of turns) {
    if (t.role === "user") {
      msgs.push({ role: "user", content: t.text });
    } else {
      msgs.push({ role: "assistant", content: JSON.stringify(t.brief) });
    }
  }
  return msgs;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(
            JSON.stringify({ error: "AI is not configured. Missing LOVABLE_API_KEY." }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        let body: { turns?: IncomingTurn[] };
        try {
          body = (await request.json()) as { turns?: IncomingTurn[] };
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const turns = Array.isArray(body.turns) ? body.turns : [];
        if (turns.length === 0) {
          return new Response(JSON.stringify({ error: "No messages provided." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: buildMessages(turns),
            response_format: { type: "json_object" },
          }),
        });

        if (!upstream.ok) {
          const errText = await upstream.text().catch(() => "");
          const status = upstream.status;
          let userMsg = "The assistant is having trouble responding. Please try again.";
          if (status === 429) userMsg = "Too many requests just now - please wait a moment and try again.";
          if (status === 402) userMsg = "AI credits have run out on this workspace.";
          return new Response(
            JSON.stringify({ error: userMsg, detail: errText.slice(0, 500) }),
            { status, headers: { "Content-Type": "application/json" } },
          );
        }

        const data = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content ?? "";
        let brief: unknown;
        try {
          brief = JSON.parse(content);
        } catch {
          return new Response(
            JSON.stringify({
              error: "The assistant returned a malformed response. Please try rephrasing.",
              detail: content.slice(0, 500),
            }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response(JSON.stringify({ brief }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});