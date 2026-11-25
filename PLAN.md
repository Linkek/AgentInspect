# AgentInspect — product & engineering plan

Living plan for the Token Health Scanner desktop app. Research notes live in [`docs/`](docs/).

## Vision

Give teams a **local, private** health check for AI agent configuration: rules, skills, MCP, Copilot/Claude/Codex/RoleSync trees. Output a **0–100 score**, ranked issues, charts, and an in-app **VS Code–style** viewer for problematic instruction files.

## Phases

### Phase 0 — Foundation ✅

- [x] Tauri 2 + React + MUI, pnpm-only
- [x] Repo scanner (`scanner.rs`) with platform classification
- [x] Basic dashboard (tokens, duplicates, tables)
- [x] `AGENTS.md` + Cursor rules for contributors

### Phase 1 — Plan, research, configurable limits ✅ (this goal)

- [x] `PLAN.md` (this file)
- [x] `docs/research-*.md` with sourced limits & bloat patterns
- [x] `config/scoring-limits.json` — **provider + model** profiles, fractions of context window, weights
- [x] Runtime load + UI profile picker
- [x] Scoring engine: overall 0–100 + ranked `issues` + `highlights`
- [x] Scan **progress bar** (walk → read → analyze)
- [x] Multi-page UI: **Score**, **Issues**, **Charts**, **Browse**, **Settings**
- [x] Browse: syntax-highlighted file view with flagged lines
- [x] Dark mode only (no theme toggle)

### Phase 2 — Accuracy & policy (next)

- [ ] Parse `.mdc` YAML for `alwaysApply`, `globs`, `description` (structured, not regex-only)
- [ ] Cursor-specific: estimate skills index vs body load separately
- [ ] MCP schema token estimator (JSON size per server)
- [ ] Per-workspace `.agentinspect/limits.json` override in scanned repo
- [ ] Export: JSON + HTML report artifact
- [ ] Real tokenizer (tiktoken / model-specific) behind feature flag

### Phase 3 — Collaboration

- [ ] Baseline diff: compare two scans / branches
- [ ] CI task: `agentinspect-cli scan --fail-under 70`
- [ ] Suggested fixes (split rule, dedupe link) with diff preview

## Scoring model (v1)

**Overall score** = 100 − weighted penalty, clamped 0–100.

| Dimension | Weight (configurable) | Penalty driver |
|-----------|----------------------|----------------|
| Total footprint | 0.30 | `estimatedTokens` vs `totalInstructionsBudget` |
| Always-on proxy | 0.20 | Root `AGENTS.md` + rules with `alwaysApply` vs budget |
| Oversized files | 0.20 | Count of files over `maxSingleFileTokens` |
| Duplicates | 0.20 | Duplicate groups × wasted tokens |
| Platform sprawl | 0.05 | Many platforms with similar token mass |
| MCP bloat | 0.05 | Large `mcp.json` files |

**Issues** list: one entry per finding; `severity` 0–100 (higher = worse); sort descending.

**Highlights**: positive signals (no duplicates, under budget, concise AGENTS.md).

Limits are **not** hardcoded in Rust logic beyond the bundled JSON — edit `config/scoring-limits.json` or use Settings UI (persisted to app data).

## UI map

```
┌─────────────────────────────────────────────────────────┐
│ AppBar: Open folder │ Profile: Provider / Model         │
├─────────────────────────────────────────────────────────┤
│ [Score] [Issues] [Charts] [Browse] [Settings]           │
├─────────────────────────────────────────────────────────┤
│ Score tab: gauge 0–100, dimension bars, highlights      │
│ Issues tab: ranked horizontal bars (worst first)        │
│ Charts tab: platform pie, largest files, kinds          │
│ Browse tab: file list │ VS Code–style viewer + flags    │
│ Settings tab: provider/model + reset limits             │
└─────────────────────────────────────────────────────────┘
```

During scan: linear progress + phase label (`Walking…`, `Reading…`, `Scoring…`).

## Architecture

| Component | Path |
|-----------|------|
| Scan + classify | `src-tauri/src/scanner.rs` |
| Limits profiles | `src-tauri/src/limits.rs` + `config/scoring-limits.json` |
| Score + issues | `src-tauri/src/scoring.rs` |
| IPC | `src-tauri/src/lib.rs` — `scan_repo`, `get_scoring_limits`, `read_instruction_file` |
| Events | `scan-progress` payload |
| UI shell | `src/App.tsx`, `src/pages/*` |

## Success criteria (Phase 1)

1. User selects folder → sees progress → receives score page.
2. Changing provider/model changes budgets and score in Settings.
3. Issues sorted worst-first with color bars.
4. Browse opens flagged files with line-level warnings.
5. `pnpm build` passes; docs + plan committed in repo.

## Maintenance

When vendors change context windows, update `config/scoring-limits.json` and cite sources in `docs/research-context-windows.md`. Bump `version` in JSON if schema changes (add `config/scoring-limits.schema.json` in Phase 2).