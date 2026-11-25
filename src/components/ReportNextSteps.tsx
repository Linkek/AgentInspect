import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { copy } from "../content/uiCopy";
import type { NavPage } from "../layout/AppSidebar";
import type { ScanReport } from "../types/scan";

export function ReportNextSteps({
  report,
  onGoTo,
}: {
  report: ScanReport;
  onGoTo: (page: NavPage) => void;
}) {
  const n = report.issues.length;
  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(255,255,255,0.08)" }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {copy.report.nextStepsTitle}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        {n > 0 && (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => onGoTo("issues")}
          >
            {copy.report.nextIssues(n)}
          </Button>
        )}
        <Button variant="outlined" endIcon={<ArrowForwardIcon />} onClick={() => onGoTo("charts")}>
          {copy.report.nextAnalytics}
        </Button>
        <Button variant="outlined" endIcon={<ArrowForwardIcon />} onClick={() => onGoTo("agent")}>
          {copy.report.nextAgent}
        </Button>
        <Button variant="outlined" endIcon={<ArrowForwardIcon />} onClick={() => onGoTo("browse")}>
          {copy.report.nextExplorer}
        </Button>
      </Stack>
    </Paper>
  );
}