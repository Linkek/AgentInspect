# AgentInspect

**Website:** [linkek.github.io/AgentInspect](https://linkek.github.io/AgentInspect/)

Desktop app (Tauri 2 + React + MUI) that scans a repository for **AI agent configuration**: Cursor rules/skills/MCP, GitHub Copilot instructions, `AGENTS.md` / `CLAUDE.md`, Claude Code and Codex trees, **RoleSync** (`.agents/`), Windsurf, Continue, OpenSpec, and common `mcp.json` locations.

It estimates **token footprint** (chars ÷ 4 heuristic), highlights **large/bloated** files, and finds **exact and near-duplicate** instruction bodies that can inflate context cost.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Rust toolchain](https://www.rust-lang.org/tools/install) — required for Tauri (`rustup` on Windows)
- [Tauri prerequisites for Windows](https://tauri.app/start/prerequisites/)

## Development

This repo uses **pnpm** (`packageManager` pinned in `package.json`).

```bash
cd AgentInspect
pnpm install
pnpm tauri:dev
# Windows (loads .env + MSVC): pnpm tauri:dev:win
```

AI / contributor context: [`AGENTS.md`](AGENTS.md), [`.cursor/rules/`](.cursor/rules/), [`.github/copilot-instructions.md`](.github/copilot-instructions.md).

## Install (releases)

Prebuilt installers for **Windows**, **macOS** (Apple Silicon + Intel), and **Linux** are attached to [GitHub Releases](https://github.com/Linkek/AgentInspect/releases).

| Platform | Typical artifact |
|----------|------------------|
| Windows | `.msi` / `.exe` (NSIS) |
| macOS | `.dmg` (per architecture) |
| Linux | `.deb`, AppImage, etc. |

Download the latest **v** release, run the installer, and open **AgentInspect** — no Node/Rust required for end users.

**Code signing (Windows):** Windows installers from this page are signed via the **[SignPath Foundation](https://signpath.org/)** free open-source program using certificates issued to SignPath Foundation, built in public CI ([signing policy](docs/CODE_SIGNING.md)). macOS and Linux packages are unsigned by SignPath.

## Releases & versioning

- [CHANGELOG.md](CHANGELOG.md) — user-facing changes.
- [**Changesets**](https://github.com/changesets/changesets): add `.changeset/*.md` on PRs; merging bumps version via CI.
- Pushing a `v*` tag (or the Changesets publish flow) runs [`.github/workflows/release.yml`](.github/workflows/release.yml) to build all platforms.

From source:

```bash
pnpm install
pnpm tauri build
# artifacts under src-tauri/target/release/bundle/
```

## What gets scanned

| Area | Typical paths |
|------|----------------|
| Cursor | `.cursor/rules/**`, `.cursor/skills/**/SKILL.md`, `.cursor/mcp.json` |
| GitHub Copilot | `.github/copilot-instructions.md`, `.github/instructions/**` |
| Claude Code | `.claude/agents/**`, `.claude/skills/**`, `CLAUDE.md` |
| Codex | `.codex/**` |
| RoleSync | `.agents/**` (`catalog.json`, `rolesync.json`, roles/skills) |
| MCP | root `.mcp.json`, `.vscode/mcp.json`, `.github/mcp.json` |
| Other | `AGENTS.md`, Windsurf, Continue, OpenSpec, Amazon Q |

`node_modules`, `target`, `dist`, and git-ignored trees are skipped via the `ignore` crate.

## RoleSync

[RoleSync](https://pypi.org/project/rolesync/) keeps canonical roles/skills under `.agents/` and generates native Claude/Codex files. AgentInspect surfaces whether that layout is present and basic counts; use `rolesync doctor` in the repo for validation.

## License

MIT — see [LICENSE](LICENSE).