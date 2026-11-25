import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { copy } from "../content/uiCopy";
import type { InstructionFile } from "../types/scan";
import { LOAD_SCOPE_LABELS } from "../types/scan";
import { severityColor } from "../types/scan";

function fileLabel(path: string): string {
  const name = path.split("/").pop() ?? path;
  if (name.length > 28) return `${name.slice(0, 26)}…`;
  return name;
}

function FileRows({
  files,
  flaggedPaths,
  selected,
  primaryPath,
  onSelect,
}: {
  files: InstructionFile[];
  flaggedPaths: Set<string>;
  selected: string | null;
  primaryPath?: string | null;
  onSelect: (path: string) => void;
}) {
  return (
  <>
      {files.map((f) => (
        <Tooltip key={f.path} title={f.relativePath} placement="right" enterDelay={400}>
          <ListItemButton
            selected={selected === f.relativePath}
            onClick={() => onSelect(f.relativePath)}
            sx={{
              py: 0.35,
              px: 1,
              minHeight: 32,
              borderRadius: 1,
              mb: 0.25,
              "&.Mui-selected": {
                bgcolor: alpha("#5eead4", 0.12),
              },
            }}
          >
            <Stack direction="row" sx={{ alignItems: "center", width: "100%", minWidth: 0, gap: 0.5 }}>
              <Box
                sx={{
                  fontFamily: "monospace",
                  fontSize: 10.5,
                  lineHeight: 1.35,
                  color: flaggedPaths.has(f.relativePath) ? severityColor(75) : "text.primary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {fileLabel(f.relativePath)}
                <Box component="span" sx={{ color: "text.secondary", ml: 0.5, fontSize: 9 }}>
                  {f.estimatedTokens > 999
                    ? `${Math.round(f.estimatedTokens / 1000)}k`
                    : f.estimatedTokens}
                </Box>
              </Box>
              {primaryPath === f.relativePath && (
                <Chip
                  size="small"
                  label={copy.ai.page.roleSyncPrimary}
                  color="primary"
                  variant="outlined"
                  sx={{ height: 18, "& .MuiChip-label": { px: 0.6, fontSize: 9 } }}
                />
              )}
            </Stack>
          </ListItemButton>
        </Tooltip>
      ))}
    </>
  );
}

export type AgentFileSection = {
  id: string;
  label: string;
  files: InstructionFile[];
  primaryPath?: string | null;
};

export function AgentFileList({
  sections,
  flaggedPaths,
  selected,
  onSelect,
}: {
  sections: AgentFileSection[];
  flaggedPaths: Set<string>;
  selected: string | null;
  onSelect: (path: string) => void;
}) {
  const total = sections.reduce((n, s) => n + s.files.length, 0);

  return (
    <List dense disablePadding sx={{ py: 0 }}>
      {sections.map((section, idx) => (
        <Box key={section.id} sx={{ mb: idx < sections.length - 1 ? 1 : 0 }}>
          {section.label ? (
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ alignItems: "center", px: 0.75, py: 0.35, opacity: 0.92 }}
            >
              {section.id === "rolesync" && (
                <AccountTreeOutlinedIcon sx={{ fontSize: 13, color: "primary.main" }} />
              )}
              <Typography
                variant="caption"
                color={section.id === "rolesync" ? "primary.main" : "text.secondary"}
                sx={{ fontWeight: 700, fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}
              >
                {section.label}
              </Typography>
            </Stack>
          ) : null}
          <FileRows
            files={section.files}
            flaggedPaths={flaggedPaths}
            selected={selected}
            primaryPath={section.primaryPath}
            onSelect={onSelect}
          />
        </Box>
      ))}
      {total === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 1 }}>
          —
        </Typography>
      )}
    </List>
  );
}

export function agentFileSecondary(scope: string) {
  return LOAD_SCOPE_LABELS[scope] ?? scope;
}