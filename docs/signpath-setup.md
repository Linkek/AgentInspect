# SignPath setup checklist (AgentInspect)

One-time setup so **GitHub Release** Windows installers are signed and SmartScreen shows **SignPath Foundation** as publisher instead of “Unknown publisher”.

## 1. Apply for OSS signing

- Go to [https://signpath.org/open-source](https://signpath.org/open-source).
- Submit **Linkek/AgentInspect** (public repository, clear OSS license).
- Wait for approval email (usually a few days).

## 2. SignPath project

In [SignPath](https://signpath.io/):

1. Create organization / use assigned org.
2. New **project** linked to **GitHub** repository `Linkek/AgentInspect`.
3. Trusted build: **GitHub.com**, workflow on **tag** push (`.github/workflows/release.yml`).
4. Install **SignPath GitHub App** when prompted.
5. Create **API token** with permission to submit to `release-signing` (and `test-signing` for dry runs).
6. Copy **Organization ID** and **project slug** from project settings.

## 3. GitHub repository settings

Repository → **Settings** → **Secrets and variables** → **Actions**:

| Type | Name | Value |
|------|------|--------|
| Secret | `SIGNPATH_API_TOKEN` | SignPath submitter token |
| Variable | `SIGNPATH_SIGNING_ENABLED` | `true` |
| Variable | `SIGNPATH_ORGANIZATION_ID` | UUID from SignPath |
| Variable | `SIGNPATH_PROJECT_SLUG` | e.g. `AgentInspect` (exact slug) |
| Variable | `SIGNPATH_SIGNING_POLICY_SLUG` | `release-signing` |

## 4. Verify

1. Tag a release: `git tag v1.0.2 && git push origin v1.0.2` (after bumping version on `main`).
2. Open **Actions → Release** → Windows job should run **Sign with SignPath Foundation**.
3. Download the `.exe` from **Releases** on a Windows machine — Properties → **Digital Signatures** should list SignPath.

Until step 1–3 are done, releases stay **unsigned** (same SmartScreen as today).