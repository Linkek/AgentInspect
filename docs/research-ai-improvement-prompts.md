# Research: improving agent instructions with local LLMs

AgentInspect’s **AI improve** pass uses structured system/user prompts in `src-tauri/src/ai.rs`. Goals:

1. **Lower always-on and path-scoped token tax** without breaking agent behavior.
2. **Preserve** prohibitions, tooling constraints, and activation metadata (frontmatter, globs, skill triggers).
3. **Avoid lossy summarization** that drops process rules after “compaction-style” edits.

## Practitioner sources

| Idea | Guidance | Reference |
|------|-----------|-----------|
| Always-on cost | Count and trim rules that load every chat first | [Scott Fox — Agentic Diet](https://scottfox.dev/articles/agentic-diet-per-request-token-tax/) |
| Rule size | Prefer composable rules; very long single files are hard to maintain | [Cursor Rules docs](https://cursor.com/docs/rules) |
| Backbone pattern | Keep triggers/constraints in the rule; move long tutorials to linked docs | [Cursor forum — backbone doc pattern](https://forum.cursor.com/t/trim-your-cursor-rules-token-load-by-32-shorthand-dictionary-backbone-doc-pattern-measured-57-files/169818) |
| Load scopes | `always_on` vs `on_demand` vs `path_scoped` — trim aggressiveness differs | `docs/research-context-loading.md` |

## Research papers (design constraints)

| Paper | Takeaway for our editor |
|-------|-------------------------|
| [ProCut (2025)](https://arxiv.org/abs/2508.02053) | Prune **low-utility segments**, keep order; large token cuts possible when utility-guided — we imitate this with “classify segments, drop redundancy, keep high-impact constraints.” |
| [Information preservation in prompt compression (2025)](https://arxiv.org/abs/2503.19114) | Measure preservation, not just length — we explicitly forbid `...` / “unchanged” ellipsis and require full files. |
| [Rule compliance under compaction (2026)](https://arxiv.org/abs/2611.03223) | Compaction often drops **operating rules** — our prompt labels behavioral/conditional blocks as do-not-delete without rewriting. |
| [Policy internalization (2025)](https://arxiv.org/abs/2510.11588) | Split **factual / behavioral / conditional** specs — editor keeps behavioral + conditional intact, compresses narrative fluff. |

## What the local model must never remove

- Frontmatter keys (`globs`, `alwaysApply`, `description`, etc.) unless the user asks.
- `NEVER` / `MUST` / security / git / secret-handling / destructive-command guards.
- Package-manager or toolchain pins the repo actually uses.
- Skill **when-to-use** and trigger text.
- RoleSync: canonical `.agents/` semantics (edit source, not generated mirrors).

## Safe compression tactics (first pass)

- Duplicate paragraphs and overlapping bullets.
- Polite filler and repeated restatements of the same constraint.
- Multiple examples that illustrate the same rule (keep one strong example).
- Long prose → tight imperative bullets where meaning is unchanged.

Target **~15–35%** shorter on a typical first pass; more only when the scanner flagged bloat and no compliance text is at risk.