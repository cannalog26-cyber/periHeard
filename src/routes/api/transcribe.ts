import { createFileRoute } from "@tanstack/react-router";

async function translateToEnglish(key: string, text: string, sourceLang: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a medical translator. Translate the user's message into natural, clinical English suitable for a UK GP. Preserve every symptom, timeline, medication, dose, and emotional nuance. Do NOT summarise, add, or diagnose. If the text is already English, return it unchanged. Reply with the translation only — no preamble, no quotes.",
        },
        {
          role: "user",
          content:
            sourceLang && sourceLang !== "auto"
              ? `Source language: ${sourceLang}\n\n${text}`
              : text,
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(
            JSON.stringify({ error: "Voice input is not configured." }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const form = await request.formData();
        const file = form.get("file");
        const language = String(form.get("language") ?? "auto");
        const translate = String(form.get("translate") ?? "true") === "true";
        if (!(file instanceof File) || file.size < 1024) {
          return new Response(
            JSON.stringify({ error: "That recording was empty — please try again." }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-mini-transcribe");
        upstream.append("file", file, file.name || "recording.wav");
        if (language && language !== "auto") {
          // ISO-639-1 hint improves accuracy on non-English speech
          upstream.append("language", language);
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });

        if (!res.ok) {
          const err = await res.text().catch(() => "");
          return new Response(
            JSON.stringify({ error: "Transcription failed.", detail: err.slice(0, 300) }),
            { status: res.status, headers: { "Content-Type": "application/json" } },
          );
        }

        const data = (await res.json()) as { text?: string };
        const original = data.text ?? "";

        let translated: string | null = null;
        if (translate && original && language !== "en") {
          translated = await translateToEnglish(key, original, language);
        }

        return new Response(
          JSON.stringify({
            text: translated ?? original,
            original,
            translated: translated !== null && translated !== original,
            language,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});