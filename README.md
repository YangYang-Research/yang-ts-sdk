# Yang TypeScript SDK

Official TypeScript/JavaScript SDK for YangYang products. Use it from your apps and agents to call Yang APIs with a small, typed client.

## Install

```bash
npm install @yangyangxresearch/yang-ts-sdk
```

## Tools

| Tool | Import | Docs |
|------|--------|------|
| **Open Guardrails** | `@yangyangxresearch/yang-ts-sdk/open-guardrails` | [docs/open-guardrails.md](docs/open-guardrails.md) |

New tools land as sibling folders under `src/<tool>/` with a matching `exports` entry — shared key/base URL stay in `config`.

## Setup

Create an API key in Yang Studio (`sk-yyng…`) and put it in `.env`:

```bash
YANG_API_KEY=sk-yyng…
```

## License

Apache License 2.0
