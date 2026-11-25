import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, keyframes } from "@mui/material/styles";
import { copy } from "../content/uiCopy";
import { ScanProgressBar } from "./ScanProgressBar";

const pulse = keyframes`
  0%, 100% { opacity: 0.45; transform: scale(1); }
  50% { opacity: 0.75; transform: scale(1.04); }
`;

const pillarIcons = [
  <SearchOutlinedIcon key="a" fontSize="small" />,
  <BoltOutlinedIcon key="b" fontSize="small" />,
  <TuneOutlinedIcon key="c" fontSize="small" />,
];

export function WelcomeHero({
  loading,
  error,
}: {
  loading: boolean;
  error: string | null;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 48px)",
        position: "relative",
        overflow: "hidden",
        px: 3,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 50% -10%, ${alpha("#5eead4", 0.18)} 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 90% 80%, ${alpha("#a78bfa", 0.12)} 0%, transparent 50%),
            radial-gradient(ellipse 40% 35% at 10% 90%, ${alpha("#38bdf8", 0.08)} 0%, transparent 45%)
          `,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: "50%",
          border: `1px dashed ${alpha("#5eead4", 0.2)}`,
          animation: `${pulse} 6s ease-in-out infinite`,
          pointerEvents: "none",
        }}
      />

      <Stack spacing={2.5} sx={{ maxWidth: 480, textAlign: "center", zIndex: 1, alignItems: "center" }}>
        <Chip
          label={copy.scan.screenTitle}
          size="small"
          sx={{
            bgcolor: alpha("#5eead4", 0.1),
            color: "#99f6e4",
            border: `1px solid ${alpha("#5eead4", 0.25)}`,
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
        <Typography variant="h4" component="h1" sx={{ lineHeight: 1.2, fontWeight: 800 }}>
          {copy.scan.headline}
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ fontSize: "1rem", lineHeight: 1.65, maxWidth: 420 }}
        >
          {copy.scan.body}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{ py: 0.5, flexWrap: "wrap", justifyContent: "center" }}
        >
          {copy.scan.pillars.map((label, i) => (
            <Chip
              key={label}
              icon={pillarIcons[i]}
              label={label}
              variant="outlined"
              sx={{
                borderColor: alpha("#fff", 0.1),
                bgcolor: alpha("#fff", 0.03),
                fontSize: "0.8125rem",
              }}
            />
          ))}
        </Stack>

        {loading && (
          <Box sx={{ width: "100%", maxWidth: 400, mt: 1 }}>
            <ScanProgressBar active />
          </Box>
        )}

        {!loading && (
          <Typography
            variant="body1"
            sx={{
              mt: 1,
              fontWeight: 600,
              color: "primary.light",
              lineHeight: 1.5,
            }}
          >
            {copy.scan.pickFromSidebar}
          </Typography>
        )}

        {error && (
          <Typography color="error" variant="body2" sx={{ maxWidth: 400, lineHeight: 1.55 }}>
            {error}
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, mt: 0.5 }}>
          {copy.scan.privacy}
        </Typography>
      </Stack>
    </Box>
  );
}