import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { WelcomeHero } from "../components/WelcomeHero";
import { copy } from "../content/uiCopy";
import { PLATFORM_LABELS, type PlatformScanBundle } from "../types/scan";
import { pickDefaultPlatform } from "../utils/platformScan";

export function ScanPage({
  loading,
  error,
  bundle,
  onOpenLast,
}: {
  loading: boolean;
  error: string | null;
  onPickFolder: () => void;
  bundle: PlatformScanBundle | null;
  onOpenLast: () => void;
}) {
  const previewPlatform = bundle ? pickDefaultPlatform(bundle.platforms) : "";
  const lastReport = bundle?.reportsByPlatform[previewPlatform] ?? null;

  return (
    <Box sx={{ position: "relative", minHeight: "100vh" }}>
      <WelcomeHero loading={loading} error={error} />

      {bundle && !loading && (
        <Paper
          sx={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(520px, calc(100% - 48px))",
            p: 2.25,
            borderColor: alpha("#5eead4", 0.25),
            bgcolor: alpha("#0e1218", 0.92),
            backdropFilter: "blur(12px)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" color="text.secondary">
                {copy.scan.previousScan}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  lineHeight: 1.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {bundle.repoPath}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${bundle.platforms.length} platforms`}
                />
                {lastReport && (
                  <Chip
                    size="small"
                    label={`${PLATFORM_LABELS[previewPlatform] ?? previewPlatform} · ${lastReport.score.overall}`}
                    color={
                      lastReport.score.overall >= 70
                        ? "success"
                        : lastReport.score.overall >= 45
                          ? "warning"
                          : "error"
                    }
                  />
                )}
              </Stack>
            </Box>
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={onOpenLast}
              sx={{ flexShrink: 0, py: 1.25, px: 2 }}
            >
              {copy.scan.viewResults}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}