import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { copy } from "../content/uiCopy";
import type { NavPage } from "../layout/AppSidebar";
import {
  PLATFORM_LABELS,
  type PlatformScanBundle,
  type ScanReport,
} from "../types/scan";

const pageTitle: Record<NavPage, string> = {
  scan: copy.pages.scan.title,
  score: copy.pages.overview.title,
  issues: copy.pages.issues.title,
  charts: copy.pages.analytics.title,
  browse: copy.pages.explorer.title,
  agent: copy.pages.agent.title,
  settings: copy.pages.settings.title,
};

const pageHint: Record<NavPage, string> = {
  scan: copy.pages.scan.subtitle,
  score: copy.report.hints.overview,
  issues: copy.report.hints.issues,
  charts: copy.report.hints.analytics,
  browse: copy.report.hints.explorer,
  agent: copy.report.hints.agent,
  settings: copy.pages.settings.subtitle,
};

export function ReportContextBar({
  page,
  bundle,
  platform,
  report,
  onPlatform,
}: {
  page: NavPage;
  bundle: PlatformScanBundle;
  platform: string;
  report: ScanReport;
  onPlatform: (id: string) => void;
}) {
  const platformLabel = PLATFORM_LABELS[platform] ?? platform;
  const alwaysOn = report.contextTax.alwaysOnTokens;
  const issueCount = report.issues.length;
  const compact = page === "agent";

  if (compact) {
    return (
      <Box
        sx={{
          mb: 1,
          pb: 1,
          borderBottom: `1px solid ${alpha("#fff", 0.06)}`,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          sx={{ alignItems: { md: "center" }, justifyContent: "space-between", gap: 1 }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", flexWrap: "wrap" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: "-0.01em" }}>
              {pageTitle[page]}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, maxWidth: 420 }}>
              {pageHint[page]}
            </Typography>
          </Stack>
          <ToggleButtonGroup
            exclusive
            value={platform}
            onChange={(_, v: string | null) => {
              if (v) onPlatform(v);
            }}
            size="small"
            sx={{
              flexWrap: "wrap",
              gap: 0.35,
              "& .MuiToggleButtonGroup-grouped": {
                border: `1px solid ${alpha("#fff", 0.1)} !important`,
                borderRadius: "6px !important",
                mx: 0,
                px: 1,
                py: 0.35,
                fontSize: 11,
                textTransform: "none",
                fontWeight: 500,
                lineHeight: 1.3,
              },
            }}
          >
            {bundle.platforms.map((id) => {
              const pr = bundle.reportsByPlatform[id];
              const label = PLATFORM_LABELS[id] ?? id;
              const score = pr?.score.overall;
              return (
                <ToggleButton key={id} value={id}>
                  {score != null ? `${label} · ${score}` : label}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.35, mt: 0.85 }}>
          <Chip
            size="small"
            variant="outlined"
            label={copy.report.stats.files(report.fileCount)}
            sx={{ height: 22, "& .MuiChip-label": { px: 0.75, fontSize: 10.5 } }}
          />
          <Chip
            size="small"
            variant="outlined"
            label={copy.report.stats.tokens(report.estimatedTokens.toLocaleString())}
            sx={{ height: 22, "& .MuiChip-label": { px: 0.75, fontSize: 10.5 } }}
          />
          {issueCount > 0 ? (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label={copy.report.stats.issues(issueCount)}
              sx={{ height: 22, "& .MuiChip-label": { px: 0.75, fontSize: 10.5 } }}
            />
          ) : (
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label={copy.report.stats.noIssues}
              sx={{ height: 22, "& .MuiChip-label": { px: 0.75, fontSize: 10.5 } }}
            />
          )}
          <Chip
            size="small"
            variant="outlined"
            label={copy.report.stats.budget(report.budgets.modelLabel)}
            sx={{ height: 22, "& .MuiChip-label": { px: 0.75, fontSize: 10.5 } }}
          />
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mb: 3,
        pb: 2.5,
        borderBottom: `1px solid ${alpha("#fff", 0.06)}`,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.25, mb: 0.75 }}>
        {pageTitle[page]}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, mb: 2, maxWidth: 680 }}>
        {pageHint[page]}
      </Typography>

      <Stack spacing={1.5}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
            {copy.report.viewingLabel}
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={platform}
            onChange={(_, v: string | null) => {
              if (v) onPlatform(v);
            }}
            size="small"
            sx={{
              flexWrap: "wrap",
              gap: 0.5,
              "& .MuiToggleButtonGroup-grouped": {
                border: `1px solid ${alpha("#fff", 0.12)} !important`,
                borderRadius: "8px !important",
                mx: 0,
                px: 1.5,
                py: 0.75,
                textTransform: "none",
                fontWeight: 500,
              },
            }}
          >
            {bundle.platforms.map((id) => {
              const pr = bundle.reportsByPlatform[id];
              const label = PLATFORM_LABELS[id] ?? id;
              const score = pr?.score.overall;
              return (
                <ToggleButton key={id} value={id}>
                  {score != null ? `${label} · ${score}` : label}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.75 }}>
          <Chip size="small" variant="outlined" label={copy.report.stats.files(report.fileCount)} />
          <Chip
            size="small"
            variant="outlined"
            label={copy.report.stats.tokens(report.estimatedTokens.toLocaleString())}
          />
          <Chip
            size="small"
            variant="outlined"
            label={copy.report.stats.alwaysOn(alwaysOn.toLocaleString())}
          />
          {issueCount > 0 ? (
            <Chip size="small" color="warning" variant="outlined" label={copy.report.stats.issues(issueCount)} />
          ) : (
            <Chip size="small" color="success" variant="outlined" label={copy.report.stats.noIssues} />
          )}
          <Chip
            size="small"
            variant="outlined"
            label={copy.report.stats.budget(report.budgets.modelLabel)}
          />
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          {copy.report.scopeNote(platformLabel)}
        </Typography>
      </Stack>
    </Box>
  );
}