import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { copy } from "../content/uiCopy";
import type { ChangeStats } from "../utils/diffStats";

export function ApplyChangesDialog({
  open,
  relativePath,
  loadScope,
  alwaysOn,
  stats,
  saving,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  relativePath: string;
  loadScope: string;
  alwaysOn: boolean;
  stats: ChangeStats;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const perCall =
    alwaysOn || loadScope === "always_on"
      ? copy.ai.confirm.savingsEveryChat(stats.tokenDelta)
      : copy.ai.confirm.savingsWhenLoaded(stats.tokenDelta);

  return (
    <Dialog open={open} onClose={saving ? undefined : onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningAmberOutlinedIcon color="warning" />
        {copy.ai.confirm.title}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
            {copy.ai.confirm.body(stats.changeCount, relativePath)}
          </Typography>

          <List dense disablePadding>
            <ListItem disablePadding sx={{ py: 0.25 }}>
              <ListItemText
                primary={copy.ai.confirm.linesRemoved(stats.linesRemoved)}
                secondary={copy.ai.confirm.linesRemovedHint}
              />
            </ListItem>
            <ListItem disablePadding sx={{ py: 0.25 }}>
              <ListItemText
                primary={copy.ai.confirm.linesAdded(stats.linesAdded)}
                secondary={copy.ai.confirm.linesAddedHint}
              />
            </ListItem>
            <ListItem disablePadding sx={{ py: 0.25 }}>
              <ListItemText primary={copy.ai.confirm.hunks(stats.hunks)} />
            </ListItem>
          </List>

          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {copy.ai.confirm.tokens(stats.tokensBefore, stats.tokensAfter, stats.tokenDelta)}
          </Typography>
          {stats.tokenDelta > 0 && (
            <Typography variant="body2" color="success.light" sx={{ lineHeight: 1.6 }}>
              {perCall}
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {copy.ai.confirm.backupNote}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={saving} onClick={onCancel}>
          {copy.ai.cancel}
        </Button>
        <Button variant="contained" color="warning" disabled={saving} onClick={onConfirm}>
          {saving ? copy.ai.saving : copy.ai.confirm.confirm(stats.changeCount)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}