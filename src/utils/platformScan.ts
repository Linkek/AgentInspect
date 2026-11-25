import type { PlatformScanBundle, ScanReport } from "../types/scan";

const PREFERRED_ORDER = [
  "cursor",
  "github-copilot",
  "claude-code",
  "codex",
  "rolesync",
  "windsurf",
  "continue",
  "mcp",
] as const;

export function pickDefaultPlatform(platforms: string[]): string {
  for (const id of PREFERRED_ORDER) {
    if (platforms.includes(id)) return id;
  }
  return platforms[0] ?? "";
}

export function activeReport(
  bundle: PlatformScanBundle | null,
  platform: string,
): ScanReport | null {
  if (!bundle || !platform) return null;
  return bundle.reportsByPlatform[platform] ?? null;
}