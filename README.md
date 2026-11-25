# Yang Open Guardrails — TypeScript SDK

Thin client for Yang Open Guardrails on `https://ai.yyng.icu`. Use it from an **existing agent app** to check text before the agent runs (`source: "INPUT"`) and before you show a reply (`source: "OUTPUT"`).

This SDK does **not** call chat/completions or wrap OpenAI/Anthropic.

## Install

```bash
npm install @yangyang/open-guardrails
```

## Auth

- API key: `YANG_API_KEY` or `new YogClient({ apiKey: "sk-yyng…" })`
- Entitlement: `yang_open_guardrails`
- Profile: Studio-published `profileId` + `versionId` (8-char)

## Quickstart

```ts
import { YogClient, YogTripwireTriggered } from "@yangyang/open-guardrails";

const client = new YogClient({ apiKey: "sk-yyng…" });

try {
  // Before your agent / LLM
  await client.apply({
    profileId: "YOG-AbCdEfGhIjKl",
    versionId: "a1B2c3D4",
    source: "INPUT",
    content: [{ text: { text: userMessage } }],
    raiseOnTripwire: true,
  });
} catch (e) {
  if (e instanceof YogTripwireTriggered) {
    show(e.result.outputs[0]?.text);
    return;
  }
  throw e;
}

let reply = await runYourAgent(userMessage); // your code

const out = await client.apply({
  profileId: "YOG-AbCdEfGhIjKl",
  versionId: "a1B2c3D4",
  source: "OUTPUT",
  content: [{ text: { text: reply } }],
});
if (out.action === "GUARDRAIL_INTERVENED") {
  reply = out.outputs[0]?.text ?? reply;
}
show(reply);
```

Optional: `outputScope`, `groundingSource`, `query`.

`raiseOnTripwire: true` throws only on hard blocks (`actionReason` starts with `Guardrail blocked`). Anonymize returns `ApplyResult` so you can use `outputs`.

## Example

```bash
export YANG_API_KEY=sk-yyng…
export YOG_PROFILE_ID=YOG-…
export YOG_VERSION_ID=a1B2c3D4
npx tsx examples/hello_world.ts "Hello"
```

## Develop

```bash
npm ci
npm test
npm run build
```

## Publish checklist (maintainers)

Do **not** publish until asked.

1. Bump `version` in `package.json`
2. `npm run build && npm pack --dry-run`
3. `npm publish --access public` (package: `@yangyang/open-guardrails`)

## License

MIT
