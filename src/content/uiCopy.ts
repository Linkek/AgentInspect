/** User-facing strings — keep tone direct and scannable. */
export const copy = {
  app: {
    tagline: "AI instruction health",
  },
  scan: {
    primaryAction: "Select folder",
    scanning: "Scanning…",
    screenTitle: "Scan a repository",
    headline: "Find out how much AI context your repo carries",
    body: "We read rules, skills, MCP configs, and agent instructions on disk — then estimate token cost, duplicates, and what loads on every chat.",
    pillars: ["Find files", "Measure cost", "Spot bloat"],
    privacy: "Runs locally. Nothing is uploaded.",
    previousScan: "Last scan",
    viewResults: "Open last results",
    pickFromSidebar: "Choose a folder with Select folder in the sidebar.",
    noResultsYet: "No scan yet. Select a folder to analyze a repository.",
    navHome: "Scan",
    navHomeHint: "Start here",
    navHomeHintRescan: "Scan again",
  },
  sidebar: {
    resultsSection: "Report",
    settings: "Model & budgets",
    scoreSuffix: "Score",
    disabledNeedScan: "Complete a scan to open this view",
  },
  score: {
    healthTitle: "Health score",
    healthHint: "100 = lean setup. Lower = more tokens or risk for this toolchain.",
    dimensions: "What affects the score",
    strengths: "Already in good shape",
    comparedTo: "Compared to",
  },
  settings: {
    title: "Model & budgets",
    intro:
      "Scores compare your repo to token budgets for a provider and model. Edit config/scoring-limits.json to add models; your choice is saved on this device.",
    budgetLine: (instruction: string, alwaysOn: string, perFile: string) =>
      `Instruction budget ~${instruction} tokens · always-on ~${alwaysOn} · single file max ${perFile}`,
  },
  analytics: {
    contextTaxTitle: "What loads every chat",
    contextTaxBody:
      "Always-on text is the per-request cost. Skills, path rules, and MCP often load only when needed — still worth trimming, but less urgent.",
    alwaysOn: "Always-on (every chat)",
    onDemandGroup: "Path rules & on-demand",
    latent: "Not always-on",
    budgetCompare: (budget: string) => `Always-on vs profile budget (~${budget} tokens)`,
    budgetFraction: (used: string, cap: string) => `${used} / ${cap} est. tokens`,
    byScope: "Tokens by load type",
    offenders: "Largest always-on files",
    mcp: "MCP / tool configs",
    mcpHint: "Counted when MCP servers are enabled",
    generated: "Generated copies",
    generatedHint: "RoleSync mirrors — edit .agents/, not .claude/.codex",
    estSuffix: "est. tokens",
  },
  progress: {
    walking: "Walking the repository",
    reading: "Reading instruction files",
    analyzing: "Analyzing",
  },
  issues: {
    empty: "No issues for this toolchain and model budget.",
    impact: "Impact",
    openInAgent: "open in AI improve",
  },
  platform: {
    scopeTitle: "Agent platform",
    scopeHint:
      "Pick one toolchain at a time. Cursor, Copilot, and Claude are scored separately.",
  },
  explorer: {
    notesTitle: "Scanner hints for this file",
    notesIntro:
      "These are read-only tips from your scan — not errors. They show where the file is big or hard to skim. Highlights in the editor mark long lines.",
    chipHeavyFile: "Large file",
    chipLongLines: (n: number) => `${n} long line${n === 1 ? "" : "s"}`,
    longLinesSummary: (n: number) => `Show which lines (${n})`,
    longLinesHint: "Long lines often come from wrapped paragraphs or pasted URLs. Splitting them can help humans and some editors.",
    jumpToLine: (n: number) => `Line ${n}`,
  },
  report: {
    warningsTitle: "Scanner notes",
    viewingLabel: "Toolchain",
    scopeNote: (name: string) => `Everything below is only for ${name} — not mixed with other tools.`,
    hints: {
      overview: "Start here: score, then fix issues or open files.",
      issues: "Highest impact first. Click a row to open that file.",
      analytics: "See what costs tokens and where duplicates live.",
      explorer: "Read-only file browser with line warnings.",
      agent: "Draft, diff, and direct the local model before saving.",
    },
    nextStepsTitle: "What to do next",
    nextIssues: (n: number) => `Review ${n} issue${n === 1 ? "" : "s"}`,
    nextAnalytics: "Token breakdown",
    nextExplorer: "Open files",
    nextAgent: "Improve with AI",
    stats: {
      files: (n: number) => `${n} file${n === 1 ? "" : "s"}`,
      tokens: (t: string) => `~${t} tokens total`,
      alwaysOn: (t: string) => `~${t} every-chat`,
      issues: (n: number) => `${n} issue${n === 1 ? "" : "s"}`,
      noIssues: "No issues",
      budget: (model: string) => `vs ${model}`,
    },
    dimensionLabels: {
      footprint: "Total size",
      alwaysOn: "Every-chat rules",
      oversized: "Huge files",
      duplicates: "Repeated text",
      sprawl: "This toolchain only",
      mcp: "MCP configs",
    } as Record<string, string>,
    issuesSummary: (n: number) =>
      n === 0 ? "Nothing flagged for this toolchain." : `${n} problem${n === 1 ? "" : "s"} to review`,
    impactHigh: "High",
    impactMed: "Medium",
    impactLow: "Low",
    analyticsTabs: {
      glance: "Summary",
      detail: "Charts & duplicates",
      files: "File list",
    },
  },
  ai: {
    sectionTitle: "Local AI assistant",
    sectionIntro:
      "Connect Ollama or LM Studio on this machine. Suggestions stay local; you review a diff before anything is written to disk.",
    endpoint: "API base URL",
    model: "Model name",
    apiOllama: "Ollama",
    apiOpenAi: "OpenAI-compatible (LM Studio)",
    test: "Test connection",
    enabled: "Enable suggestions",
    reviewTitle: "Review suggested changes",
    agentTitle: "Improve with local agent",
    agentIntro:
      "Review the diff, then tell the agent what to keep, remove, or shorten. Press Ctrl+Enter to send.",
    generating: "Local model is drafting a revision…",
    apply: "Review & save…",
    saving: "Saving…",
    cancel: "Cancel",
    done: "Close",
    savedBackup: (path: string) => `Saved. Backup: ${path}`,
    suggest: "Improve with agent",
    suggestHint: "Opens a chat with your local model. You approve before anything is written.",
    configureFirst: "Configure Local AI in Settings",
    refreshModels: "Load Ollama models",
    loadingModels: "Loading models…",
    ollamaModelHint:
      "Ollama must show Ready in the tray — the API is http://127.0.0.1:11434. If connection fails, quit Ollama fully and reopen, or run ollama serve in a terminal.",
    connectionTroubleshoot:
      "Nothing on port 11434 usually means Ollama’s API server isn’t running (tray app alone isn’t enough). Timeouts often mean a stuck Ollama — restart from the tray or Task Manager.",
    modelManualHint: "Load models above, or type the exact name from ollama list (e.g. qwen3.5:9b).",
    settingsSaved: "Local AI settings saved.",
    modelsLoaded: (n: number) => `Found ${n} Ollama model(s).`,
    chatTitle: "Direct the agent",
    chatEmpty:
      "Example: “Keep the git safety section.” “Remove npm/yarn rules — we use pnpm only.” “Shorten the testing section but keep coverage requirements.”",
    chatYou: "You",
    chatAgent: "Agent",
    chatPlaceholder: "What should change in this draft?",
    chatSend: "Update draft",
    chatHint: "Ctrl+Enter to send. The diff above updates after each message.",
    revertDraft: "Reset draft to file on disk",
    page: {
      pickFile: "Files to improve",
      filterPlaceholder: "Filter paths…",
      flagged: "Flagged by scan",
      allFiles: "All files in this toolchain",
      selectPrompt: "Select a file on the left to view it and start improving.",
      disabledHint: "Turn on Local AI in Settings and pick an Ollama model.",
      openSettings: "Settings",
      startDraft: "Generate draft",
      regenerateDraft: "Regenerate draft",
      tabOriginal: "On disk",
      tabDiff: "What would change",
      tabDraft: "Draft",
      tabOriginalShort: "Disk",
      tabDiffShort: "Diff",
      tabDraftShort: "Draft",
      noDraftYet: "Generate a draft first, then use the chat to refine it.",
      openInAgent: "Improve in AI page",
      composerHint: "Ctrl+Enter to send · Shift+Enter for new line",
      composerNoDraft: "Generate a draft first, then direct changes here…",
      roleSyncSection: "RoleSync (canonical)",
      roleSyncHint:
        "Edit .agents/ here — RoleSync pushes instructions to Cursor, Claude, Codex, and other targets. Skip generated mirrors under .claude/ or .codex/.",
      roleSyncPrimary: "Start here",
      toolchainSection: "This toolchain",
    },
    diff: {
      legend:
        "Red strikethrough = text that would be removed. Green = text that would be added. Nothing is written until you confirm save.",
      onlyChanges: "Show only changed lines",
      noChanges: "Draft matches the file on disk — no line changes to show.",
      removed: (n: number) => `${n} line${n === 1 ? "" : "s"} removed`,
      added: (n: number) => `${n} line${n === 1 ? "" : "s"} added`,
      hunks: (n: number) => `${n} section${n === 1 ? "" : "s"}`,
      tokens: (before: number, after: number, delta: number) =>
        delta > 0
          ? `~${before.toLocaleString()} → ~${after.toLocaleString()} tokens (save ~${delta.toLocaleString()})`
          : `~${before.toLocaleString()} → ~${after.toLocaleString()} tokens`,
      willAdd: "New",
      willRemove: "Removed",
    },
    confirm: {
      title: "Save changes to this file?",
      body: (n: number, path: string) =>
        `You are about to apply ${n} line change${n === 1 ? "" : "s"} to ${path}. Review the diff first if anything looks wrong.`,
      linesRemoved: (n: number) => `${n} lines will be deleted`,
      linesRemovedHint: "Content that only exists in the current file",
      linesAdded: (n: number) => `${n} lines will be added`,
      linesAddedHint: "New or rewritten content from the draft",
      hunks: (n: number) => `${n} edited region${n === 1 ? "" : "s"}`,
      tokens: (before: number, after: number, delta: number) =>
        `Estimated tokens: ~${before.toLocaleString()} → ~${after.toLocaleString()}` +
        (delta > 0 ? ` (about ${delta.toLocaleString()} fewer)` : delta < 0 ? ` (about ${Math.abs(delta).toLocaleString()} more)` : ""),
      savingsEveryChat: (delta: number) =>
        `If this file is always-on, you may save about ${delta.toLocaleString()} tokens on each chat that loads it.`,
      savingsWhenLoaded: (delta: number) =>
        `When this file is loaded, context may be about ${delta.toLocaleString()} tokens lighter.`,
      backupNote: "A backup of the current file is saved under .agentinspect/backups/ before overwrite.",
      confirm: (n: number) => `Yes, apply ${n} change${n === 1 ? "" : "s"}`,
    },
  },
  pages: {
    overview: {
      title: "Overview",
      subtitle: "Health score for the toolchain you selected above.",
    },
    issues: {
      title: "Issues",
      subtitle: "Fix these first — they hurt score the most.",
    },
    analytics: {
      title: "Analytics",
      subtitle: "Where tokens go and which files repeat.",
    },
    explorer: {
      title: "Explorer",
      subtitle: "Read files with syntax highlighting.",
    },
    agent: {
      title: "AI improve",
      subtitle: "Pick a file, generate a leaner draft, chat with your local model, then save.",
    },
    settings: {
      title: "Model & budgets",
      subtitle: "Provider and model used for scoring and budget lines.",
    },
    scan: {
      title: "Scan",
      subtitle: "Choose a repository folder to analyze.",
    },
  },
} as const;