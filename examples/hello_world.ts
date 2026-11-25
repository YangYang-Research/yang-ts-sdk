/**
 * Agent-app hook: apply INPUT before agent, OUTPUT before showing reply.
 * Run: YANG_API_KEY=… YOG_PROFILE_ID=… YOG_VERSION_ID=… npx tsx examples/hello_world.ts "Hello"
 */
import { YogApiError, YogClient, YogTripwireTriggered } from "../src/index.js";

async function main(): Promise<number> {
  const apiKey = (process.env.YANG_API_KEY || "").trim();
  const profileId = (process.env.YOG_PROFILE_ID || "").trim();
  const versionId = (process.env.YOG_VERSION_ID || "").trim();
  if (!apiKey || !profileId || !versionId) {
    console.error("Set YANG_API_KEY, YOG_PROFILE_ID, YOG_VERSION_ID");
    return 1;
  }

  const userMessage = process.argv.slice(2).join(" ") || "Hello";
  const client = new YogClient({ apiKey });

  try {
    const inbound = await client.apply({
      profileId,
      versionId,
      source: "INPUT",
      content: [{ text: { text: userMessage } }],
      raiseOnTripwire: true,
    });

    // Your agent / LLM runs here — SDK does not call inference.
    const assistantReply = `Echo: ${inbound.outputs[0]?.text ?? userMessage}`;

    const outbound = await client.apply({
      profileId,
      versionId,
      source: "OUTPUT",
      content: [{ text: { text: assistantReply } }],
    });

    if (outbound.action === "GUARDRAIL_INTERVENED") {
      console.log(outbound.outputs[0]?.text || assistantReply);
    } else {
      console.log(assistantReply);
    }
    return 0;
  } catch (e) {
    if (e instanceof YogTripwireTriggered) {
      console.log("INPUT blocked:", e.result.outputs[0]?.text);
      return 2;
    }
    if (e instanceof YogApiError) {
      console.error("API error:", e.message);
      return 1;
    }
    throw e;
  }
}

main().then((code) => {
  process.exitCode = code;
});
