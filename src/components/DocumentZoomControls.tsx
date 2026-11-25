import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

export const VIEWER_FONT_MIN = 10;
export const VIEWER_FONT_MAX = 22;
export const VIEWER_FONT_DEFAULT = 13;
const VIEWER_FONT_STEP = 1;

export function clampViewerFont(px: number): number {
  return Math.min(VIEWER_FONT_MAX, Math.max(VIEWER_FONT_MIN, px));
}

export function DocumentZoomControls({
  fontSize,
  onChange,
}: {
  fontSize: number;
  onChange: (px: number) => void;
}) {
  return (
    <Stack
      direction="row"
      spacing={0}
      sx={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 4,
        alignItems: "center",
        borderRadius: 1,
        bgcolor: alpha("#12161c", 0.92),
        border: `1px solid ${alpha("#fff", 0.1)}`,
        boxShadow: `0 4px 20px ${alpha("#000", 0.35)}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <IconButton
        size="small"
        aria-label="Decrease text size"
        disabled={fontSize <= VIEWER_FONT_MIN}
        onClick={() => onChange(clampViewerFont(fontSize - VIEWER_FONT_STEP))}
        sx={{ width: 26, height: 26, borderRadius: "4px 0 0 4px" }}
      >
        <RemoveIcon sx={{ fontSize: 15 }} />
      </IconButton>
      <Typography
        variant="caption"
        sx={{
          px: 0.5,
          minWidth: 22,
          textAlign: "center",
          fontSize: 10,
          color: "text.secondary",
          userSelect: "none",
        }}
      >
        {fontSize}
      </Typography>
      <IconButton
        size="small"
        aria-label="Increase text size"
        disabled={fontSize >= VIEWER_FONT_MAX}
        onClick={() => onChange(clampViewerFont(fontSize + VIEWER_FONT_STEP))}
        sx={{ width: 26, height: 26, borderRadius: "0 4px 4px 0" }}
      >
        <AddIcon sx={{ fontSize: 15 }} />
      </IconButton>
    </Stack>
  );
}