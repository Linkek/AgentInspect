import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { DuplicateGroup } from "../types/scan";

export function DuplicatesPanel({ groups }: { groups: DuplicateGroup[] }) {
  if (!groups.length) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Duplicates
        </Typography>
        <Typography color="text.secondary">
          No exact or near-duplicate instruction bodies detected.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Duplicates ({groups.length})
      </Typography>
      <Stack spacing={2}>
        {groups.map((g) => (
          <Paper key={g.hash} variant="outlined" sx={{ p: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: "center" }}>
              <Chip
                size="small"
                label={g.normalized ? "Near-duplicate" : "Exact duplicate"}
                color={g.normalized ? "warning" : "error"}
              />
              <Typography variant="body2" color="text.secondary">
                ~{g.estimatedTokens.toLocaleString()} tokens × {g.paths.length}{" "}
                copies
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              {g.paths.map((p) => (
                <Typography
                  key={p}
                  variant="body2"
                  sx={{ fontFamily: "monospace", fontSize: 12 }}
                >
                  {p}
                </Typography>
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
}