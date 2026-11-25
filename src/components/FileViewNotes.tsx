import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { copy } from "../content/uiCopy";
import type { LineFlag } from "../types/scan";

export function fileHighlightLines(flags: LineFlag[]): Set<number> {
  return new Set(flags.filter((f) => f.kind === "line" && f.line > 0).map((f) => f.line));
}

export function FileViewNotes({ flags }: { flags: LineFlag[] }) {
  if (!flags.length) return null;

  const fileNote = flags.find((f) => f.kind === "file" || f.line === 0);
  const lineNotes = flags.filter((f) => f.kind === "line" && f.line > 0);

  return (
    <Paper
      sx={{
        mb: 1.5,
        p: 2,
        borderLeft: 4,
        borderColor: fileNote ? "warning.main" : "info.main",
        bgcolor: alpha("#fbbf24", 0.06),
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
        {copy.explorer.notesTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 1.5 }}>
        {copy.explorer.notesIntro}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.75, mb: lineNotes.length ? 1 : 0 }}>
        {fileNote && (
          <Chip size="small" color="warning" variant="outlined" label={copy.explorer.chipHeavyFile} />
        )}
        {lineNotes.length > 0 && (
          <Chip
            size="small"
            variant="outlined"
            label={copy.explorer.chipLongLines(lineNotes.length)}
          />
        )}
      </Stack>

      {fileNote && (
        <Typography variant="body2" sx={{ lineHeight: 1.55, mb: lineNotes.length ? 1.5 : 0 }}>
          {fileNote.reason}
        </Typography>
      )}

      {lineNotes.length > 0 && (
        <Accordion
          disableGutters
          elevation={0}
          sx={{
            bgcolor: "transparent",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, minHeight: 40 }}>
            <Typography variant="body2" color="text.secondary">
              {copy.explorer.longLinesSummary(lineNotes.length)}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, pt: 0 }}>
            <Stack spacing={0.75}>
              {lineNotes.map((f) => (
                <Typography
                  key={`${f.line}-${f.severity}`}
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "text.secondary",
                    lineHeight: 1.5,
                  }}
                >
                  {copy.explorer.jumpToLine(f.line)} — {lineCharsFromReason(f.reason)}
                </Typography>
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.25, lineHeight: 1.5 }}>
              {copy.explorer.longLinesHint}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
}

function lineCharsFromReason(reason: string): string {
  const m = reason.match(/(\d+)\s+characters/);
  if (m) return `${m[1]} characters`;
  return reason;
}