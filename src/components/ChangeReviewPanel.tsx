import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { copy } from "../content/uiCopy";
import {
  computeChangeStats,
  filterDiffWithContext,
  type DiffRow,
} from "../utils/diffStats";

function rowStyle(kind: DiffRow["kind"]) {
  if (kind === "add") {
    return {
      bgcolor: alpha("#34d399", 0.14),
      borderColor: "#34d399",
      label: copy.ai.diff.willAdd,
    };
  }
  if (kind === "remove") {
    return {
      bgcolor: alpha("#f87171", 0.16),
      borderColor: "#f87171",
      label: copy.ai.diff.willRemove,
    };
  }
  return {
    bgcolor: "transparent",
    borderColor: "transparent",
    label: "",
  };
}

export function ChangeReviewPanel({
  before,
  after,
  codeFontSize = 12,
}: {
  before: string;
  after: string;
  codeFontSize?: number;
}) {
  const [onlyChanges, setOnlyChanges] = useState(true);

  const stats = useMemo(() => computeChangeStats(before, after), [before, after]);

  const displayRows = useMemo(() => {
    if (!onlyChanges) return stats.rows;
    if (stats.changeCount === 0) return stats.rows;
    return filterDiffWithContext(stats.rows, 2);
  }, [onlyChanges, stats]);

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
        <Chip
          size="small"
          color="error"
          variant="outlined"
          label={copy.ai.diff.removed(stats.linesRemoved)}
        />
        <Chip
          size="small"
          color="success"
          variant="outlined"
          label={copy.ai.diff.added(stats.linesAdded)}
        />
        <Chip
          size="small"
          variant="outlined"
          label={copy.ai.diff.hunks(stats.hunks)}
        />
        <Chip
          size="small"
          variant="outlined"
          label={copy.ai.diff.tokens(stats.tokensBefore, stats.tokensAfter, stats.tokenDelta)}
        />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
        {copy.ai.diff.legend}
      </Typography>

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={onlyChanges}
            onChange={(e) => setOnlyChanges(e.target.checked)}
          />
        }
        label={copy.ai.diff.onlyChanges}
      />

      {stats.changeCount === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {copy.ai.diff.noChanges}
        </Typography>
      ) : (
        <Box
          sx={{
            borderRadius: 1.5,
            border: `1px solid ${alpha("#fff", 0.08)}`,
            fontFamily: "monospace",
            fontSize: codeFontSize,
            lineHeight: 1.45,
          }}
        >
          {displayRows.map((row, idx) => {
            const s = rowStyle(row.kind);
            const lineRef =
              row.kind === "remove"
                ? row.oldLine
                : row.kind === "add"
                  ? row.newLine
                  : row.oldLine;
            const isEllipsis = row.text === "…";
            return (
              <Stack
                key={`${idx}-${row.kind}-${lineRef ?? idx}`}
                direction="row"
                spacing={1}
                sx={{
                  px: 1,
                  py: 0.35,
                  bgcolor: s.bgcolor,
                  borderLeft: `3px solid ${s.borderColor}`,
                  opacity: isEllipsis ? 0.6 : 1,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    width: Math.max(48, codeFontSize * 3.8),
                    fontSize: codeFontSize * 0.85,
                    color: "text.secondary",
                    flexShrink: 0,
                    userSelect: "none",
                  }}
                >
                  {isEllipsis
                    ? "…"
                    : row.kind === "remove"
                      ? `−${lineRef ?? ""}`
                      : row.kind === "add"
                        ? `+${lineRef ?? ""}`
                        : " "}
                </Typography>
                <Typography
                  component="pre"
                  sx={{
                    m: 0,
                    fontFamily: "inherit",
                    fontSize: codeFontSize,
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                    textDecoration: row.kind === "remove" ? "line-through" : "none",
                  }}
                >
                  {row.text || " "}
                </Typography>
              </Stack>
            );
          })}
        </Box>
      )}
    </Stack>
  );
}

export function useChangeStats(before: string, after: string) {
  return useMemo(() => computeChangeStats(before, after), [before, after]);
}