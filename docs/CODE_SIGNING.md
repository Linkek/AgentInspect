# Code signing policy (AgentInspect)

AgentInspect Windows installers distributed from [GitHub Releases](https://github.com/Linkek/AgentInspect/releases) are built **only** by the public GitHub Actions workflow [`.github/workflows/release.yml`](../.github/workflows/release.yml) on `windows-latest`, triggered by **version tags** (`v*`).

## What we sign

- NSIS `*-setup.exe` and MSI bundles produced by `pnpm tauri build` in that workflow.
- Artifacts uploaded to the matching GitHub Release for the tag.

## What we do not sign

- Binaries built on a maintainer laptop unless explicitly marked as unofficial.
- Forks or third-party rebuilds (they must use their own certificate or SignPath project).

## Verification

1. Compare the release tag to the commit that ran the Release workflow.
2. Prefer downloads from `https://github.com/Linkek/AgentInspect/releases`.
3. After SignPath is enabled, verify **Properties → Digital Signatures** on the installer.

## Maintainer signing

- **Production:** [SignPath Foundation](https://signpath.org/apply.html) (free OSS) when approved, or optional `WINDOWS_CERTIFICATE` in GitHub Actions.
- **Development:** `pnpm tauri:dev` — no installer.

Report signing issues: open a GitHub issue on this repository.