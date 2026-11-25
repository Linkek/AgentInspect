# Windows code signing (SmartScreen)

## Why SmartScreen appears

Unsigned installers show **Unknown publisher**. Windows will not fully trust your `.exe` until it is **Authenticode-signed** with a certificate users recognize (public CA or [SignPath Foundation](https://signpath.org/) for OSS).

## Solo open source (recommended): SignPath Foundation — free

1. **Apply** at [signpath.org/open-source](https://signpath.org/open-source) with repo **Linkek/AgentInspect** (public, OSS license).
2. After approval, in the **SignPath** console:
   - Create project (note **project slug**).
   - Connect **GitHub** trusted build + install the SignPath GitHub App on this repo.
   - Use signing policy **`release-signing`** for tagged releases (or `test-signing` while testing).
3. On GitHub **Linkek/AgentInspect** → Settings:
   - **Secret:** `SIGNPATH_API_TOKEN` (submitter token from SignPath).
   - **Variables:**  
     `SIGNPATH_SIGNING_ENABLED` = `true`  
     `SIGNPATH_ORGANIZATION_ID` = (from SignPath)  
     `SIGNPATH_PROJECT_SLUG` = your project slug  
     `SIGNPATH_SIGNING_POLICY_SLUG` = `release-signing` (or `test-signing`)
4. Push a **new tag** (`v1.0.2`, …). The [Release workflow](../.github/workflows/release.yml) builds on `windows-latest`, uploads the unsigned installer, SignPath signs it, then attaches the **signed** setup to the GitHub Release.

No personal EV/OV certificate purchase required.

## Alternative: your own certificate

If you buy an OV code signing cert (personal or company), export **`.pfx`** and set:

- `WINDOWS_CERTIFICATE` (base64 PFX)
- `WINDOWS_CERTIFICATE_PASSWORD`

Leave `SIGNPATH_SIGNING_ENABLED` unset/false. The workflow runs [prepare-windows-signing.ps1](../.github/scripts/prepare-windows-signing.ps1) and Tauri signs during `pnpm tauri build`.

## Local development

Use **`pnpm tauri:dev`** — no installer, no SmartScreen.

## Unsigned one-off

**More info** → **Run only** on the SmartScreen dialog (only for builds you trust).

## References

- [Tauri — Windows signing](https://v2.tauri.app/distribute/sign/windows/)
- [SignPath — GitHub](https://docs.signpath.io/trusted-build-systems/github)