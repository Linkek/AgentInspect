export type DiffKind = "same" | "add" | "remove";

export interface DiffRow {
  kind: DiffKind;
  text: string;
  /** 1-based line in original file, when relevant */
  oldLine?: number;
  /** 1-based line in draft file, when relevant */
  newLine?: number;
}

export interface ChangeStats {
  linesAdded: number;
  linesRemoved: number;
  linesUnchanged: number;
  /** Added + removed lines — what we show as “N changes” */
  changeCount: number;
  hunks: number;
  tokensBefore: number;
  tokensAfter: number;
  tokenDelta: number;
}

export function estimateTokens(text: string): number {
  const chars = text.length;
  return Math.floor((chars + 3) / 4);
}

/** Longest-common-subsequence line diff (git-style, readable). */
export function computeLineDiff(before: string, after: string): DiffRow[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  let oldLine = 1;
  let newLine = 1;

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ kind: "same", text: a[i], oldLine, newLine });
      i++;
      j++;
      oldLine++;
      newLine++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ kind: "remove", text: a[i], oldLine });
      i++;
      oldLine++;
    } else {
      rows.push({ kind: "add", text: b[j], newLine });
      j++;
      newLine++;
    }
  }
  while (i < n) {
    rows.push({ kind: "remove", text: a[i], oldLine });
    i++;
    oldLine++;
  }
  while (j < m) {
    rows.push({ kind: "add", text: b[j], newLine });
    j++;
    newLine++;
  }
  return rows;
}

export function computeChangeStats(before: string, after: string): ChangeStats & { rows: DiffRow[] } {
  const rows = computeLineDiff(before, after);
  let linesAdded = 0;
  let linesRemoved = 0;
  let linesUnchanged = 0;
  let hunks = 0;
  let inHunk = false;

  for (const row of rows) {
    if (row.kind === "add") linesAdded++;
    else if (row.kind === "remove") linesRemoved++;
    else linesUnchanged++;

    const changed = row.kind !== "same";
    if (changed && !inHunk) {
      hunks++;
      inHunk = true;
    } else if (!changed) {
      inHunk = false;
    }
  }

  const tokensBefore = estimateTokens(before);
  const tokensAfter = estimateTokens(after);

  return {
    rows,
    linesAdded,
    linesRemoved,
    linesUnchanged,
    changeCount: linesAdded + linesRemoved,
    hunks,
    tokensBefore,
    tokensAfter,
    tokenDelta: tokensBefore - tokensAfter,
  };
}

/** Keep changes plus `context` unchanged lines around each hunk. */
export function filterDiffWithContext(rows: DiffRow[], context = 2): DiffRow[] {
  const changed = new Set<number>();
  rows.forEach((row, idx) => {
    if (row.kind !== "same") {
      for (let k = Math.max(0, idx - context); k <= Math.min(rows.length - 1, idx + context); k++) {
        changed.add(k);
      }
    }
  });
  const out: DiffRow[] = [];
  let lastKept = -2;
  for (let idx = 0; idx < rows.length; idx++) {
    if (!changed.has(idx)) continue;
    if (lastKept >= 0 && idx - lastKept > 1) {
      out.push({ kind: "same", text: "…" });
    }
    out.push(rows[idx]);
    lastKept = idx;
  }
  return out;
}