export type SymptomCluster = {
  cluster: string; // plain English, e.g. "Memory and thinking", "Vaginal and urinary" - never clinical terms
  detail: string;
  duration_pattern: string;
};

export type ClinicalSymptom = {
  system: string; // e.g. "Vasomotor", "Genitourinary", "Psychological"
  findings: string; // clinical descriptors, jargon acceptable
  onset_pattern: string; // chronology in clinical terms
};

export type ClinicalBrief = {
  presenting_complaint: string; // 1–2 line clinical summary
  hpc: string; // history of presenting complaint, chronology
  symptoms_by_system: ClinicalSymptom[];
  functional_impact: string;
  relevant_history: string[]; // PMH, DHx, obstetric/menstrual context user mentioned
  medications_tried: string[]; // OTC + Rx + supplements the user reports
  red_flags: string[]; // clinical wording
  clinical_impression: string; // e.g. "Symptom picture consistent with perimenopause (NG23)"
  suggested_actions: string[]; // e.g. "Trial of transdermal oestradiol + micronised progesterone per NG23"
  investigations_to_consider: string[]; // e.g. "TSH, FBC, ferritin to exclude alternative causes"
  safety_netting: string;
  guideline_refs: string[]; // e.g. "NICE NG23", "BMS 2020"
};

export type Brief = {
  urgent_banner: string | null;
  one_line_summary: string;
  symptom_summary: SymptomCluster[];
  timeline: string;
  impact_statement: string;
  already_tried: string[];
  questions_to_ask: string[];
  if_dismissed: string[];
  red_flags: string[];
  what_to_expect: string;
  bring_with_you: string[];
  disclaimer: string;
  clarifying_questions?: string[];
  out_of_scope?: string;
  clinical?: ClinicalBrief;
};

export type AgeBand = "under_35" | "35_39" | "40_44" | "45_plus";

export type ChatTurn =
  | { role: "user"; text: string; id: string; createdAt: number }
  | {
      role: "assistant";
      brief: Brief;
      id: string;
      createdAt: number;
      ageBand?: AgeBand;
      mode?: "perimenopause" | "general";
    };