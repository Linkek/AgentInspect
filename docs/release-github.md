# GitHub Releases

## Install

Download assets from [GitHub Releases](https://github.com/Linkek/AgentInspect/releases) for **Windows**, **macOS**, and **Linux**.

**Windows SmartScreen:** see [windows-code-signing.md](windows-code-signing.md) — for solo OSS use **SignPath Foundation** (free): [signpath-setup.md](signpath-setup.md). Until SignPath credentials are on the repo, Windows assets on Releases are unsigned.

## CI requirements

1. **Repository → Settings → Actions → General → Workflow permissions** must be **Read and write** (not read-only), so `GITHUB_TOKEN` can create releases and upload installers.
2. Pushing a `v*` tag runs [`.github/workflows/release.yml`](../.github/workflows/release.yml): one job creates the release, four matrix jobs attach platform bundles via `tauri-apps/tauri-action`.

## Versioning

- [Changesets](https://github.com/changesets/changesets): add `.changeset/*.md`, merge to `main`; `version-packages.yml` opens a version PR or tags on publish.
- `pnpm version-packages` runs `changeset version` then `scripts/sync-versions.mjs` (syncs `package.json`, `tauri.conf.json`, `Cargo.toml`).

## Manual release

```bash
git tag v1.0.0
git push origin v1.0.0
```

Or **Actions → Release → Run workflow** after a tag exists.