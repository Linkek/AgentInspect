import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScanReport } from "../types/scan";

const COLORS = [
  "#6ee7ff",
  "#c4b5fd",
  "#fbbf24",
  "#34d399",
  "#f87171",
  "#a78bfa",
  "#60a5fa",
  "#fb7185",
];

const KIND_LABELS: Record<string, string> = {
  rule: "Rules",
  skill: "Skills",
  agents: "Agents index",
  mcp: "MCP",
  "mcp-config": "MCP config",
  copilot: "Copilot",
  hooks: "Hooks",
  other: "Other",
};

export function ChartsPanel({ scan }: { scan: ScanReport }) {
  const platformData = Object.entries(scan.byPlatform)
    .map(([key, stats]) => ({
      name: key,
      key,
      tokens: stats.estimatedTokens,
      files: stats.files,
    }))
    .sort((a, b) => b.tokens - a.tokens);

  const kindData = Object.entries(scan.byKind)
    .map(([key, count]) => ({
      name: KIND_LABELS[key] ?? key,
      key,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const largestData = scan.largestFiles.slice(0, 10).map((f) => ({
    name: f.relativePath.length > 36 ? `…${f.relativePath.slice(-34)}` : f.relativePath,
    fullPath: f.relativePath,
    tokens: f.estimatedTokens,
  }));

  const showPlatformPie = platformData.length > 1;

  return (
    <Paper sx={{ p: 2.5, mt: 2 }}>
      {showPlatformPie ? (
        <>
          <Typography variant="h6" gutterBottom>
            Tokens by platform
          </Typography>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={platformData}
                dataKey="tokens"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {platformData.map((_, i) => (
                  <Cell key={platformData[i].key} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  `${Number(value ?? 0).toLocaleString()} est. tokens`
                }
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            Files by type
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={kindData} margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6ee7ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Largest files
      </Typography>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={largestData} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) =>
              `${Number(value ?? 0).toLocaleString()} tokens`
            }
            labelFormatter={(_, payload) =>
              String(
                (payload?.[0]?.payload as { fullPath?: string } | undefined)
                  ?.fullPath ?? "",
              )
            }
          />
          <Bar dataKey="tokens" fill="#6ee7ff" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}