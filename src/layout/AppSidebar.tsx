import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import RadarOutlinedIcon from "@mui/icons-material/RadarOutlined";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import PieChartOutlinedIcon from "@mui/icons-material/PieChartOutlined";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { copy } from "../content/uiCopy";
import { drawerWidth } from "../theme";
import { APP_SCROLL_CLASS } from "../themeScrollbars";
import type { ReactNode } from "react";
import type { ScanReport } from "../types/scan";

export type NavPage = "scan" | "score" | "issues" | "charts" | "browse" | "agent" | "settings";

const mainNav: { id: NavPage; label: string; icon: ReactNode; needsScan: boolean }[] = [
  { id: "score", label: copy.pages.overview.title, icon: <AssessmentOutlinedIcon />, needsScan: true },
  { id: "issues", label: copy.pages.issues.title, icon: <InsightsOutlinedIcon />, needsScan: true },
  { id: "charts", label: copy.pages.analytics.title, icon: <PieChartOutlinedIcon />, needsScan: true },
  { id: "browse", label: copy.pages.explorer.title, icon: <CodeOutlinedIcon />, needsScan: true },
  { id: "agent", label: copy.pages.agent.title, icon: <AutoFixHighOutlinedIcon />, needsScan: true },
];

export function AppSidebar({
  page,
  onPage,
  report,
  loading,
  onPickFolder,
}: {
  page: NavPage;
  onPage: (p: NavPage) => void;
  report: ScanReport | null;
  loading: boolean;
  onPickFolder: () => void;
}) {
  const hasScan = !!report;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: `1px solid ${alpha("#fff", 0.06)}`,
          bgcolor: "#0e1218",
          backgroundImage: `linear-gradient(180deg, ${alpha("#5eead4", 0.04)} 0%, transparent 28%)`,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
        <StackBrand />
        <Button
          fullWidth
          variant="contained"
          disabled={loading}
          onClick={onPickFolder}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <FolderOpenOutlinedIcon />
            )
          }
          sx={{ mt: 2, py: 1.35, fontSize: "0.95rem" }}
        >
          {loading ? copy.scan.scanning : copy.scan.primaryAction}
        </Button>
        {hasScan && report && (
          <Tooltip title={report.repoPath}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1.5,
                px: 1.25,
                py: 0.75,
                borderRadius: 1.5,
                bgcolor: alpha("#fff", 0.04),
                fontFamily: "monospace",
                fontSize: 11,
                lineHeight: 1.45,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {report.repoPath}
            </Typography>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ borderColor: alpha("#fff", 0.06) }} />

      <List className={APP_SCROLL_CLASS} sx={{ px: 1.5, py: 1, flex: 1, minHeight: 0, overflow: "auto" }}>
        <ListItemButton
          selected={page === "scan"}
          disabled={loading}
          onClick={() => onPage("scan")}
          sx={{ py: 1.1, mb: 0.5 }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: page === "scan" ? "primary.main" : "inherit" }}>
            <RadarOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary={copy.scan.navHome}
            secondary={hasScan ? copy.scan.navHomeHintRescan : copy.scan.navHomeHint}
            slotProps={{
              primary: { sx: { fontWeight: 600 } },
              secondary: { sx: { fontSize: 11, lineHeight: 1.4 } },
            }}
          />
        </ListItemButton>

        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ px: 1.5, py: 1, display: "block" }}
        >
          {copy.sidebar.resultsSection}
        </Typography>

        {mainNav.map((item) => {
          const disabled = item.needsScan && !hasScan;
          const badge =
            item.id === "issues" && report ? report.issues.length : undefined;
          return (
            <Tooltip
              key={item.id}
              title={disabled ? copy.sidebar.disabledNeedScan : ""}
              placement="right"
            >
              <span>
                <ListItemButton
                  selected={page === item.id}
                  disabled={disabled || loading}
                  onClick={() => onPage(item.id)}
                  sx={{ py: 1.1 }}
                >
                  <ListItemIcon
                    sx={{ minWidth: 40, color: page === item.id ? "primary.main" : "inherit" }}
                  >
                    {badge != null && badge > 0 ? (
                      <Badge badgeContent={badge} color="error" max={99}>
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { sx: { fontWeight: 500, fontSize: "0.9375rem" } } }}
                  />
                  {hasScan && item.id === "score" && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        color:
                          report!.score.overall >= 70
                            ? "success.main"
                            : report!.score.overall >= 45
                              ? "warning.main"
                              : "error.main",
                      }}
                    >
                      {report!.score.overall}
                    </Typography>
                  )}
                </ListItemButton>
              </span>
            </Tooltip>
          );
        })}
      </List>

      <Box sx={{ px: 1.5, pb: 2 }}>
        <ListItemButton
          selected={page === "settings"}
          onClick={() => onPage("settings")}
          sx={{ py: 1.1 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <SettingsOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary={copy.sidebar.settings}
            slotProps={{ primary: { sx: { fontWeight: 500, fontSize: "0.9375rem" } } }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}

function StackBrand() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha("#5eead4", 0.35)} 0%, ${alpha("#a78bfa", 0.35)} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 24px ${alpha("#5eead4", 0.15)}`,
        }}
      >
        <InsightsOutlinedIcon sx={{ fontSize: 20, color: "#e2e8f0" }} />
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          AgentInspect
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
          {copy.app.tagline}
        </Typography>
      </Box>
    </Box>
  );
}