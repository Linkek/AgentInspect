export interface InstructionFile {
  path: string;
  relativePath: string;
  platform: string;
  kind: string;
  chars: number;
  lines: number;
  estimatedTokens: number;
  contentHash: string;
  normalizedHash: string;
  alwaysOn: boolean;
  loadScope: string;
}

export interface AlwaysOnEntry {
  relativePath: string;
  estimatedTokens: number;
}

export interface ContextTax {
  alwaysOnTokens: number;
  pathScopedTokens: number;
  onDemandTokens: number;
  toolConfigTokens: number;
  generatedTokens: number;
  referenceTokens: number;
  latentTokens: number;
  topAlwaysOn: AlwaysOnEntry[];
}

export interface DuplicateGroup {
  hash: string;
  normalized: boolean;
  paths: string[];
  chars: number;
  estimatedTokens: number;
}

export interface PlatformStats {
  files: number;
  chars: number;
  estimatedTokens: number;
}

export interface RoleSyncInfo {
  detected: boolean;
  configPath: string | null;
  catalogPath: string | null;
  manifestPath: string | null;
  roleCount: number;
  skillCount: number;
  platforms: string[];
}

export interface ScanSummary {
  repoPath: string;
  fileCount: number;
  totalChars: number;
  totalLines: number;
  estimatedTokens: number;
  byPlatform: Record<string, PlatformStats>;
  byKind: Record<string, number>;
  largestFiles: InstructionFile[];
  duplicateGroups: DuplicateGroup[];
  rolesync: RoleSyncInfo;
  warnings: string[];
  files: InstructionFile[];
  byLoadScope: Record<string, PlatformStats>;
  contextTax: ContextTax;
}

export interface ScanProgress {
  phase: string;
  current: number;
  total: number;
  message: string;
}

export interface ScoreDimension {
  id: string;
  label: string;
  score: number;
  penalty: number;
  detail: string;
}

export interface HealthHighlight {
  title: string;
  detail: string;
}

export interface HealthIssue {
  id: string;
  category: string;
  title: string;
  detail: string;
  severity: number;
  relativePath: string | null;
  estimatedTokens: number;
}

export interface HealthScore {
  overall: number;
  dimensions: ScoreDimension[];
  highlights: HealthHighlight[];
}

export interface ResolvedBudgets {
  providerId: string;
  providerLabel: string;
  modelId: string;
  modelLabel: string;
  effectiveContextTokens: number;
  alwaysOnBudgetTokens: number;
  totalInstructionsBudgetTokens: number;
  maxSingleFileTokens: number;
  maxAlwaysOnRuleLines: number;
  lineLengthWarnChars: number;
  maxDuplicateGroupsBeforeWarn: number;
}

export interface ScanReport extends ScanSummary {
  score: HealthScore;
  issues: HealthIssue[];
  budgets: ResolvedBudgets;
}

export interface PlatformScanBundle {
  repoPath: string;
  platforms: string[];
  reportsByPlatform: Record<string, ScanReport>;
}

export interface AiSettings {
  enabled: boolean;
  endpoint: string;
  model: string;
  apiStyle: "ollama" | "openai";
}

export interface ImprovementSuggestion {
  relativePath: string;
  platform: string;
  original: string;
  suggested: string;
  rationale: string;
  estimatedTokensBefore: number;
  estimatedTokensAfter: number;
}

export interface OllamaModel {
  name: string;
  sizeBytes?: number;
}

export interface AgentChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface ProfileRef {
  providerId: string;
  modelId: string;
}

export interface ModelLimits {
  label: string;
  contextWindowTokens: number;
  alwaysOnBudgetFraction: number;
  totalInstructionsBudgetFraction: number;
  maxSingleFileTokens: number;
  maxAlwaysOnRuleLines: number;
  lineLengthWarnChars: number;
  maxDuplicateGroupsBeforeWarn: number;
}

export interface ProviderEntry {
  label: string;
  models: Record<string, ModelLimits>;
}

export interface ScoringLimitsFile {
  version: number;
  contextWindowSafetyFactor: number;
  charsPerToken: number;
  defaultProfile: ProfileRef;
  providers: Record<string, ProviderEntry>;
  scoringWeights: Record<string, number>;
}

export interface ScoringLimitsResponse {
  limits: ScoringLimitsFile;
  activeProfile: ProfileRef;
  budgets: ResolvedBudgets;
}

export interface LineFlag {
  /** 0 = whole-file note, not a line in the editor */
  line: number;
  kind: "file" | "line" | string;
  reason: string;
  severity: number;
}

export interface FileView {
  relativePath: string;
  content: string;
  language: string;
  flags: LineFlag[];
}

export const LOAD_SCOPE_LABELS: Record<string, string> = {
  always_on: "Always-on",
  path_scoped: "Path-scoped",
  on_demand: "On-demand",
  tool_config: "Tool / MCP",
  generated: "Generated mirror",
  reference: "Reference / support",
};

export const LOAD_SCOPE_COLORS: Record<string, string> = {
  always_on: "#f87171",
  path_scoped: "#fbbf24",
  on_demand: "#5eead4",
  tool_config: "#60a5fa",
  generated: "#c4b5fd",
  reference: "#64748b",
};

export const PLATFORM_LABELS: Record<string, string> = {
  cursor: "Cursor",
  "github-copilot": "GitHub Copilot",
  "claude-code": "Claude Code",
  codex: "Codex",
  rolesync: "RoleSync",
  vscode: "VS Code",
  mcp: "MCP (root)",
  github: "GitHub",
  windsurf: "Windsurf",
  continue: "Continue",
  openspec: "OpenSpec",
  generic: "Generic",
  skill: "Skills",
  gemini: "Gemini",
  "amazon-q": "Amazon Q",
};

export function severityColor(severity: number): string {
  if (severity >= 75) return "#f87171";
  if (severity >= 50) return "#fb923c";
  if (severity >= 30) return "#fbbf24";
  return "#34d399";
}