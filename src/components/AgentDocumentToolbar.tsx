import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { copy } from "../content/uiCopy";
export type PreviewTab = "original" | "diff" | "draft";

const tabLabels: Record<PreviewTab, string> = {
  original: copy.ai.page.tabOriginalShort,
  diff: copy.ai.page.tabDiffShort,
  draft: copy.ai.page.tabDraftShort,
};

export function AgentDocumentToolbar({
  relativePath,
  estimatedTokens,
  hasDraft,
  tokenDelta,
  previewTab,
  onPreviewTab,
  aiReady,
  draftLoading,
  refineLoading,
  saving,
  draftDirty,
  onGenerate,
  onRevert,
  onSave,
  savedBackup,
  error,
}: {
  relativePath: string;
  estimatedTokens?: number;
  hasDraft: boolean;
  tokenDelta: number;
  previewTab: PreviewTab;
  onPreviewTab: (tab: PreviewTab) => void;
  aiReady: boolean;
  draftLoading: boolean;
  refineLoading: boolean;
  saving: boolean;
  draftDirty: boolean;
  onGenerate: () => void;
  onRevert: () => void;
  onSave: () => void;
  savedBackup: string | null;
  error: string | null;
}) {
  const busy = draftLoading || refineLoading;

  return (
    <Box
      sx={{
        px: 1.25,
        py: 0.65,
        borderBottom: `1px solid ${alpha("#fff", 0.06)}`,
        flexShrink: 0,
        bgcolor: alpha("#0a0d11", 0.35),
      }}
    >
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          alignItems: "center",
          minHeight: 32,
          flexWrap: { xs: "wrap", lg: "nowrap" },
          gap: 0.5,
        }}
      >
        <Tooltip title={relativePath} enterDelay={500}>
          <Typography
            noWrap
            sx={{
              fontFamily: "monospace",
              fontSize: 10.5,
              color: "text.secondary",
              flex: { xs: "1 1 100%", lg: "1 1 auto" },
              minWidth: 0,
              maxWidth: { lg: 280 },
            }}
          >
            {relativePath}
          </Typography>
        </Tooltip>

        {estimatedTokens != null && (
          <Chip
            size="small"
            variant="outlined"
            label={`~${estimatedTokens.toLocaleString()}`}
            sx={{
              height: 22,
              "& .MuiChip-label": { px: 0.75, fontSize: 10 },
            }}
          />
        )}
        {hasDraft && tokenDelta > 0 && (
          <Chip
            size="small"
            color="success"
            variant="outlined"
            label={`−${tokenDelta}`}
            sx={{
              height: 22,
              "& .MuiChip-label": { px: 0.75, fontSize: 10 },
            }}
          />
        )}

        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: "none", md: "block" }, borderColor: alpha("#fff", 0.08), my: 0.5 }}
        />

        <ToggleButtonGroup
          exclusive
          size="small"
          value={previewTab}
          onChange={(_, v: PreviewTab | null) => {
            if (v) onPreviewTab(v);
          }}
          sx={{
            flexShrink: 0,
            "& .MuiToggleButton-root": {
              py: 0.25,
              px: 1,
              minWidth: 0,
              fontSize: 11,
              fontWeight: 600,
              textTransform: "none",
              borderColor: `${alpha("#fff", 0.1)} !important`,
              "&.Mui-selected": {
                bgcolor: alpha("#5eead4", 0.14),
                color: "primary.light",
              },
            },
          }}
        >
          {(Object.keys(tabLabels) as PreviewTab[]).map((tab) => (
            <ToggleButton key={tab} value={tab} disabled={tab !== "original" && !hasDraft}>
              {tabLabels[tab]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box sx={{ flex: 1, display: { xs: "none", lg: "block" }, minWidth: 8 }} />

        <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0, ml: { xs: "auto", lg: 0 } }}>
          <Tooltip title={hasDraft ? copy.ai.page.regenerateDraft : copy.ai.page.startDraft}>
            <span>
              <IconButton
                size="small"
                color="primary"
                disabled={!aiReady || busy}
                onClick={onGenerate}
                sx={{ width: 30, height: 30 }}
              >
                {draftLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <AutoFixHighOutlinedIcon sx={{ fontSize: 17 }} />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={copy.ai.revertDraft}>
            <span>
              <IconButton
                size="small"
                disabled={!hasDraft || !draftDirty}
                onClick={onRevert}
                sx={{ width: 30, height: 30 }}
              >
                <RestoreOutlinedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={copy.ai.apply}>
            <span>
              <IconButton
                size="small"
                color="success"
                disabled={!hasDraft || saving || !draftDirty}
                onClick={onSave}
                sx={{ width: 30, height: 30 }}
              >
                <SaveOutlinedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {(error || savedBackup) && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.35,
            lineHeight: 1.35,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: error ? "error.main" : "success.main",
            fontSize: 10.5,
          }}
        >
          {error ?? (savedBackup ? copy.ai.savedBackup(savedBackup) : "")}
        </Typography>
      )}
    </Box>
  );
}