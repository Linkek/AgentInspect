# SignPath application (copy-paste)

Use [https://signpath.org/apply.html](https://signpath.org/apply.html) (accept cookies so the HubSpot form loads). Fields vary; use this text where asked.

**Repository URL:**  
`https://github.com/Linkek/AgentInspect`

**License:**  
MIT (see `LICENSE` in repository root)

**Download / release URL:**  
`https://github.com/Linkek/AgentInspect/releases`

**Code signing policy (on project site):**  
`https://github.com/Linkek/AgentInspect/blob/main/docs/CODE_SIGNING.md`

**Project description (English):**

```
AgentInspect is a cross-platform desktop app (Tauri 2 + Rust + React) that scans a
repository for AI agent configuration (Cursor, Copilot, AGENTS.md, MCP, etc.),
estimates token footprint, and flags duplicate or bloated instruction files.

We distribute Windows installers (NSIS .exe and MSI), macOS .dmg, and Linux packages
via GitHub Releases. Windows builds are produced on GitHub-hosted runners by
.github/workflows/release.yml when a v* tag is pushed. We request SignPath signing
for Windows installers only.

The project is MIT-licensed, actively maintained, and has no paid tier or dual licensing.
```

**Contact email:** use the address you want SignPath to email (your personal or GitHub noreply).

After approval: follow [signpath-setup.md](signpath-setup.md) and set `SIGNPATH_SIGNING_ENABLED=true` on the repo.