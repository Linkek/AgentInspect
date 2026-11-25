# Research: what actually loads into agent context

Heuristics used by AgentInspect v2 (see `load_scope` on each file).

## Load scopes

| Scope | Meaning | Examples |
|-------|---------|----------|
| **always_on** | Likely on most chats / sessions | `alwaysApply: true` rules, root `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` |
| **path_scoped** | Injected when matching files are in play | `.cursor/rules` with `globs`, `.github/instructions/*`, nested `AGENTS.md` |
| **on_demand** | Body loaded when task matches or user `@` mentions | Cursor **skills** (name+description in index; body on invoke), rules with description-only |
| **tool_config** | MCP / tool schemas when servers are enabled | `mcp.json`, `.cursor/mcp.json` |
| **generated** | RoleSync mirrors under `.claude/` / `.codex/` | Should not be edited by hand |
| **reference** | Skill helpers, long docs linked from skills | `reference.md`, scripts under skills |

## Scoring impact

- **Health score “always-on proxy”** uses only `always_on` tokens vs profile budget.
- **Repo total footprint** still counts everything found on disk.
- **Analytics “latent tokens”** = total − always-on (rough “not every turn” estimate).

## Not modeled yet (Phase 2)

- Skill index-only token weight (description vs full `SKILL.md`)
- Nested `AGENTS.md` stacking
- MCP per-server enablement in the IDE
- Exact tokenizer per provider

Sources: [Cursor rules](https://cursor.com/docs/rules), [Scott Fox — agentic diet](https://scottfox.dev/articles/agentic-diet-per-request-token-tax/), [RoleSync](https://pypi.org/project/rolesync/).