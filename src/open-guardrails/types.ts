export type ApplySource = "INPUT" | "OUTPUT";
export type OutputScope = "INTERVENTIONS" | "FULL";
export type ApplyAction = "NONE" | "GUARDRAIL_INTERVENED";

export type ContentBlock = {
  text: {
    text: string;
    qualifiers?: "yang_open_guardrails";
  };
};

export type ApplyResult = {
  requestId: string;
  profile: {
    id?: string;
    version?: string;
    versionId?: string;
  };
  action: ApplyAction;
  actionReason: string;
  outputs: Array<{ text?: string }>;
  assessments: Record<string, unknown>[];
  usage: Record<string, unknown>;
  guardrailCoverage: Record<string, unknown>;
  degraded: boolean;
  warnings: Array<{ code?: string; policy?: string; message?: string }>;
};

export type ApplyParams = {
  profileId: string;
  versionId: string;
  source: ApplySource;
  content: ContentBlock[];
  outputScope?: OutputScope;
  groundingSource?: string;
  query?: string;
  raiseOnTripwire?: boolean;
};
