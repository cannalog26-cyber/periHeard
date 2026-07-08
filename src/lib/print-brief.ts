import type { Brief, ClinicalBrief } from "./brief-types";

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
    parts.push(section("Red flags — seek prompt review", list(brief.red_flags), "urgent"));
  if (brief.what_to_expect)
    parts.push(section("What a good consultation looks like", `<p>${esc(brief.what_to_expect)}</p>`));
  if (brief.bring_with_you?.length)
    parts.push(section("Bring with me", list(brief.bring_with_you)));

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>Appointment brief — ${dateStr}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #1f2b26; font-size: 11pt; line-height: 1.5;
    background: #fff;
  }
  .page { max-width: 720px; margin: 0 auto; padding: 24px; }
  header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #d6d1c4; padding-bottom: 8px; margin-bottom: 18px; }
  header h1 { font-family: Georgia, "Times New Roman", serif; font-size: 18pt; margin: 0; color: #1f3d33; }
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
  footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #d6d1c4; font-size: 9pt; color: #6b6f6a; font-style: italic; }
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
    <h1>Appointment brief</h1>
    <div class="meta">Prepared ${esc(dateStr)}</div>
  </header>
  ${parts.join("\n")}
  <footer>${esc(brief.disclaimer || "This tool is intended to support symptom awareness and consultation preparation. It does not provide a diagnosis or replace medical advice.")}</footer>
</div>
<script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 400); });</script>
</body></html>`;
}

export function openBriefForPrint(brief: Brief) {
  const html = briefToPrintableHtml(brief);
  openHtml(html);
}

function openHtml(html: string) {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) {
    // Popup blocked — fall back to a data URL in the same tab
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

// ---------------- GP / clinical version ----------------

function clinSection(title: string, body: string): string {
  if (!body) return "";
  return `<section class="c-section"><h2>${esc(title)}</h2>${body}</section>`;
}

function clinList(items: string[]): string {
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

export function clinicalBriefToPrintableHtml(brief: Brief): string {
  const c: ClinicalBrief | undefined = brief.clinical;
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const parts: string[] = [];

  if (brief.urgent_banner) {
    parts.push(
      `<div class="c-banner"><strong>⚠ Safety flag:</strong> ${esc(brief.urgent_banner)}</div>`,
    );
  }

  if (!c) {
    parts.push(
      `<div class="c-note">No structured clinical summary was generated. See patient version for narrative content.</div>`,
    );
  }

  if (c?.presenting_complaint)
    parts.push(clinSection("Presenting complaint", `<p>${esc(c.presenting_complaint)}</p>`));
  if (c?.hpc) parts.push(clinSection("HPC", `<p>${esc(c.hpc)}</p>`));

  if (c?.symptoms_by_system?.length) {
    const rows = c.symptoms_by_system
      .map(
        (s) =>
          `<tr><th>${esc(s.system)}</th><td>${esc(s.findings)}</td><td class="dim">${esc(s.onset_pattern)}</td></tr>`,
      )
      .join("");
    parts.push(
      clinSection(
        "Symptoms by system",
        `<table class="sys"><thead><tr><th>System</th><th>Findings</th><th>Onset / pattern</th></tr></thead><tbody>${rows}</tbody></table>`,
      ),
    );
  }

  if (c?.functional_impact)
    parts.push(clinSection("Functional impact", `<p>${esc(c.functional_impact)}</p>`));

  if (c?.relevant_history?.length)
    parts.push(clinSection("Relevant Hx", clinList(c.relevant_history)));
  if (c?.medications_tried?.length)
    parts.push(clinSection("Medications / self-management tried", clinList(c.medications_tried)));

  if (c?.red_flags?.length)
    parts.push(
      `<section class="c-section urgent"><h2>Red flags</h2>${clinList(c.red_flags)}</section>`,
    );

  if (c?.clinical_impression)
    parts.push(clinSection("Clinical impression", `<p>${esc(c.clinical_impression)}</p>`));
  if (c?.suggested_actions?.length)
    parts.push(clinSection("Suggested actions to consider", clinList(c.suggested_actions)));
  if (c?.investigations_to_consider?.length)
    parts.push(
      clinSection("Investigations to consider", clinList(c.investigations_to_consider)),
    );
  if (c?.safety_netting)
    parts.push(clinSection("Safety-netting", `<p>${esc(c.safety_netting)}</p>`));
  if (c?.guideline_refs?.length)
    parts.push(clinSection("Guideline references", clinList(c.guideline_refs)));

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>Clinical summary — ${dateStr}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #0f172a; font-size: 10.5pt; line-height: 1.45;
    background: #fff;
  }
  .page { max-width: 760px; margin: 0 auto; padding: 20px; }
  header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 14px; }
  header h1 { font-family: Georgia, "Times New Roman", serif; font-size: 16pt; margin: 0; color: #0f172a; letter-spacing: -0.01em; }
  header .meta { font-size: 9pt; color: #475569; }
  .subhead { font-size: 9pt; color: #475569; margin: -8px 0 14px; }
  h2 { font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.08em; color: #0f172a; margin: 0 0 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; }
  .c-section { margin: 10px 0; break-inside: avoid; page-break-inside: avoid; }
  .c-banner { background: #fef2f2; border: 1.5px solid #b91c1c; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; color: #7f1d1d; font-size: 10pt; }
  .c-note { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; font-size: 10pt; color: #475569; }
  .urgent h2 { color: #7f1d1d; border-color: #b91c1c; }
  ul { margin: 0; padding-left: 18px; }
  li { margin: 2px 0; }
  p { margin: 0; }
  table.sys { width: 100%; border-collapse: collapse; font-size: 10pt; }
  table.sys th, table.sys td { border-bottom: 1px solid #e2e8f0; padding: 4px 6px; text-align: left; vertical-align: top; }
  table.sys thead th { background: #f1f5f9; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; border-bottom: 1.5px solid #94a3b8; }
  table.sys tbody th { font-weight: 600; width: 20%; color: #0f172a; }
  .dim { color: #64748b; font-size: 9.5pt; width: 28%; }
  footer { margin-top: 20px; padding-top: 6px; border-top: 1px solid #cbd5e1; font-size: 8.5pt; color: #64748b; }
  @media print { .noprint { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  .actions { position: fixed; top: 12px; right: 12px; display: flex; gap: 8px; }
  .actions button { background: #0f172a; color: #fff; border: 0; padding: 8px 14px; border-radius: 6px; font: inherit; font-size: 10pt; cursor: pointer; }
  .actions button.secondary { background: #fff; color: #0f172a; border: 1px solid #0f172a; }
</style>
</head><body>
<div class="actions noprint">
  <button onclick="window.print()">Save as PDF / Print</button>
  <button class="secondary" onclick="window.close()">Close</button>
</div>
<div class="page">
  <header>
    <h1>Clinical summary for GP</h1>
    <div class="meta">Prepared ${esc(dateStr)}</div>
  </header>
  <p class="subhead">Patient-generated summary via PeriHeard. Not a clinical record; not diagnostic. For consultation support only.</p>
  ${parts.join("\n")}
  <footer>${esc(brief.disclaimer || "This tool is intended to support symptom awareness and consultation preparation. It does not provide a diagnosis or replace medical advice.")}</footer>
</div>
<script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 400); });</script>
</body></html>`;
}

export function openClinicalBriefForPrint(brief: Brief) {
  openHtml(clinicalBriefToPrintableHtml(brief));
}