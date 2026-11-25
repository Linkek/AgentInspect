# Research: instruction bloat & per-request token tax

## Cursor / agent configuration

| Pattern | Guidance | Source |
|---------|----------|--------|
| Rule size | Keep rules **under ~500 lines**; split composable rules | [Cursor Rules docs](https://cursor.com/docs/rules) |
| AGENTS.md | Short index; avoid duplicating codebase; nested AGENTS.md stacks cost | [Cursor Rules — AGENTS.md](https://cursor.com/docs/rules) |
| alwaysApply | Whole file on **every** chat when `alwaysApply: true` | [Scott Fox — Agentic Diet](https://scottfox.dev/articles/agentic-diet-per-request-token-tax/) |
| Measurement | Count always-on block before optimizing | Scott Fox; Cursor context meter |
| Compression | Backbone-doc pattern: triggers in rules, bodies in `docs/` | [Cursor forum — trim rules 32%](https://forum.cursor.com/t/trim-your-cursor-rules-token-load-by-32-shorthand-dictionary-backbone-doc-pattern-measured-57-files/169818) |

## What AgentInspect flags

- **Total footprint** — sum of discovered instruction files vs profile budget
- **Always-on proxy** — `.cursor/rules` with `alwaysApply: true` in frontmatter (when parseable) + root `AGENTS.md` size
- **Single-file bloat** — file tokens vs `maxSingleFileTokens`
- **Duplicates** — exact / normalized hash groups
- **Platform sprawl** — many parallel ecosystems (Cursor + Claude + Copilot + RoleSync) without clear ownership
- **MCP config size** — large `mcp.json` tool payloads

## RoleSync

Canonical tree: `.agents/` → generated `.claude/` / `.codex/`. Duplication between canonical and generated copies is expected; AgentInspect warns when **both** hand-edited and generated copies look like separate sources of truth.

Reference: [RoleSync on PyPI](https://pypi.org/project/rolesync/).