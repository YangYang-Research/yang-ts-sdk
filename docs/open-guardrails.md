# Open Guardrails

Check prompts and model replies against a safety profile (content, privacy, brand rules) so your agent or app can allow, block, or redact text before users see it.

## Install

```bash
npm install @yangyangxresearch/open-guardrails
```

## Setup

1. Create an API key in Yang Studio (`sk-yyng…`)
2. Create an Open Guardrails profile and copy its profile id and version id
3. Put the API key in a `.env` file in your project:

```bash
YANG_API_KEY=sk-yyng…
```

## How to use

Call `apply` twice around your agent:

1. **`source: "INPUT"`** — check the user message **before** you call the agent  
2. Run your agent / LLM as usual  
3. **`source: "OUTPUT"`** — check the agent reply **before** you show it  

If `action` is `NONE`, continue.  
If `action` is `GUARDRAIL_INTERVENED`, use `outputs[0].text` from the response.

```ts
import { YogClient } from "@yangyangxresearch/open-guardrails";

const client = new YogClient();
const profileId = "YOG-AbCdEfGhIjKl";
const versionId = "a1B2c3D4";

// --- Before agent ---
const inbound = await client.apply({
  profileId,
  versionId,
  source: "INPUT",
  content: [{ text: { text: userMessage } }],
});

if (inbound.action === "GUARDRAIL_INTERVENED") {
  // Do not call the agent. Show this text to the user instead.
  show(inbound.outputs[0]?.text);
  return;
}

// --- Your agent ---
let reply = await runYourAgent(userMessage);

// --- Before show reply ---
const outbound = await client.apply({
  profileId,
  versionId,
  source: "OUTPUT",
  content: [{ text: { text: reply } }],
});

if (outbound.action === "GUARDRAIL_INTERVENED") {
  // Agent already ran. Replace the reply with the safe text, then show it.
  reply = outbound.outputs[0]?.text ?? reply;
}

show(reply);
```

### SDK parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `profileId` | yes | Open Guardrails profile id from Studio |
| `versionId` | yes | Profile version id from Studio |
| `source` | yes | `INPUT` = check before agent. `OUTPUT` = check before show reply |
| `content` | yes | Text to check: `[{ text: { text: "..." } }]` |
| `outputScope` | no | `INTERVENTIONS` (default) or `FULL` — how much detail in `assessments` |

### What you get back

| Field | Description |
|-------|-------------|
| `action` | `NONE` = OK, continue. `GUARDRAIL_INTERVENED` = use `outputs[0].text` |
| `outputs` | Text to use when the profile intervened |
| `actionReason` | Short reason when intervened |
| `assessments` | Extra detail (`outputScope` controls how much) |

## Quickcheck

```bash
export YANG_API_KEY=sk-yyng…
export YOG_PROFILE_ID=YOG-…
export YOG_VERSION_ID=a1B2c3D4
npx tsx examples/hello_world.ts "Hello"
```
