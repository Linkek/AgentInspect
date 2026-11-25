import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AgentCodeViewer } from "./AgentCodeViewer";
import { APP_SCROLL_CLASS } from "../themeScrollbars";
import { copy } from "../content/uiCopy";
import type {
  AgentChatTurn,
  AiSettings,
  FileView,
  ImprovementSuggestion,
  PlatformScanBundle,
  ProfileRef,
  ScanReport,
} from "../types/scan";
import { AgentFileList, type AgentFileSection } from "./AgentFileList";
import {
  pickDefaultRoleSyncPath,
  roleSyncDetected,
  roleSyncReport,
  sortAgentFiles,
  sortCanonicalFiles,
} from "../utils/rolesyncAgent";
import { AgentDocumentToolbar, type PreviewTab } from "./AgentDocumentToolbar";
import { ApplyChangesDialog } from "./ApplyChangesDialog";
import { ChangeReviewPanel, useChangeStats } from "./ChangeReviewPanel";
import {
  DocumentZoomControls,
  VIEWER_FONT_DEFAULT,
  clampViewerFont,
} from "./DocumentZoomControls";
import { FloatingAgentComposer } from "./FloatingAgentComposer";
import type { NavPage } from "../layout/AppSidebar";

const VIEWER_FONT_KEY = "agentinspect.viewerFontPx";

const COMPOSER_RESERVE = 132;

export function AgentWorkspace({
  bundle,
  report,
  platform,
  profile,
  initialPath,
  onInitialConsumed,
  onOpenSettings,
}: {
  bundle: PlatformScanBundle | null;
  report: ScanReport;
  platform: string;
  profile: ProfileRef;
  initialPath: string | null;
  onInitialConsumed: () => void;
  onOpenSettings: (page: NavPage) => void;
}) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [fileView, setFileView] = useState<FileView | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("original");

  const [baseline, setBaseline] = useState("");
  const [draft, setDraft] = useState("");
  const [meta, setMeta] = useState<ImprovementSuggestion | null>(null);
  const [chatTurns, setChatTurns] = useState<AgentChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [refineLoading, setRefineLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedBackup, setSavedBackup] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [viewerFontPx, setViewerFontPx] = useState(() => {
    try {
      const raw = localStorage.getItem(VIEWER_FONT_KEY);
      if (raw) return clampViewerFont(Number(raw));
    } catch {
      /* ignore */
    }
    return VIEWER_FONT_DEFAULT;
  });

  const changeStats = useChangeStats(baseline, draft);

  const setViewerFont = useCallback((px: number) => {
    const next = clampViewerFont(px);
    setViewerFontPx(next);
    try {
      localStorage.setItem(VIEWER_FONT_KEY, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void invoke<AiSettings>("get_ai_settings").then(setAiSettings);
  }, []);

  const rsReport = useMemo(() => roleSyncReport(bundle), [bundle]);
  const rsActive = useMemo(() => roleSyncDetected(bundle), [bundle]);
  const canonicalPaths = useMemo(() => new Set(rsReport?.files.map((f) => f.relativePath) ?? []), [rsReport]);

  const flaggedPaths = useMemo(() => {
    const set = new Set<string>();
    for (const src of [report, rsReport]) {
      if (!src) continue;
      for (const i of src.issues) {
        if (i.relativePath) set.add(i.relativePath);
      }
    }
    return set;
  }, [report, rsReport]);

  const primaryRoleSyncPath = useMemo(() => {
    if (!rsActive || !rsReport) return null;
    return pickDefaultRoleSyncPath(rsReport.files, rsReport.rolesync, report.repoPath);
  }, [rsActive, rsReport, report.repoPath]);

  const fileSections = useMemo((): AgentFileSection[] => {
    const q = filter.trim().toLowerCase();
    const match = (f: { relativePath: string }) =>
      !q || f.relativePath.toLowerCase().includes(q);

    const sections: AgentFileSection[] = [];

    if (rsActive && rsReport) {
      let canonical = sortCanonicalFiles(rsReport.files.filter(match));
      if (primaryRoleSyncPath && match({ relativePath: primaryRoleSyncPath })) {
        canonical = [
          ...canonical.filter((f) => f.relativePath === primaryRoleSyncPath),
          ...canonical.filter((f) => f.relativePath !== primaryRoleSyncPath),
        ];
      }
      sections.push({
        id: "rolesync",
        label: copy.ai.page.roleSyncSection,
        files: canonical,
        primaryPath: primaryRoleSyncPath,
      });
    }

    const toolchain = sortAgentFiles(
      report.files.filter((f) => {
        if (!match(f)) return false;
        if (rsActive && canonicalPaths.has(f.relativePath)) return false;
        if (rsActive && f.loadScope === "generated") return false;
        return true;
      }),
      flaggedPaths,
    );

    if (toolchain.length > 0) {
      sections.push({
        id: "toolchain",
        label: rsActive ? copy.ai.page.toolchainSection : "",
        files: toolchain,
      });
    }

    return sections;
  }, [filter, flaggedPaths, report.files, rsActive, rsReport, canonicalPaths, primaryRoleSyncPath]);

  const allAgentFiles = useMemo(
    () => fileSections.flatMap((s) => s.files),
    [fileSections],
  );

  const selectedMeta = useMemo(
    () => allAgentFiles.find((f) => f.relativePath === selected),
    [allAgentFiles, selected],
  );

  const issueNotes = useMemo(() => {
    if (!selected) return [];
    const issues = [...report.issues, ...(rsReport?.issues ?? [])];
    return issues
      .filter((i) => i.relativePath === selected)
      .map((i) => `${i.title}: ${i.detail}`);
  }, [report.issues, rsReport?.issues, selected]);

  const resetSession = useCallback((content: string, path: string) => {
    setBaseline(content);
    setDraft("");
    setMeta(null);
    setChatTurns([]);
    setInput("");
    setSavedBackup(null);
    setError(null);
    setPreviewTab("original");
    setSelected(path);
  }, []);

  const loadFile = useCallback(
    async (relativePath: string) => {
      setFileLoading(true);
      setError(null);
      try {
        const data = await invoke<FileView>("read_instruction_file", {
          repoPath: report.repoPath,
          relativePath,
          profile,
        });
        setFileView(data);
        resetSession(data.content, relativePath);
      } catch (e) {
        setError(String(e));
      } finally {
        setFileLoading(false);
      }
    },
    [profile, report.repoPath, resetSession],
  );

  useEffect(() => {
    if (initialPath) {
      void loadFile(initialPath);
      onInitialConsumed();
      return;
    }
    if (selected || fileLoading) return;
    if (rsActive && primaryRoleSyncPath) {
      void loadFile(primaryRoleSyncPath);
    }
  }, [
    initialPath,
    loadFile,
    onInitialConsumed,
    rsActive,
    primaryRoleSyncPath,
    selected,
    fileLoading,
  ]);

  const priorFeedback = useMemo(
    () => chatTurns.filter((t) => t.role === "user").map((t) => t.text),
    [chatTurns],
  );

  const hasDraft = !!meta && draft.length > 0;
  const aiReady = aiSettings?.enabled ?? false;

  const runFirstDraft = async () => {
    if (!selected || !selectedMeta || !fileView) return;
    setDraftLoading(true);
    setError(null);
    setChatTurns([]);
    setSavedBackup(null);
    try {
      const result = await invoke<ImprovementSuggestion>("suggest_instruction_improvement", {
        repoPath: report.repoPath,
        relativePath: selected,
        platform: selectedMeta.platform || platform,
        loadScope: selectedMeta.loadScope,
        fileKind: selectedMeta.kind,
        issueNotes,
      });
      setBaseline(result.original);
      setDraft(result.suggested);
      setMeta(result);
      setPreviewTab("diff");
    } catch (e) {
      setError(String(e));
    } finally {
      setDraftLoading(false);
    }
  };

  const sendFeedback = async () => {
    if (!meta || !input.trim() || !hasDraft) return;
    const userText = input.trim();
    setInput("");
    setChatTurns((prev) => [...prev, { role: "user", text: userText }]);
    setRefineLoading(true);
    setError(null);
    try {
      const result = await invoke<ImprovementSuggestion>("refine_instruction_improvement", {
        platform: meta.platform,
        relativePath: meta.relativePath,
        baselineOriginal: baseline,
        currentDraft: draft,
        userMessage: userText,
        priorFeedback,
      });
      setDraft(result.suggested);
      setMeta(result);
      setChatTurns((prev) => [...prev, { role: "assistant", text: result.rationale }]);
      setPreviewTab("diff");
    } catch (e) {
      setError(String(e));
    } finally {
      setRefineLoading(false);
    }
  };

  const handleSave = () => {
    if (!meta || !draft || draft === baseline) return;
    setConfirmOpen(true);
  };

  const confirmApply = async () => {
    if (!meta || !draft) return;
    setSaving(true);
    setError(null);
    try {
      const backup = await invoke<string>("apply_instruction_file", {
        repoPath: report.repoPath,
        relativePath: meta.relativePath,
        content: draft,
      });
      setSavedBackup(backup);
      setBaseline(draft);
      if (fileView) setFileView({ ...fileView, content: draft });
      setConfirmOpen(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const previewContent =
    previewTab === "draft" && hasDraft ? draft : previewTab === "original" ? baseline || fileView?.content : "";

  const showComposer = fileView && !fileLoading;

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        flexDirection: { xs: "column", md: "row" },
        gap: 1.5,
        alignItems: "stretch",
        height: "100%",
      }}
    >
      {/* Narrow file rail */}
      <Paper
        sx={{
          width: { xs: "100%", md: 176 },
          flexShrink: 0,
          py: 0.75,
          px: 0.5,
          maxHeight: { xs: 200, md: "none" },
          height: { md: "100%" },
          alignSelf: { md: "stretch" },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ px: 0.75, pb: 0.5, fontWeight: 600 }}>
          {copy.ai.page.pickFile}
        </Typography>
        {rsActive && (
          <Tooltip title={copy.ai.page.roleSyncHint} placement="right">
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                px: 0.75,
                pb: 0.5,
                lineHeight: 1.35,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {copy.ai.page.roleSyncHint}
            </Typography>
          </Tooltip>
        )}
        <TextField
          size="small"
          fullWidth
          placeholder={copy.ai.page.filterPlaceholder}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ mb: 0.75, "& .MuiInputBase-input": { py: 0.75, fontSize: 12 } }}
        />
        <Box className={APP_SCROLL_CLASS} sx={{ overflow: "auto", flex: 1, minHeight: 0 }}>
          <AgentFileList
            sections={fileSections}
            flaggedPaths={flaggedPaths}
            selected={selected}
            onSelect={(p) => void loadFile(p)}
          />
        </Box>
      </Paper>

      {/* Document + floating composer */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!aiReady && (
          <Alert
            severity="info"
            sx={{ mb: 1, py: 0, flexShrink: 0 }}
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<SettingsOutlinedIcon />}
                onClick={() => onOpenSettings("settings")}
              >
                {copy.ai.page.openSettings}
              </Button>
            }
          >
            {copy.ai.page.disabledHint}
          </Alert>
        )}

        {!fileView && !fileLoading && (
          <Paper sx={{ p: 4, textAlign: "center", flex: 1 }}>
            <Typography color="text.secondary">{copy.ai.page.selectPrompt}</Typography>
          </Paper>
        )}

        {fileLoading && (
          <Stack sx={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
            <CircularProgress />
          </Stack>
        )}

        {fileView && !fileLoading && (
          <Paper
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              height: "100%",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <AgentDocumentToolbar
              relativePath={fileView.relativePath}
              estimatedTokens={selectedMeta?.estimatedTokens}
              hasDraft={hasDraft}
              tokenDelta={changeStats.tokenDelta}
              previewTab={previewTab}
              onPreviewTab={setPreviewTab}
              aiReady={aiReady}
              draftLoading={draftLoading}
              refineLoading={refineLoading}
              saving={saving}
              draftDirty={hasDraft && draft !== baseline}
              onGenerate={() => void runFirstDraft()}
              onRevert={() => setDraft(baseline)}
              onSave={handleSave}
              savedBackup={savedBackup}
              error={error}
            />

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <DocumentZoomControls fontSize={viewerFontPx} onChange={setViewerFont} />
              <Box
                className={APP_SCROLL_CLASS}
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflow: "auto",
                  px: previewTab === "diff" ? 1.25 : 0,
                  py: previewTab === "diff" ? 1 : 0,
                  pb: `${COMPOSER_RESERVE}px`,
                  pr: previewTab === "diff" ? 1.25 : 4,
                }}
              >
                {previewTab === "diff" && hasDraft ? (
                  <ChangeReviewPanel
                    before={baseline}
                    after={draft}
                    codeFontSize={viewerFontPx}
                  />
                ) : previewTab !== "diff" ? (
                  <AgentCodeViewer
                    language={fileView.language}
                    content={previewContent || fileView.content}
                    fontSize={viewerFontPx}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    {copy.ai.page.noDraftYet}
                  </Typography>
                )}
              </Box>
            </Box>

            {showComposer && (
              <FloatingAgentComposer
                relativePath={fileView.relativePath}
                modelLabel={aiSettings?.model}
                hasDraft={hasDraft}
                aiReady={aiReady}
                chatTurns={chatTurns}
                input={input}
                loading={refineLoading}
                disabledSave={!!savedBackup}
                onInput={setInput}
                onSend={() => void sendFeedback()}
                onGenerateDraft={() => void runFirstDraft()}
                draftLoading={draftLoading}
              />
            )}
          </Paper>
        )}
      </Box>

      {meta && selectedMeta && (
        <ApplyChangesDialog
          open={confirmOpen}
          relativePath={meta.relativePath}
          loadScope={selectedMeta.loadScope}
          alwaysOn={selectedMeta.alwaysOn}
          stats={changeStats}
          saving={saving}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => void confirmApply()}
        />
      )}
    </Box>
  );
}