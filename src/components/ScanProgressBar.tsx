import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { copy } from "../content/uiCopy";
import { progressPercent, useScanProgress } from "../hooks/useScanProgress";

export function ScanProgressBar({ active }: { active: boolean }) {
  const progress = useScanProgress(active);
  if (!active || !progress) return null;

  const pct = progressPercent(progress);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, lineHeight: 1.4 }}>
        {progress.phase === "walking"
          ? copy.progress.walking
          : progress.phase === "reading"
            ? copy.progress.reading
            : copy.progress.analyzing}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          mb: 1,
          height: 6,
          borderRadius: 99,
          bgcolor: "rgba(255,255,255,0.06)",
          "& .MuiLinearProgress-bar": { borderRadius: 99, bgcolor: "primary.main" },
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontFamily: "monospace" }}>
          {progress.message}
        </Typography>
        {progress.total > 0 ? (
          <Typography variant="caption" color="text.secondary">
            {progress.current} / {progress.total}
          </Typography>
        ) : null}
      </Box>
    </Paper>
  );
}