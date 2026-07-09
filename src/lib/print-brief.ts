import type { Brief, ChatTurn } from "./brief-types";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function list(items: string[]): string {
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

function section(title: string, body: string, tone: "default" | "urgent" = "default"): string {
  if (!body) return "";
  const cls = tone === "urgent" ? "section urgent" : "section";
  return `<section class="${cls}"><h2>${esc(title)}</h2>${body}</section>`;
}

export function briefToPrintableHtml(brief: Brief): string {
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const parts: string[] = [];

  if (brief.urgent_banner) {
    parts.push(
      `<div class="banner"><strong>Please read first:</strong> ${esc(brief.urgent_banner)}</div>`,
    );
  }

  if (brief.one_line_summary) {
    parts.push(
      `<section class="opener"><div class="label">Open the appointment with this</div><blockquote>&ldquo;${esc(brief.one_line_summary)}&rdquo;</blockquote></section>`,
    );
  }

  if (brief.symptom_summary?.length) {
    const rows = brief.symptom_summary
      .map(
        (s) =>
          `<li><div class="cluster">${esc(s.cluster)}</div><div>${esc(s.detail)}</div><div class="dim">${esc(s.duration_pattern)}</div></li>`,
      )
      .join("");
    parts.push(section("Symptom summary", `<ul class="clusters">${rows}</ul>`));
  }

  if (brief.timeline) parts.push(section("Timeline", `<p>${esc(brief.timeline)}</p>`));
  if (brief.impact_statement)
    parts.push(section("Impact on daily life", `<p>${esc(brief.impact_statement)}</p>`));
  if (brief.already_tried?.length)
    parts.push(section("Already tried", list(brief.already_tried)));
  if (brief.questions_to_ask?.length)
    parts.push(
      section(
        "Questions to ask",
        `<ol>${brief.questions_to_ask.map((q) => `<li>${esc(q)}</li>`).join("")}</ol>`,
      ),
    );
  if (brief.if_dismissed?.length)
    parts.push(
      section(
        "If I feel dismissed, I can say",
        `<ul class="quotes">${brief.if_dismissed.map((q) => `<li>&ldquo;${esc(q)}&rdquo;</li>`).join("")}</ul>`,
      ),
    );
  if (brief.red_flags?.length)
    parts.push(section("Red flags - seek prompt review", list(brief.red_flags), "urgent"));
  if (brief.what_to_expect)
    parts.push(section("What a good consultation looks like", `<p>${esc(brief.what_to_expect)}</p>`));
  if (brief.bring_with_you?.length)
    parts.push(section("Bring with me", list(brief.bring_with_you)));

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>Appointment brief - ${dateStr}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #1f2b26; font-size: 11pt; line-height: 1.5;
    background: #fff;
  }
  .page { max-width: 640px; margin: 0 auto; padding: 16px; }
  header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #d6d1c4; padding-bottom: 8px; margin-bottom: 18px; }
  header h1 { font-family: Georgia, "Times New Roman", serif; font-size: 20pt; margin: 0; color: #1f3d33; letter-spacing: -0.01em; }
  header h1 .mark-p { color: #7a1f1f; }
  header .subtitle { font-size: 10pt; color: #4a4a4a; margin-top: 2px; }
  header .meta { font-size: 9pt; color: #6b6f6a; }
  h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.08em; color: #1f3d33; margin: 0 0 8px; border-bottom: 1px solid #e5e0d2; padding-bottom: 4px; }
  .section { margin: 14px 0; break-inside: avoid; page-break-inside: avoid; }
  .banner { background: #fbecea; border: 1.5px solid #c94a3b; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; color: #6f1f17; }
  .opener { background: #f0efe6; border-left: 4px solid #b6693d; padding: 12px 14px; border-radius: 4px; margin-bottom: 16px; break-inside: avoid; }
  .opener .label { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.1em; color: #1f3d33; margin-bottom: 6px; }
  .opener blockquote { font-family: Georgia, serif; font-size: 13pt; margin: 0; line-height: 1.35; }
  ul, ol { margin: 0; padding-left: 20px; }
  li { margin: 4px 0; }
  ul.clusters { list-style: none; padding: 0; }
  ul.clusters li { border-left: 2px solid #b6693d; padding: 2px 0 6px 10px; margin: 8px 0; }
  ul.quotes li { font-style: italic; background: #f5f2e9; padding: 6px 10px; border-radius: 4px; margin: 6px 0; list-style: none; }
  ul.quotes { padding-left: 0; }
  .cluster { font-weight: 600; }
  .dim { color: #6b6f6a; font-size: 9.5pt; }
  .urgent h2 { color: #6f1f17; border-color: #c94a3b; }
  footer { margin-top: 18px; padding-top: 6px; border-top: 1px solid #d6d1c4; font-size: 8pt; color: #6b6f6a; font-style: italic; line-height: 1.35; }
  @media print { .noprint { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  .actions { position: fixed; top: 12px; right: 12px; display: flex; gap: 8px; }
  .actions button { background: #1f3d33; color: #fff; border: 0; padding: 8px 14px; border-radius: 6px; font: inherit; font-size: 10pt; cursor: pointer; }
  .actions button.secondary { background: #fff; color: #1f3d33; border: 1px solid #1f3d33; }
</style>
</head><body>
<div class="actions noprint">
  <button onclick="window.print()">Save as PDF / Print</button>
  <button class="secondary" onclick="window.close()">Close</button>
</div>
<div class="page">
  <header>
    <div>
      <h1><span class="mark-p">peri</span>Heard</h1>
      <div class="subtitle">Appointment brief</div>
    </div>
    <div class="meta">Prepared ${esc(dateStr)}</div>
  </header>
  ${parts.join("\n")}
  <footer>
    <div>${esc(brief.disclaimer || "This tool is intended to support symptom awareness and consultation preparation. It does not provide a diagnosis or replace medical advice.")}</div>
    <div style="margin-top:6px;">Generated ${esc(dateStr)}.</div>
  </footer>
</div>
<script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 400); });</script>
</body></html>`;
}

export function openBriefForPrint(brief: Brief) {
  const html = briefToPrintableHtml(brief);
  openHtml(html);
}

export async function saveBriefAsPdf(brief: Brief) {
  const html = briefToPrintableHtml(brief);
  const container = document.createElement("div");
  container.innerHTML = html;
  // Extract just the .page element for rendering
  const page = container.querySelector(".page") as HTMLElement | null;
  const styleEl = container.querySelector("style");
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.style.width = "800px";
  wrapper.style.background = "#fff";
  if (styleEl) wrapper.appendChild(styleEl.cloneNode(true));
  if (page) wrapper.appendChild(page.cloneNode(true));
  document.body.appendChild(wrapper);

  const dateStr = new Date().toISOString().slice(0, 10);
  try {
    const mod = await import("html2pdf.js");
    const html2pdf = (mod as any).default ?? (mod as any);
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `periHeard-brief.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(wrapper)
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
}

function briefToInnerHtml(brief: Brief): string {
  // Reuse the section-builder logic by extracting the parts (without the doc wrapper).
  const html = briefToPrintableHtml(brief);
  const match = html.match(/<div class="page">([\s\S]*?)<\/div>\s*<script/);
  if (!match) return "";
  // Strip header/footer - we'll add our own per turn.
  return match[1]
    .replace(/<header>[\s\S]*?<\/header>/, "")
    .replace(/<footer>[\s\S]*?<\/footer>/, "");
}

function conversationToPrintableHtml(turns: ChatTurn[]): string {
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const blocks: string[] = [];
  let userIdx = 0;
  let briefIdx = 0;
  for (const t of turns) {
    if (t.role === "user") {
      userIdx += 1;
      blocks.push(
        `<section class="turn user"><div class="turn-label">You said · message ${userIdx}</div><p>${escapeHtml(
          t.text,
        )}</p></section>`,
      );
    } else if (t.brief) {
      briefIdx += 1;
      blocks.push(
        `<section class="turn assistant"><div class="turn-label">Brief · version ${briefIdx}</div>${briefToInnerHtml(
          t.brief,
        )}</section>`,
      );
    }
  }

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>Conversation brief - ${dateStr}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #1f2b26; font-size: 11pt; line-height: 1.5; background: #fff; }
  .page { max-width: 720px; margin: 0 auto; padding: 24px; }
  header.doc { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #d6d1c4; padding-bottom: 8px; margin-bottom: 18px; }
  header.doc h1 { font-family: Georgia, serif; font-size: 18pt; margin: 0; color: #1f3d33; }
  header.doc .meta { font-size: 9pt; color: #6b6f6a; }
  h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.08em; color: #1f3d33; margin: 0 0 8px; border-bottom: 1px solid #e5e0d2; padding-bottom: 4px; }
  .section { margin: 12px 0; break-inside: avoid; page-break-inside: avoid; }
  .banner { background: #fbecea; border: 1.5px solid #c94a3b; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; color: #6f1f17; }
  .opener { background: #f0efe6; border-left: 4px solid #b6693d; padding: 12px 14px; border-radius: 4px; margin-bottom: 12px; break-inside: avoid; }
  .opener .label { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.1em; color: #1f3d33; margin-bottom: 6px; }
  .opener blockquote { font-family: Georgia, serif; font-size: 13pt; margin: 0; line-height: 1.35; }
  ul, ol { margin: 0; padding-left: 20px; }
  li { margin: 4px 0; }
  ul.clusters { list-style: none; padding: 0; }
  ul.clusters li { border-left: 2px solid #b6693d; padding: 2px 0 6px 10px; margin: 8px 0; }
  ul.quotes li { font-style: italic; background: #f5f2e9; padding: 6px 10px; border-radius: 4px; margin: 6px 0; list-style: none; }
  ul.quotes { padding-left: 0; }
  .cluster { font-weight: 600; }
  .dim { color: #6b6f6a; font-size: 9.5pt; }
  .urgent h2 { color: #6f1f17; border-color: #c94a3b; }
  .turn { margin: 20px 0; padding-top: 12px; border-top: 1px dashed #d6d1c4; break-inside: avoid; }
  .turn:first-of-type { border-top: 0; padding-top: 0; }
  .turn-label { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.1em; color: #6b6f6a; margin-bottom: 8px; }
  .turn.user p { white-space: pre-wrap; background: #f5f2e9; padding: 10px 12px; border-radius: 6px; margin: 0; }
  footer.doc { margin-top: 24px; padding-top: 8px; border-top: 1px solid #d6d1c4; font-size: 9pt; color: #6b6f6a; font-style: italic; }
</style>
</head><body>
<div class="page">
  <header class="doc">
    <h1>Conversation brief</h1>
    <div class="meta">Prepared ${escapeHtml(dateStr)}</div>
  </header>
  ${blocks.join("\n")}
  <footer class="doc">This tool is intended to support symptom awareness and consultation preparation. It does not provide a diagnosis or replace medical advice.</footer>
</div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function saveConversationAsPdf(turns: ChatTurn[]) {
  if (!turns.length) return;
  const html = conversationToPrintableHtml(turns);
  const container = document.createElement("div");
  container.innerHTML = html;
  const page = container.querySelector(".page") as HTMLElement | null;
  const styleEl = container.querySelector("style");
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.style.width = "800px";
  wrapper.style.background = "#fff";
  if (styleEl) wrapper.appendChild(styleEl.cloneNode(true));
  if (page) wrapper.appendChild(page.cloneNode(true));
  document.body.appendChild(wrapper);

  const dateStr = new Date().toISOString().slice(0, 10);
  try {
    const mod = await import("html2pdf.js");
    const html2pdf = (mod as any).default ?? (mod as any);
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `conversation-brief-${dateStr}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(wrapper)
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
}

function openHtml(html: string) {
  // Blob URLs are the most reliable path on mobile Safari / Chrome, where
  // `window.open("")` + `document.write` is often blocked or renders blank.
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    // Popup blocked - navigate the current tab instead so the user still
    // gets to the printable view.
    window.location.href = url;
  }
  // Revoke later so the new tab has time to load.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
