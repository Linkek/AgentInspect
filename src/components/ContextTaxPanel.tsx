import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { copy } from "../content/uiCopy";
import {
  LOAD_SCOPE_COLORS,
  LOAD_SCOPE_LABELS,
  type ScanReport,
} from "../types/scan";

export function ContextTaxPanel({ report }: { report: ScanReport }) {
  const { contextTax, budgets } = report;
  const alwaysBudget = budgets.alwaysOnBudgetTokens;
  const alwaysPct = Math.min(100, (contextTax.alwaysOnTokens / Math.max(1, alwaysBudget)) * 100);

  const scopeData = Object.entries(report.byLoadScope ?? {})
    .map(([key, stats]) => ({
      key,
      name: LOAD_SCOPE_LABELS[key] ?? key,
      tokens: stats.estimatedTokens,
      files: stats.files,
    }))
    .sort((a, b) => b.tokens - a.tokens);

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h6" gutterBottom>
          {copy.analytics.contextTaxTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
          {copy.analytics.contextTaxBody}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TaxStat label={copy.analytics.alwaysOn} value={contextTax.alwaysOnTokens} accent="#f87171" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TaxStat
              label={copy.analytics.onDemandGroup}
              value={contextTax.pathScopedTokens + contextTax.onDemandTokens}
              accent="#5eead4"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TaxStat label={copy.analytics.latent} value={contextTax.latentTokens} accent="#a78bfa" />
          </Grid>
        </Grid>

        <Typography variant="subtitle2" sx={{ mb: 0.75, lineHeight: 1.45 }}>
          {copy.analytics.budgetCompare(alwaysBudget.toLocaleString())}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={alwaysPct}
          sx={{
            height: 10,
            borderRadius: 99,
            mb: 0.5,
            bgcolor: "rgba(255,255,255,0.06)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 99,
              bgcolor: alwaysPct > 100 ? "error.main" : alwaysPct > 70 ? "warning.main" : "success.main",
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
          {copy.analytics.budgetFraction(
            contextTax.alwaysOnTokens.toLocaleString(),
            alwaysBudget.toLocaleString(),
          )}
        </Typography>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h6" gutterBottom>
          {copy.analytics.byScope}
        </Typography>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={scopeData} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip
              formatter={(value) => `${Number(value ?? 0).toLocaleString()} est. tokens`}
            />
            <Bar dataKey="tokens" radius={[6, 6, 0, 0]}>
              {scopeData.map((row) => (
                <Cell key={row.key} fill={LOAD_SCOPE_COLORS[row.key] ?? "#94a3b8"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ScopeMini title={copy.analytics.mcp} tokens={contextTax.toolConfigTokens} hint={copy.analytics.mcpHint} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ScopeMini
              title={copy.analytics.generated}
              tokens={contextTax.generatedTokens}
              hint={copy.analytics.generatedHint}
            />
          </Grid>
        </Grid>
      </Paper>

      {contextTax.topAlwaysOn.length > 0 && (
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" gutterBottom>
            {copy.analytics.offenders}
          </Typography>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Path</TableCell>
                <TableCell align="right">Est. tokens</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contextTax.topAlwaysOn.map((row) => (
                <TableRow key={row.relativePath}>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
                    {row.relativePath}
                  </TableCell>
                  <TableCell align="right">{row.estimatedTokens.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}

function TaxStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: "rgba(255,255,255,0.08)",
        borderTop: `3px solid ${accent}`,
      }}
    >
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        {value.toLocaleString()}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
        {copy.analytics.estSuffix}
      </Typography>
    </Paper>
  );
}

function ScopeMini({
  title,
  tokens,
  hint,
}: {
  title: string;
  tokens: number;
  hint: string;
}) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(255,255,255,0.03)" }}>
      <Typography variant="subtitle2">{title}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        ~{tokens.toLocaleString()}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {hint}
      </Typography>
    </Box>
  );
}