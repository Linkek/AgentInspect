# Research: context windows & provider limits

Snapshot for AgentInspect scoring defaults (late 2025). Verify vendor docs before production billing decisions.

## Why this matters for instruction audits

Agent tools inject **rules, skills, MCP schemas, and AGENTS.md** into context. The context window is an upper bound; effective recall often degrades well below it (“context rot”). Scoring should compare **estimated instruction tokens** to **budgets**, not only to raw window size.

Sources:
- [Anthropic — Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- [OpenAI — GPT-5 for developers (400k total context)](https://openai.com/index/introducing-gpt-5-for-developers/)
- [Epoch AI — Context window growth](https://epoch.ai/data-insights/context-windows)
- n8n `context-limits.ts` snapshot (community-maintained model table): https://github.com/n8n-io/n8n/blob/master/packages/cli/src/modules/chat-hub/context-limits.ts

## Representative windows (tokens)

| Provider | Example model | Window (tokens) | Notes |
|----------|---------------|-----------------|-------|
| Anthropic | Claude Sonnet 4.5 / Opus 4.5 / Haiku 4.5 | 200,000 | 1M on newer “Fable/Mythos/Opus 5.x” family per Anthropic docs |
| OpenAI | GPT-5 / GPT-5-Codex | 400,000 | ~272k input + 128k output cited for API |
| OpenAI | GPT-5.1-chat-latest | 128,000 | Smaller chat variants exist |
| Google | Gemini 2.5 Pro / Flash | ~1,048,576 | Long-context; image/PDF caps separate |
| Cursor | (host-selected) | Use **profile** in `config/scoring-limits.json` | Editor bundles model + tools; treat as configurable |

## Budgets vs windows

AgentInspect uses **recommended budgets** (always-on rules, single file, total repo instructions) as fractions of the selected model window—not the full window. Defaults assume ~4% of window for “always-on” instruction tax and ~25% for all discoverable instruction files combined (heuristic).

## Safety factor

Many systems trim at ~95% of advertised window. `scoring-limits.json` includes optional `contextWindowSafetyFactor` (default 0.95) when computing effective window.

## Token estimation

Char÷4 is used consistently in-app (aligned with Cursor rule-of-thumb). For exact costs, integrate provider tokenizers later (Phase 2 in `PLAN.md`).