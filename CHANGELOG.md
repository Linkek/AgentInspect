# AgentInspect Changelog

## 1.0.1

### Patch Changes

- Windows release pipeline split for optional **SignPath Foundation** (free OSS) Authenticode signing; docs for solo maintainers.
- PFX-based signing still supported via `WINDOWS_CERTIFICATE` secrets.

## 1.0.0

### Major Changes

- Initial public release: desktop app (Tauri 2 + React) to scan repositories for AI agent instructions, token cost, duplicates, and per-platform health scores.
- Local AI improve workflow (Ollama / OpenAI-compatible) with constraint-preserving prompts, diff review, and safe apply with backups.
- RoleSync-aware canonical editing, compact AI page UI, and cross-platform installers via GitHub Releases.