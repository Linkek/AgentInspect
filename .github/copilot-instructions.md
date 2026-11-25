# Copilot instructions — AgentInspect

Use **pnpm** only (`pnpm install`, `pnpm tauri dev`, `pnpm build`). Never `npm install` in this repo.

Scanner logic lives in `src-tauri/src/scanner.rs`; React UI in `src/`. Types in `src/types/scan.ts` must stay aligned with Rust serde (`camelCase` JSON).

Full guide: [AGENTS.md](../AGENTS.md).