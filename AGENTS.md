# AgentInspect — agent / developer guide

Desktop scanner (Tauri 2 + React 19 + MUI 9) for AI instruction bloat, duplicates, and platform mix in repositories.

## Commands (pnpm only)

Do **not** use `npm` or `yarn` in this repo.

```bash
pnpm install
pnpm dev              # Vite UI only (no Rust)
pnpm build            # Typecheck + production frontend bundle
pnpm tauri dev        # Full desktop app (progress events + scan)
pnpm tauri build      # Release binary

Roadmap: `PLAN.md`. Research: `docs/`. Limits: `config/scoring-limits.json`.
```

Requires **Rust stable** and [Tauri Windows prerequisites](https://tauri.app/start/prerequisites/).

## Architecture

| Layer | Path | Responsibility |
|--------|------|----------------|
| Scan & analysis | `src-tauri/src/scanner.rs` | Classify paths, read files, token estimates, duplicates, RoleSync detection |
| Tauri IPC | `src-tauri/src/lib.rs` | `scan_repo` command |
| Shared types | `src/types/scan.ts` | Must match Rust `ScanSummary` serde (`camelCase`) |
| UI | `src/App.tsx`, `src/components/*` | Folder picker, dashboard, charts (recharts) |
| Theme | `src/theme.ts` | MUI dark theme |

**Data flow:** User picks folder → `@tauri-apps/plugin-dialog` → `invoke('scan_repo')` → `scan_repository()` → per-platform `PlatformScanBundle` → React state (active platform tab).

**Local AI (optional):** Settings → Local AI → pick Ollama model. Sidebar **AI improve** (`AgentPage` / `AgentWorkspace`) → draft, diff, chat (`refine_instruction_improvement`) → `apply_instruction_file` (backup under `.agentinspect/backups/`). Prompt design: `src-tauri/src/ai.rs` + `docs/research-ai-improvement-prompts.md` (preserve behavioral constraints; trim redundancy). Explorer is read-only; **Improve in AI page** jumps here.

## Adding a new platform or file pattern

1. Extend `classify()` in `scanner.rs` (platform + kind strings).
2. Add a label in `PLATFORM_LABELS` in `src/types/scan.ts` if the UI should show a friendly name.
3. Run `pnpm build` and smoke-test with a repo that contains the new paths.

Keep classification **path-based** (no MIME magic). Respect existing skip list in `skip_dir()` and the `ignore` crate walker.

## UI conventions

- MUI components; avoid raw CSS except global baseline.
- Prefer small presentational components under `src/components/`.
- Chart/tooltip formatters: recharts `ValueType` is loose — use `Number(value ?? 0)`.
- MUI `Stack` layout props like `alignItems` go in `sx`, not as direct props (MUI v9 typing).

## Rust conventions

- Serialize with `#[serde(rename_all = "camelCase")]` on types consumed by the frontend.
- New Tauri commands: register in `lib.rs`, add capability permissions if a plugin is involved.
- Prefer `thiserror` only if error surface grows; today commands return `Result<T, String>`.

## Token / duplicate semantics

- **Estimated tokens:** `(chars + 3) / 4` — heuristic, not a tokenizer.
- **Exact duplicate:** SHA-256 of raw file content.
- **Near duplicate:** SHA-256 of normalized body (trimmed non-empty lines, lowercase).
- **Bloat highlight in table:** `estimatedTokens >= 2000`.

Do not change these without updating this doc and the README.

## Testing without Tauri

`pnpm build` validates TypeScript. Rust changes need `pnpm tauri dev` or `cargo check` in `src-tauri/`.

For scanner logic, temporarily add `#[cfg(test)]` unit tests in `scanner.rs` with fixture paths — keep fixtures small and local.

## Product name

User-facing: **AgentInspect**. Crate/binary: `agentinspect`. Bundle id: `com.agentinspect.app`.