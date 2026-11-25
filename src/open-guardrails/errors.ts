import type { ApplyResult } from "./types.js";

export class YogApiError extends Error {
  readonly statusCode?: number;
  readonly code?: string;
  readonly body?: unknown;

  constructor(
    message: string,
    opts?: { statusCode?: number; code?: string; body?: unknown },
  ) {
    super(message);
    this.name = "YogApiError";
    this.statusCode = opts?.statusCode;
    this.code = opts?.code;
    this.body = opts?.body;
  }
}

export class YogTripwireTriggered extends Error {
  readonly result: ApplyResult;

  constructor(result: ApplyResult) {
    super(result.actionReason || "Guardrail intervened");
    this.name = "YogTripwireTriggered";
    this.result = result;
  }
}
