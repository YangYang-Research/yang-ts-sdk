import { afterEach, describe, expect, it, vi } from "vitest";
import { YogClient } from "./client.js";
import { YogApiError, YogTripwireTriggered } from "./errors.js";

const PROFILE = "YOG-AbCdEfGhIjKl";
const VERSION = "a1B2c3D4";
const BASE = "https://ai.yyng.icu";

function okBody(overrides: Record<string, unknown> = {}) {
  return {
    requestId: "yog_test",
    profile: { id: PROFILE, version: "1", versionId: VERSION },
    action: "NONE",
    actionReason: "No action.",
    outputs: [{ text: "hello" }],
    assessments: [],
    usage: {},
    guardrailCoverage: {},
    degraded: false,
    warnings: [],
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("YogClient.apply", () => {
  it("posts INPUT and returns result", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(okBody(), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new YogClient({ apiKey: "sk-yyng-test", baseUrl: BASE });
    const result = await client.apply({
      profileId: PROFILE,
      versionId: VERSION,
      source: "INPUT",
      content: [{ text: { text: "hello" } }],
    });

    expect(result.action).toBe("NONE");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${BASE}/yog/${PROFILE}/version/${VERSION}/apply`);
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer sk-yyng-test",
    });
  });

  it("raises tripwire on hard block", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          okBody({
            action: "GUARDRAIL_INTERVENED",
            actionReason: "Guardrail blocked: contentPolicy:hate",
            outputs: [{ text: "blocked" }],
          }),
          { status: 200 },
        ),
      ),
    );

    const client = new YogClient({ apiKey: "sk-yyng-test", baseUrl: BASE });
    await expect(
      client.apply({
        profileId: PROFILE,
        versionId: VERSION,
        source: "INPUT",
        content: [{ text: { text: "bad" } }],
        raiseOnTripwire: true,
      }),
    ).rejects.toBeInstanceOf(YogTripwireTriggered);
  });

  it("does not tripwire on anonymize", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          okBody({
            action: "GUARDRAIL_INTERVENED",
            actionReason: "Guardrail intervened: sensitiveInformationPolicy",
            outputs: [{ text: "***" }],
          }),
          { status: 200 },
        ),
      ),
    );

    const client = new YogClient({ apiKey: "sk-yyng-test", baseUrl: BASE });
    const result = await client.apply({
      profileId: PROFILE,
      versionId: VERSION,
      source: "OUTPUT",
      content: [{ text: { text: "a@b.com" } }],
      raiseOnTripwire: true,
    });
    expect(result.outputs[0]?.text).toBe("***");
  });

  it("maps HTTP errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { error: { message: "No entitlement", code: "entitlement_required" } },
          { status: 403 },
        ),
      ),
    );

    const client = new YogClient({ apiKey: "sk-yyng-test", baseUrl: BASE });
    try {
      await client.apply({
        profileId: PROFILE,
        versionId: VERSION,
        source: "INPUT",
        content: [{ text: { text: "x" } }],
      });
      expect.fail("expected YogApiError");
    } catch (e) {
      expect(e).toBeInstanceOf(YogApiError);
      expect((e as YogApiError).statusCode).toBe(403);
      expect((e as YogApiError).code).toBe("entitlement_required");
    }
  });

  it("rejects bad versionId", async () => {
    const client = new YogClient({ apiKey: "sk-yyng-test" });
    await expect(
      client.apply({
        profileId: PROFILE,
        versionId: "nope",
        source: "INPUT",
        content: [{ text: { text: "x" } }],
      }),
    ).rejects.toThrow(/versionId/);
  });
});
