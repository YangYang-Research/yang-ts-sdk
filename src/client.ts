import { YogApiError, YogTripwireTriggered } from "./errors.js";
import type { ApplyParams, ApplyResult } from "./types.js";

export const DEFAULT_BASE_URL = "https://ai.yyng.icu";
const VERSION_ID_RE = /^[A-Za-z0-9]{8}$/;

export type YogClientOptions = {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
};

function isBlocked(result: ApplyResult): boolean {
  if (result.action !== "GUARDRAIL_INTERVENED") return false;
  return String(result.actionReason || "").startsWith("Guardrail blocked");
}

export class YogClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: YogClientOptions = {}) {
    const key = (opts.apiKey || process.env.YANG_API_KEY || "").trim();
    if (!key) throw new Error("apiKey or YANG_API_KEY is required");
    this.apiKey = key;
    this.baseUrl = (opts.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.fetchImpl = opts.fetch ?? fetch;
  }

  async apply(params: ApplyParams): Promise<ApplyResult> {
    const profileId = (params.profileId || "").trim();
    const versionId = (params.versionId || "").trim();
    if (!profileId) throw new Error("profileId is required");
    if (!VERSION_ID_RE.test(versionId)) {
      throw new Error("versionId must be 8 chars A-Za-z0-9");
    }
    if (params.source !== "INPUT" && params.source !== "OUTPUT") {
      throw new Error("source must be INPUT or OUTPUT");
    }
    if (!params.content?.length) {
      throw new Error("content must be a non-empty array");
    }

    const body: Record<string, unknown> = {
      source: params.source,
      content: params.content,
    };
    if (params.outputScope != null) body.outputScope = params.outputScope;
    if (params.groundingSource != null) body.groundingSource = params.groundingSource;
    if (params.query != null) body.query = params.query;

    const url = `${this.baseUrl}/yog/${encodeURIComponent(profileId)}/version/${encodeURIComponent(versionId)}/apply`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      throw new YogApiError(`Request failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      clearTimeout(timer);
    }

    let raw: unknown;
    try {
      raw = await res.json();
    } catch {
      raw = { error: { message: "Non-JSON response" } };
    }

    if (!res.ok) {
      const err =
        raw && typeof raw === "object" && "error" in raw
          ? (raw as { error?: { message?: string; code?: string } }).error
          : undefined;
      throw new YogApiError(err?.message || res.statusText || "Request failed", {
        statusCode: res.status,
        code: err?.code,
        body: raw,
      });
    }

    if (!raw || typeof raw !== "object") {
      throw new YogApiError("Invalid apply response", { statusCode: res.status, body: raw });
    }

    const result = raw as ApplyResult;
    if (params.raiseOnTripwire && isBlocked(result)) {
      throw new YogTripwireTriggered(result);
    }
    return result;
  }
}
