import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { RoleSyncInfo } from "../types/scan";

export function RoleSyncPanel({ info }: { info: RoleSyncInfo }) {
  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: "center" }}>
        {info.detected ? (
          <CheckCircleOutlinedIcon color="success" />
        ) : (
          <HighlightOffIcon color="disabled" />
        )}
        <Typography variant="h6">RoleSync</Typography>
      </Stack>
      {info.detected ? (
        <Stack spacing={0.75}>
          <Typography variant="body2">
            Canonical tree under <code>.agents/</code> with generated Claude/Codex
            outputs. CLI: <code>rolesync init</code>, <code>rolesync sync</code>,{" "}
            <code>rolesync check</code>.
          </Typography>
          {info.configPath && (
            <Typography variant="body2" color="text.secondary">
              Config: {info.configPath}
            </Typography>
          )}
          {info.catalogPath && (
            <Typography variant="body2" color="text.secondary">
              Catalog: {info.catalogPath}
            </Typography>
          )}
          {info.manifestPath && (
            <Typography variant="body2" color="text.secondary">
              Manifest: {info.manifestPath}
            </Typography>
          )}
          <Typography variant="body2">
            Roles: {info.roleCount} · Skills (RoleSync): {info.skillCount}
            {info.platforms.length
              ? ` · Targets: ${info.platforms.join(", ")}`
              : ""}
          </Typography>
        </Stack>
      ) : (
        <Typography color="text.secondary">
          No <code>.agents/</code> tree found. RoleSync is optional — projects may
          use native <code>.claude/</code> and <code>.codex/</code> only.
        </Typography>
      )}
    </Paper>
  );
}