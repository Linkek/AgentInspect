import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { copy } from "../content/uiCopy";
import type { ScanReport } from "../types/scan";
import { severityColor } from "../types/scan";

function impactLabel(severity: number): { label: string; color: "error" | "warning" | "default" } {
  if (severity >= 75) return { label: copy.report.impactHigh, color: "error" };
  if (severity >= 45) return { label: copy.report.impactMed, color: "warning" };
  return { label: copy.report.impactLow, color: "default" };
}

export function IssuesPage({
  report,
  onOpenFile,
}: {
  report: ScanReport;
  onOpenFile: (path: string) => void;
}) {
  const issues = report.issues;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
        {copy.report.issuesSummary(issues.length)}
      </Typography>

      {!issues.length && (
        <Paper sx={{ p: 3 }}>
          <Typography color="success.main" sx={{ lineHeight: 1.6 }}>
            {copy.issues.empty}
          </Typography>
        </Paper>
      )}

      <Stack spacing={1.5}>
        {issues.map((issue) => {
          const impact = impactLabel(issue.severity);
          return (
            <Paper
              key={issue.id}
              sx={{
                p: 2,
                cursor: issue.relativePath ? "pointer" : "default",
                "&:hover": issue.relativePath ? { bgcolor: "rgba(110,231,255,0.06)" } : undefined,
              }}
              onClick={() => {
                if (issue.relativePath) onOpenFile(issue.relativePath);
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  {issue.title}
                </Typography>
                <Chip size="small" label={impact.label} color={impact.color} variant="outlined" />
              </Stack>
              <Linear severity={issue.severity} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.55 }}>
                {issue.detail}
              </Typography>
              {issue.relativePath ? (
                <Typography
                  variant="caption"
                  sx={{ fontFamily: "monospace", display: "block", mt: 0.75, color: "primary.light" }}
                >
                  {issue.relativePath} · {copy.issues.openInAgent}
                </Typography>
              ) : null}
            </Paper>
          );
        })}
      </Stack>
    </Stack>
  );
}

function Linear({ severity }: { severity: number }) {
  return (
    <div
      style={{
        height: 6,
        borderRadius: 4,
        background: "#1e293b",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${severity}%`,
          height: "100%",
          background: severityColor(severity),
          borderRadius: 4,
        }}
      />
    </div>
  );
}