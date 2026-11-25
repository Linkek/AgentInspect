import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ReportNextSteps } from "../components/ReportNextSteps";
import { WarningsList } from "../components/SummaryCards";
import { copy } from "../content/uiCopy";
import type { NavPage } from "../layout/AppSidebar";
import type { ScanReport } from "../types/scan";

function scoreColor(score: number) {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#fbbf24";
  if (score >= 40) return "#fb923c";
  return "#f87171";
}

export function ScorePage({
  report,
  onGoTo,
}: {
  report: ScanReport;
  onGoTo: (page: NavPage) => void;
}) {
  const { score, budgets } = report;

  return (
    <Stack spacing={2.5}>
      <ReportNextSteps report={report} onGoTo={onGoTo} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              p: 3,
              textAlign: "center",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography variant="overline" color="text.secondary">
              {copy.score.healthTitle}
            </Typography>
            <Typography
              variant="h1"
              sx={{ fontWeight: 800, color: scoreColor(score.overall), my: 1 }}
            >
              {score.overall}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
              {copy.score.healthHint}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, lineHeight: 1.5 }}>
              {copy.score.comparedTo} {budgets.providerLabel} · {budgets.modelLabel}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h6" gutterBottom>
              {copy.score.dimensions}
            </Typography>
            <Stack spacing={2}>
              {score.dimensions.map((d) => (
                <DimensionRow key={d.id} dimension={d} />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {score.highlights.length > 0 && (
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" gutterBottom>
            {copy.score.strengths}
          </Typography>
          <Stack spacing={1.25}>
            {score.highlights.map((h) => (
              <Stack key={h.title} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                <CheckCircleOutlinedIcon color="success" fontSize="small" sx={{ mt: 0.25 }} />
                <div>
                  <Typography variant="subtitle2">{h.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                    {h.detail}
                  </Typography>
                </div>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}

      <WarningsList warnings={report.warnings} title={copy.report.warningsTitle} />
    </Stack>
  );
}

function DimensionRow({
  dimension,
}: {
  dimension: ScanReport["score"]["dimensions"][0];
}) {
  const label =
    copy.report.dimensionLabels[dimension.id] ?? dimension.label;

  return (
    <div>
      <Stack direction="row" sx={{ mb: 0.5, justifyContent: "space-between", gap: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {dimension.score}/100
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={dimension.score}
        sx={{
          height: 8,
          borderRadius: 1,
          "& .MuiLinearProgress-bar": {
            bgcolor:
              dimension.score >= 70
                ? "#34d399"
                : dimension.score >= 45
                  ? "#fbbf24"
                  : "#f87171",
          },
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45, display: "block", mt: 0.35 }}>
        {dimension.detail}
      </Typography>
    </div>
  );
}