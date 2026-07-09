import { createFileRoute } from "@tanstack/react-router";
import { SYSTEM_PROMPT } from "@/lib/system-prompt.server";

type IncomingTurn =
  | { role: "user"; text: string }
  | { role: "assistant"; brief: unknown };

type AgeBand = "under_40" | "40_44" | "45_plus";
type BriefMode = "perimenopause" | "general";

function ageInstruction(ageBand?: AgeBand): string {
  if (ageBand === "45_plus")
    return "PATIENT AGE BAND: 45 or over. Apply the standard NG23 clinical pathway for women 45+ (symptom-based diagnosis, no routine FSH).";
  if (ageBand === "40_44")
    return `PATIENT AGE BAND: 40–44. Build the standard perimenopause brief. In "what_to_expect", include verbatim (in addition to the standard closing line) this sentence: "At your age, your GP may suggest a blood test (FSH) as part of the picture — NICE guidance supports this for women aged 40–45, so don't be surprised if it's offered or if it isn't."`;
  if (ageBand === "under_40")
    return `PATIENT AGE BAND: Under 40. REFRAME the brief. Do NOT use the phrase "consistent with perimenopause" or any equivalent perimenopause-framed language in patient-facing fields. Instead, "one_line_summary" should say the patient is experiencing these symptoms and, given her age, would like them properly assessed — noting that menopausal-type symptoms under 40 can have causes that need investigation, including premature ovarian insufficiency (POI). "questions_to_ask" must be reframed (e.g. "Could my symptoms be hormonal, and what tests would help establish that?", "Given I'm under 40, could this be premature ovarian insufficiency, and would FSH testing help?", "Would you consider a referral to a gynaecologist or menopause specialist?"). The clinical brief should reflect the NICE CKS POI pathway (FSH >25 IU/L on two samples 4–6 weeks apart, exclude pregnancy/thyroid/prolactin, specialist referral). Do not assert POI as a diagnosis — present it as a differential to investigate.`;
  return "";
}

function modeInstruction(mode?: BriefMode): string {
  if (mode === "general")
    return `BRIEF MODE: GENERAL. The user's story does not fit a perimenopause pattern. Build a general GP appointment brief with NO menopause framing at all. Do not mention perimenopause, menopause, HRT, hormones, FSH, or NG23 anywhere in patient-facing or clinical fields unless the user explicitly raised them. Use the same JSON schema, but "one_line_summary" should simply frame the presenting concern; "questions_to_ask" should be generic good questions for the presenting symptoms; "clinical_impression" should list plausible differentials for what was actually described; "guideline_refs" may be empty.`;
  return "";
}

function buildMessages(turns: IncomingTurn[], ageBand?: AgeBand, mode?: BriefMode) {
  const extra = [ageInstruction(ageBand), modeInstruction(mode)].filter(Boolean).join("\n\n");
  const msgs: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: extra ? `${SYSTEM_PROMPT}\n\n${extra}` : SYSTEM_PROMPT },
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

        let body: { turns?: IncomingTurn[]; ageBand?: AgeBand; mode?: BriefMode };
        try {
          body = (await request.json()) as {
            turns?: IncomingTurn[];
            ageBand?: AgeBand;
            mode?: BriefMode;
          };
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
            messages: buildMessages(turns, body.ageBand, body.mode),
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