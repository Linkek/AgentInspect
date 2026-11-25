import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LocalAiSettings } from "../components/LocalAiSettings";
import { copy } from "../content/uiCopy";
import type { ProfileRef, ScoringLimitsResponse } from "../types/scan";

export function SettingsPage({
  onProfileSaved,
}: {
  onProfileSaved: (resp: ScoringLimitsResponse) => void;
}) {
  const [data, setData] = useState<ScoringLimitsResponse | null>(null);
  const [providerId, setProviderId] = useState("");
  const [modelId, setModelId] = useState("");

  const load = useCallback(async () => {
    const resp = await invoke<ScoringLimitsResponse>("get_scoring_limits", { profile: null });
    setData(resp);
    setProviderId(resp.activeProfile.providerId);
    setModelId(resp.activeProfile.modelId);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const modelOptions = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.limits.providers[providerId]?.models ?? {});
  }, [data, providerId]);

  if (!data) {
    return (
      <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
        Loading scoring limits…
      </Typography>
    );
  }

  const save = async () => {
    const profile: ProfileRef = { providerId, modelId };
    const resp = await invoke<ScoringLimitsResponse>("set_scoring_profile", { profile });
    setData(resp);
    onProfileSaved(resp);
  };

  const reset = async () => {
    const resp = await invoke<ScoringLimitsResponse>("reset_scoring_limits");
    setData(resp);
    setProviderId(resp.activeProfile.providerId);
    setModelId(resp.activeProfile.modelId);
    onProfileSaved(resp);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 640 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.65 }}>
        {copy.settings.intro}
      </Typography>
      <Stack spacing={2}>
        <FormControl fullWidth size="medium">
          <InputLabel id="provider-label">Provider</InputLabel>
          <Select
            labelId="provider-label"
            label="Provider"
            value={providerId}
            onChange={(e) => {
              const next = e.target.value;
              setProviderId(next);
              const first = Object.keys(data.limits.providers[next]?.models ?? {})[0];
              if (first) setModelId(first);
            }}
          >
            {Object.entries(data.limits.providers).map(([id, p]) => (
              <MenuItem key={id} value={id}>
                {p.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="medium">
          <InputLabel id="model-label">Model</InputLabel>
          <Select
            labelId="model-label"
            label="Model"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          >
            {modelOptions.map(([id, m]) => (
              <MenuItem key={id} value={id}>
                {m.label} ({m.contextWindowTokens.toLocaleString()} ctx)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
          {copy.settings.budgetLine(
            data.budgets.totalInstructionsBudgetTokens.toLocaleString(),
            data.budgets.alwaysOnBudgetTokens.toLocaleString(),
            data.budgets.maxSingleFileTokens.toLocaleString(),
          )}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={() => void save()}>
            Save profile
          </Button>
          <Button variant="outlined" onClick={() => void reset()}>
            Reset to bundled defaults
          </Button>
        </Stack>
      </Stack>
      <LocalAiSettings />
    </Paper>
  );
}