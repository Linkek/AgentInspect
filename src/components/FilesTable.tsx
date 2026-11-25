import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import {
  LOAD_SCOPE_LABELS,
  PLATFORM_LABELS,
  type InstructionFile,
} from "../types/scan";

type SortKey =
  | "relativePath"
  | "platform"
  | "kind"
  | "loadScope"
  | "estimatedTokens"
  | "chars";

export function FilesTable({ files }: { files: InstructionFile[] }) {
  const [orderBy, setOrderBy] = useState<SortKey>("estimatedTokens");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...files];
    copy.sort((a, b) => {
      const av = a[orderBy];
      const bv = b[orderBy];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return order === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [files, order, orderBy]);

  const handleSort = (key: SortKey) => {
    if (orderBy === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(key);
      setOrder("desc");
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        All discovered files
      </Typography>
      <TableContainer sx={{ maxHeight: 420 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {(
                [
                  ["relativePath", "Path"],
                  ["platform", "Platform"],
                  ["kind", "Kind"],
                  ["loadScope", "Load scope"],
                  ["estimatedTokens", "Tokens"],
                  ["chars", "Chars"],
                ] as const
              ).map(([key, label]) => (
                <TableCell key={key}>
                  <TableSortLabel
                    active={orderBy === key}
                    direction={orderBy === key ? order : "asc"}
                    onClick={() => handleSort(key)}
                  >
                    {label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((f) => {
              const bloated = f.estimatedTokens >= 2000;
              return (
                <TableRow
                  key={f.path}
                  sx={bloated ? { bgcolor: "rgba(248,113,113,0.08)" } : undefined}
                >
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                    {f.relativePath}
                  </TableCell>
                  <TableCell>{PLATFORM_LABELS[f.platform] ?? f.platform}</TableCell>
                  <TableCell>{f.kind}</TableCell>
                  <TableCell>
                    {LOAD_SCOPE_LABELS[f.loadScope] ?? f.loadScope}
                  </TableCell>
                  <TableCell align="right">
                    {f.estimatedTokens.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">{f.chars.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}