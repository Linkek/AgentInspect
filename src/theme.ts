import { createTheme, alpha } from "@mui/material/styles";

export const drawerWidth = 272;

const accent = "#5eead4";
const accentDim = "#2dd4bf";
const violet = "#a78bfa";
const surface = "#12161c";
const elevated = "#1a212b";

/** Dark mode only — no theme toggle */
export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: accent, light: "#99f6e4", dark: accentDim },
    secondary: { main: violet },
    success: { main: "#34d399" },
    warning: { main: "#fbbf24" },
    error: { main: "#f87171" },
    background: {
      default: "#0a0d11",
      paper: surface,
    },
    divider: alpha("#94a3b8", 0.12),
    text: {
      primary: "#f1f5f9",
      secondary: "#94a3b8",
    },
  },
  typography: {
    fontFamily: '"Segoe UI Variable", "Inter", system-ui, sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 },
    h4: { fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 },
    h5: { lineHeight: 1.25 },
    h6: { fontWeight: 600, lineHeight: 1.3 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.55, fontSize: "0.9375rem" },
    caption: { lineHeight: 1.45 },
    overline: { letterSpacing: "0.12em", fontWeight: 600, lineHeight: 1.5 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: elevated,
          border: `1px solid ${alpha("#fff", 0.06)}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: `0 0 0 1px ${alpha(accent, 0.35)}, 0 8px 32px ${alpha(accent, 0.2)}`,
          "&:hover": {
            boxShadow: `0 0 0 1px ${alpha(accent, 0.5)}, 0 12px 40px ${alpha(accent, 0.28)}`,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 48,
          fontSize: "0.95rem",
        },
      },
    },
    MuiSelect: {
      defaultProps: { size: "medium" },
    },
    MuiTextField: {
      defaultProps: { size: "medium" },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: "0.95rem" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { fontSize: "0.9rem", py: 1.25 },
        head: { fontSize: "0.85rem", fontWeight: 600 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: () => ({
          borderRadius: 10,
          marginBottom: 4,
          "&.Mui-selected": {
            backgroundColor: alpha(accent, 0.12),
            borderLeft: `3px solid ${accent}`,
            "&:hover": {
              backgroundColor: alpha(accent, 0.16),
            },
          },
        }),
      },
    },
  },
});