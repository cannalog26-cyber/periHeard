import { createFileRoute } from "@tanstack/react-router";
import { SYSTEM_PROMPT } from "@/lib/system-prompt.server";

type IncomingTurn =
  | { role: "user"; text: string }
  | { role: "assistant"; brief: unknown };

type AgeBand = "under_35" | "35_39" | "40_44" | "45_plus";
type BriefMode = "perimenopause" | "general";

function ageInstruction(ageBand?: AgeBand): string {
  if (ageBand === "45_plus")
    return "PATIENT AGE BAND: 45 or over. Apply the standard NG23 clinical pathway for women 45+ (symptom-based diagnosis, no routine FSH).";
  if (ageBand === "40_44")
    return `PATIENT AGE BAND: 40–44. Build the standard perimenopause brief. In "what_to_expect", include verbatim (in addition to the standard closing line) this sentence: "At your age, your GP may suggest a blood test (FSH) as part of the picture — NICE guidance supports this for women aged 40–45, so don't be surprised if it's offered or if it isn't."`;
  if (ageBand === "35_39")
    return `PATIENT AGE BAND: 35–39. Perimenopause may be mentioned as ONE possibility only — never asserted. Do NOT use the phrase "consistent with perimenopause" or any equivalent asserted framing in patient-facing fields. "one_line_summary" should present the symptoms as the patient's account warranting proper assessment, noting perimenopause as one possibility among others. In "what_to_expect", include verbatim (in addition to the standard closing line): "At your age, NICE guidance supports your GP investigating further, including blood tests, to rule out other causes including early ovarian insufficiency." "questions_to_ask" MUST include verbatim: "Could my symptoms be early perimenopause or something else, and what tests would help establish that?" The clinical brief should reflect the NICE CKS POI pathway (FSH >25 IU/L on two samples 4–6 weeks apart, exclude pregnancy/thyroid/prolactin, specialist referral) alongside perimenopause as a differential. Do not assert either as a diagnosis.`;
  if (ageBand === "under_35")
    return `PATIENT AGE BAND: Under 35. REFRAME the brief. Do NOT use the phrase "consistent with perimenopause" or any perimenopause-framed language in patient-facing fields. "one_line_summary" MUST NOT mention perimenopause; it should present the patient's symptoms as her account warranting proper assessment. "questions_to_ask" should focus on getting the symptoms investigated (e.g. "Could my symptoms be hormonal, and what tests would help establish that?", "Would you consider a referral to a gynaecologist or specialist?"). The clinical brief may reference the NICE CKS POI pathway (FSH >25 IU/L on two samples 4–6 weeks apart, exclude pregnancy/thyroid/prolactin, specialist referral) as one differential to investigate. Do not assert POI or perimenopause as a diagnosis.`;
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

        // Hard sanitize: the model must never surface an urgent_banner.
        // Red flags are shown exclusively in the dedicated red_flags section.
        if (brief && typeof brief === "object") {
          (brief as { urgent_banner?: unknown }).urgent_banner = null;
          stripJargon(brief as Record<string, unknown>);
        }

        return new Response(JSON.stringify({ brief }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});

// Replace medical jargon with plain-English equivalents in every
// patient-facing string field. The "clinical" object is left untouched
// because it is authored for the GP (and not currently rendered anyway).
const JARGON_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bamenorrhoea\b/gi, "no periods"],
  [/\bamenorrhea\b/gi, "no periods"],
  [/\boligomenorrhoea\b/gi, "infrequent periods"],
  [/\boligomenorrhea\b/gi, "infrequent periods"],
  [/\bmenorrhagia\b/gi, "very heavy periods"],
  [/\bdysmenorrhoea\b/gi, "painful periods"],
  [/\bdysmenorrhea\b/gi, "painful periods"],
  [/\bdyspareunia\b/gi, "pain during sex"],
  [/\bvasomotor(?:\s+sx)?\s+symptoms?\b/gi, "hot flushes and night sweats"],
  [/\bvasomotor\s+sx\b/gi, "hot flushes and night sweats"],
  [/\bvasomotor\b/gi, "hot flushes and night sweats"],
  [/\bgenitourinary syndrome of menopause\b/gi, "vaginal dryness and urinary symptoms"],
  [/\bGSM\b/g, "vaginal dryness and urinary symptoms"],
  [/\bHSDD\b/g, "low sex drive"],
  [/\bvaginal atrophy\b/gi, "vaginal dryness"],
  [/\btransdermal\s+(?:E2|oestradiol|estradiol)\b/gi, "hormone patch or gel"],
  [/\bmicronised progesterone\b/gi, "progesterone (a hormone tablet)"],
  [/\bmicronized progesterone\b/gi, "progesterone (a hormone tablet)"],
  [/\boestradiol\b/gi, "oestrogen"],
  [/\bestradiol\b/gi, "oestrogen"],
  [/\bTFTs?\b/g, "thyroid blood test"],
  [/\bFBC\b/g, "full blood count (a blood test)"],
  [/\bU&Es\b/g, "kidney blood test"],
  [/\bLFTs\b/g, "liver blood test"],
  [/\bHbA1c\b/g, "blood sugar test"],
  [/\bferritin\b/gi, "iron level"],
  [/\bPMH\b/g, "past medical history"],
  [/\bDHx\b/g, "medication history"],
  [/\bHPC\b/g, "history of the problem"],
  [/\bPC\b/g, "main concern"],
  [/\bsx\b/g, "symptoms"],
  [/\bhx\b/g, "history"],
  [/\bdx\b/g, "diagnosis"],
  [/\btx\b/g, "treatment"],
  [/\brx\b/g, "prescription"],
  [/\bx\/12\b/g, "months"],
  [/\bx\/52\b/g, "weeks"],
  [/\bcognitive symptoms?\b/gi, "brain fog and memory problems"],
  [/\bpsychological symptoms?\b/gi, "mood changes"],
  [/\bmusculoskeletal\b/gi, "joint and muscle"],
  [/\bgenitourinary\b/gi, "vaginal and urinary"],
  [/\baetiolog(?:y|ies|ical)\b/gi, "cause"],
  [/\bdifferentials?\b/gi, "other possible causes"],
  [/\bpresenting complaint\b/gi, "main concern"],
  [/\bonset pattern\b/gi, "when it started"],
  [/\bclinically indicated\b/gi, "needed"],
  [/\bPOI\b/g, "early menopause"],
];

function scrub(text: string): string {
  let out = text;
  for (const [re, rep] of JARGON_REPLACEMENTS) out = out.replace(re, rep);
  return out;
}

const PATIENT_FIELDS = new Set([
  "one_line_summary",
  "timeline",
  "impact_statement",
  "what_to_expect",
  "disclaimer",
  "out_of_scope",
]);
const PATIENT_ARRAYS = new Set([
  "already_tried",
  "questions_to_ask",
  "if_dismissed",
  "red_flags",
  "bring_with_you",
  "clarifying_questions",
]);

function stripJargon(brief: Record<string, unknown>) {
  for (const k of Object.keys(brief)) {
    if (k === "clinical") continue;
    const v = brief[k];
    if (typeof v === "string" && PATIENT_FIELDS.has(k)) {
      brief[k] = scrub(v);
    } else if (Array.isArray(v) && PATIENT_ARRAYS.has(k)) {
      brief[k] = v.map((item) => (typeof item === "string" ? scrub(item) : item));
    } else if (k === "symptom_summary" && Array.isArray(v)) {
      brief[k] = v.map((item) => {
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          return {
            ...o,
            cluster: typeof o.cluster === "string" ? scrub(o.cluster) : o.cluster,
            detail: typeof o.detail === "string" ? scrub(o.detail) : o.detail,
            duration_pattern:
              typeof o.duration_pattern === "string" ? scrub(o.duration_pattern) : o.duration_pattern,
          };
        }
        return item;
      });
    }
  }
}