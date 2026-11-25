import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ScanReport } from "../types/scan";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Paper sx={{ p: 2.5, height: "100%" }}>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.5 }}>
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}

export function SummaryCards({ scan }: { scan: ScanReport }) {
  const dupTokens = scan.duplicateGroups.reduce(
    (n, g) => n + g.estimatedTokens * (g.paths.length - 1),
    0,
  );
  const alwaysOn = scan.contextTax.alwaysOnTokens;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard
          label="Instruction files"
          value={String(scan.fileCount)}
          hint="In this toolchain only"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard
          label="Every-chat cost"
          value={`~${alwaysOn.toLocaleString()}`}
          hint="Tokens likely loaded each request"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard
          label="Total tokens"
          value={`~${scan.estimatedTokens.toLocaleString()}`}
          hint={
            dupTokens > 0
              ? `Includes ~${dupTokens.toLocaleString()} duplicate waste`
              : "Roughly 4 characters ≈ 1 token"
          }
        />
      </Grid>
    </Grid>
  );
}

export function WarningsList({
  warnings,
  title = "Notes",
}: {
  warnings: string[];
  title?: string;
}) {
  if (!warnings.length) return null;
  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {title}
      </Typography>
      {warnings.map((w) => (
        <Paper
          key={w}
          sx={{
            p: 1.5,
            borderLeft: 4,
            borderColor: "warning.main",
            bgcolor: "rgba(255,193,7,0.08)",
          }}
        >
          <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
            {w}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}