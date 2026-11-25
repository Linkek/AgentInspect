import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FileViewNotes, fileHighlightLines } from "../components/FileViewNotes";
import { copy } from "../content/uiCopy";
import type { FileView, ProfileRef, ScanReport } from "../types/scan";
import { LOAD_SCOPE_LABELS } from "../types/scan";
import { severityColor } from "../types/scan";

export function BrowsePage({
  report,
  initialPath,
  profile,
  onInitialConsumed,
  onOpenInAgent,
}: {
  report: ScanReport;
  initialPath: string | null;
  profile: ProfileRef;
  onInitialConsumed: () => void;
  onOpenInAgent: (path: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<FileView | null>(null);
  const [loading, setLoading] = useState(false);

  const flaggedPaths = useMemo(() => {
    const set = new Set<string>();
    for (const i of report.issues) {
      if (i.relativePath) set.add(i.relativePath);
    }
    return set;
  }, [report.issues]);

  const files = useMemo(() => {
    const list = [...report.files].sort((a, b) => b.estimatedTokens - a.estimatedTokens);
    if (!filter) return list;
    const q = filter.toLowerCase();
    return list.filter((f) => f.relativePath.toLowerCase().includes(q));
  }, [report.files, filter]);

  const loadFile = useCallback(
    async (relativePath: string) => {
      setSelected(relativePath);
      setLoading(true);
      try {
        const data = await invoke<FileView>("read_instruction_file", {
          repoPath: report.repoPath,
          relativePath,
          profile,
        });
        setView(data);
      } finally {
        setLoading(false);
      }
    },
    [profile, report.repoPath],
  );

  useEffect(() => {
    if (initialPath) {
      void loadFile(initialPath);
      onInitialConsumed();
    }
  }, [initialPath, loadFile, onInitialConsumed]);

  const flagLines = useMemo(
    () => fileHighlightLines(view?.flags ?? []),
    [view?.flags],
  );

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ minHeight: 480 }}>
      <Paper sx={{ width: { md: 320 }, flexShrink: 0, p: 1 }}>
        <TextField
          size="medium"
          fullWidth
          placeholder="Filter paths…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ mb: 1, px: 1 }}
        />
        <List dense sx={{ maxHeight: 520, overflow: "auto" }}>
          {files.map((f) => (
            <ListItemButton
              key={f.path}
              selected={selected === f.relativePath}
              onClick={() => void loadFile(f.relativePath)}
            >
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: flaggedPaths.has(f.relativePath) ? severityColor(80) : "inherit",
                    }}
                  >
                    {f.relativePath}
                  </Typography>
                }
                secondary={`${LOAD_SCOPE_LABELS[f.loadScope] ?? f.loadScope} · ~${f.estimatedTokens.toLocaleString()} tok`}
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      <Paper sx={{ flex: 1, overflow: "auto", p: 0 }}>
        {!view && !loading && (
          <Typography sx={{ p: 2 }} color="text.secondary">
            Select a file to preview with VS Code–style highlighting.
          </Typography>
        )}
        {loading && (
          <Typography sx={{ p: 2 }} color="text.secondary">
            Loading…
          </Typography>
        )}
        {view && (
          <>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{
                p: 1.5,
                alignItems: { sm: "center" },
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontFamily: "monospace" }}>
                {view.relativePath}
              </Typography>
              <Button
                size="medium"
                variant="outlined"
                endIcon={<OpenInNewOutlinedIcon />}
                onClick={() => onOpenInAgent(view.relativePath)}
              >
                {copy.ai.page.openInAgent}
              </Button>
            </Stack>
            <Box sx={{ px: 1.5, pt: 1 }}>
              <FileViewNotes flags={view.flags} />
            </Box>
            <SyntaxHighlighter
              language={view.language}
              style={vscDarkPlus}
              showLineNumbers
              customStyle={{
                margin: 0,
                borderRadius: 0,
                fontSize: 13,
                minHeight: 400,
              }}
              lineProps={(lineNumber) => {
                const style: CSSProperties = flagLines.has(lineNumber)
                  ? {
                      backgroundColor: "rgba(248,113,113,0.15)",
                      display: "block",
                      width: "100%",
                    }
                  : { display: "block", width: "100%" };
                return { style };
              }}
            >
              {view.content}
            </SyntaxHighlighter>
          </>
        )}
      </Paper>
    </Stack>
  );
}