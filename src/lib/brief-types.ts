export type SymptomCluster = {
  cluster: string;
  detail: string;
  duration_pattern: string;
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
};

export type ChatTurn =
  | { role: "user"; text: string; id: string; createdAt: number }
  | { role: "assistant"; brief: Brief; id: string; createdAt: number };