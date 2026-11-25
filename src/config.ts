import { config as loadEnv } from "dotenv";

export const DEFAULT_BASE_URL = "https://ai.yyng.icu";

export type YangCredentialsOptions = {
  apiKey?: string;
  baseUrl?: string;
  /** Path to `.env` (default: load from cwd). Set `false` to skip. */
  envFile?: string | false;
};

export function resolveCredentials(opts: YangCredentialsOptions = {}): {
  apiKey: string;
  baseUrl: string;
} {
  if (opts.envFile !== false) {
    loadEnv(opts.envFile ? { path: opts.envFile } : undefined);
  }
  const apiKey = (opts.apiKey || process.env.YANG_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("YANG_API_KEY is required (set it in .env or pass apiKey)");
  }
  const baseUrl = (opts.baseUrl || process.env.YANG_BASE_URL || DEFAULT_BASE_URL).replace(
    /\/$/,
    "",
  );
  return { apiKey, baseUrl };
}
