import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { copy } from "../content/uiCopy";
import { APP_SCROLL_CLASS } from "../themeScrollbars";
import type { AgentChatTurn } from "../types/scan";

function shortenPath(path: string): string {
  const parts = path.split("/");
  if (parts.length <= 2) return path;
  const tail = parts.slice(-2).join("/");
  return parts.length > 2 ? `…/${tail}` : tail;
}

function SendFab({
  disabled,
  loading,
  onClick,
  ariaLabel,
  children,
}: {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={ariaLabel}>
      <span>
        <IconButton
          disabled={disabled || loading}
          onClick={onClick}
          aria-label={ariaLabel}
          sx={{
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: "50%",
            bgcolor: disabled ? alpha("#64748b", 0.35) : "primary.main",
            color: disabled ? alpha("#f1f5f9", 0.45) : "#0a0d11",
            border: `1px solid ${alpha(disabled ? "#fff" : "#5eead4", disabled ? 0.06 : 0.35)}`,
            boxShadow: disabled ? "none" : `0 0 0 1px ${alpha("#5eead4", 0.2)}`,
            transition: "background-color 0.15s, transform 0.1s",
            "&:hover:not(:disabled)": {
              bgcolor: "primary.dark",
              transform: "translateY(-1px)",
            },
            "&.Mui-disabled": {
              bgcolor: alpha("#64748b", 0.28),
            },
          }}
        >
          {loading ? <CircularProgress size={18} sx={{ color: "inherit" }} /> : children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function FloatingAgentComposer({
  relativePath,
  modelLabel,
  hasDraft,
  aiReady,
  chatTurns,
  input,
  loading,
  disabledSave,
  onInput,
  onSend,
  onGenerateDraft,
  draftLoading,
}: {
  relativePath: string | null;
  modelLabel?: string;
  hasDraft: boolean;
  aiReady: boolean;
  chatTurns: AgentChatTurn[];
  input: string;
  loading: boolean;
  disabledSave?: boolean;
  onInput: (v: string) => void;
  onSend: () => void;
  onGenerateDraft?: () => void;
  draftLoading?: boolean;
}) {
  const [historyOpen, setHistoryOpen] = useState(chatTurns.length > 0);

  useEffect(() => {
    if (chatTurns.length > 0) setHistoryOpen(true);
  }, [chatTurns.length]);

  const canSend = hasDraft && aiReady && !loading && !disabledSave && input.trim().length > 0;
  const inputDisabled = !hasDraft || !aiReady || loading || disabledSave;
  const shellRadius = 1;

  return (
    <Box
      sx={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        px: { xs: 0.75, sm: 1.25 },
        pb: 0.75,
        pointerEvents: "none",
        "& > *": { pointerEvents: "auto" },
      }}
    >
      <Collapse in={historyOpen && chatTurns.length > 0}>
        <Paper
          className={APP_SCROLL_CLASS}
          elevation={0}
          sx={{
            mb: 0.75,
            maxHeight: 200,
            overflow: "auto",
            p: 1.25,
            borderRadius: shellRadius,
            bgcolor: alpha("#0e1218", 0.97),
            backdropFilter: "blur(12px)",
            border: `1px solid ${alpha("#fff", 0.08)}`,
            boxShadow: `0 -8px 24px ${alpha("#000", 0.35)}`,
          }}
        >
          <Stack spacing={1}>
            {chatTurns.map((turn, idx) => (
              <Box
                key={`${idx}-${turn.role}`}
                sx={{
                  alignSelf: turn.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "92%",
                  px: 1.25,
                  py: 0.85,
                  borderRadius: shellRadius,
                  bgcolor:
                    turn.role === "user" ? alpha("#5eead4", 0.12) : alpha("#fff", 0.04),
                  border: `1px solid ${alpha("#fff", turn.role === "user" ? 0.08 : 0.06)}`,
                }}
              >
                <Typography
                  variant="caption"
                  color={turn.role === "user" ? "primary.light" : "text.secondary"}
                  sx={{ fontWeight: 700, fontSize: 10, letterSpacing: "0.04em", mb: 0.25 }}
                >
                  {turn.role === "user" ? copy.ai.chatYou : copy.ai.chatAgent}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: 13, color: "text.primary" }}
                >
                  {turn.text}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Collapse>

      <Paper
        elevation={0}
        sx={{
          borderRadius: shellRadius,
          p: 1,
          bgcolor: alpha("#10151c", 0.97),
          backdropFilter: "blur(16px)",
          border: `1px solid ${alpha("#fff", 0.1)}`,
          boxShadow: `0 8px 32px ${alpha("#000", 0.5)}, 0 0 0 1px ${alpha("#5eead4", 0.06)}`,
        }}
      >
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: "center", justifyContent: "space-between", mb: 0.75, px: 0.25 }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ flex: 1, fontFamily: "monospace", fontSize: 10.5, opacity: 0.9 }}
          >
            {relativePath ? shortenPath(relativePath) : copy.ai.page.selectPrompt}
            {modelLabel ? (
              <Box component="span" sx={{ color: alpha("#94a3b8", 0.85) }}>
                {" "}
                · {modelLabel}
              </Box>
            ) : null}
          </Typography>
          {chatTurns.length > 0 && (
            <IconButton
              size="small"
              onClick={() => setHistoryOpen((o) => !o)}
              aria-label="Toggle chat history"
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                border: `1px solid ${alpha("#fff", 0.08)}`,
              }}
            >
              {historyOpen ? <ExpandMoreIcon sx={{ fontSize: 18 }} /> : <ExpandLessIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          )}
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "flex-end",
            p: 0.75,
            borderRadius: shellRadius,
            bgcolor: alpha("#000", 0.22),
            border: `1px solid ${alpha("#fff", 0.07)}`,
            "&:focus-within": {
              borderColor: alpha("#5eead4", 0.35),
              boxShadow: `0 0 0 1px ${alpha("#5eead4", 0.15)}`,
            },
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={6}
            minRows={1}
            variant="standard"
            placeholder={hasDraft ? copy.ai.chatPlaceholder : copy.ai.page.composerNoDraft}
            value={input}
            disabled={inputDisabled}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (canSend) onSend();
              }
            }}
            slotProps={{
              input: {
                disableUnderline: true,
                sx: {
                  fontSize: 14,
                  lineHeight: 1.55,
                  py: 0.35,
                  px: 0.5,
                  "& textarea::placeholder": {
                    color: alpha("#94a3b8", 0.75),
                    opacity: 1,
                  },
                },
              },
            }}
          />

          {!hasDraft && onGenerateDraft ? (
            <SendFab
              disabled={!aiReady}
              loading={!!draftLoading}
              onClick={onGenerateDraft}
              ariaLabel={copy.ai.page.startDraft}
            >
              <AutoFixHighOutlinedIcon sx={{ fontSize: 20 }} />
            </SendFab>
          ) : (
            <SendFab disabled={!canSend} loading={loading} onClick={onSend} ariaLabel={copy.ai.chatSend}>
              <ArrowUpwardIcon sx={{ fontSize: 20 }} />
            </SendFab>
          )}
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.65, px: 0.5, fontSize: 10.5, opacity: 0.85 }}
        >
          {copy.ai.page.composerHint}
        </Typography>
      </Paper>
    </Box>
  );
}