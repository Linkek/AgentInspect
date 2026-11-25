import type { InstructionFile, PlatformScanBundle, RoleSyncInfo, ScanReport } from "../types/scan";

const CANONICAL_PATH_ORDER = [
  ".agents/rolesync.json",
  ".agents/loom.json",
  ".agents/catalog.json",
  ".agents/AGENTS.md",
] as const;

export function roleSyncReport(bundle: PlatformScanBundle | null): ScanReport | null {
  if (!bundle) return null;
  return bundle.reportsByPlatform.rolesync ?? null;
}

export function roleSyncDetected(bundle: PlatformScanBundle | null): boolean {
  return roleSyncReport(bundle)?.rolesync.detected ?? false;
}

function absToRelative(absPath: string, repoPath: string): string | null {
  const abs = absPath.replace(/\\/g, "/");
  const root = repoPath.replace(/\\/g, "/").replace(/\/$/, "");
  if (abs === root) return null;
  if (abs.startsWith(`${root}/`)) return abs.slice(root.length + 1);
  return null;
}

function pathIndex(paths: string[], relativePath: string): number {
  const i = paths.indexOf(relativePath);
  return i >= 0 ? i : paths.length + 1;
}

export function sortCanonicalFiles(files: InstructionFile[]): InstructionFile[] {
  return [...files].sort((a, b) => {
    const ao = pathIndex([...CANONICAL_PATH_ORDER], a.relativePath);
    const bo = pathIndex([...CANONICAL_PATH_ORDER], b.relativePath);
    if (ao !== bo) return ao - bo;
    if (a.kind === "role" && b.kind !== "role") return -1;
    if (b.kind === "role" && a.kind !== "role") return 1;
    if (a.alwaysOn && !b.alwaysOn) return -1;
    if (b.alwaysOn && !a.alwaysOn) return 1;
    return b.estimatedTokens - a.estimatedTokens;
  });
}

export function pickDefaultRoleSyncPath(
  files: InstructionFile[],
  info: RoleSyncInfo,
  repoPath: string,
): string | null {
  if (!files.length) return null;

  const relSet = new Set(files.map((f) => f.relativePath));

  for (const abs of [info.configPath, info.catalogPath]) {
    if (!abs) continue;
    const rel = absToRelative(abs, repoPath);
    if (rel && relSet.has(rel)) return rel;
  }

  for (const preferred of CANONICAL_PATH_ORDER) {
    if (relSet.has(preferred)) return preferred;
  }

  const role = files.find((f) => f.kind === "role" && f.relativePath.startsWith(".agents/roles/"));
  if (role) return role.relativePath;

  const alwaysOn = files.find((f) => f.alwaysOn && f.relativePath.startsWith(".agents/"));
  if (alwaysOn) return alwaysOn.relativePath;

  return sortCanonicalFiles(files)[0]?.relativePath ?? files[0].relativePath;
}

export function sortAgentFiles(
  list: InstructionFile[],
  flaggedPaths: Set<string>,
): InstructionFile[] {
  return [...list].sort((a, b) => {
    const af = flaggedPaths.has(a.relativePath) ? 1 : 0;
    const bf = flaggedPaths.has(b.relativePath) ? 1 : 0;
    if (af !== bf) return bf - af;
    return b.estimatedTokens - a.estimatedTokens;
  });
}