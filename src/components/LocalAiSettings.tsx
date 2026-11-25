import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { copy } from "../content/uiCopy";
import type { AiSettings, OllamaModel } from "../types/scan";

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  const gb = bytes / 1_000_000_000;
  if (gb >= 1) return ` · ${gb.toFixed(1)} GB`;
  const mb = bytes / 1_000_000;
  return ` · ${mb.toFixed(0)} MB`;
}

export function LocalAiSettings() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);

  const load = useCallback(async () => {
    const s = await invoke<AiSettings>("get_ai_settings");
    setSettings(s);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!settings) {
    return (
      <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
        Loading…
      </Typography>
    );
  }

  const save = async () => {
    await invoke("set_ai_settings", { settings });
    setStatus(copy.ai.settingsSaved);
  };

  const test = async () => {
    setError(null);
    setStatus(null);
    try {
      const msg = await invoke<string>("test_local_ai", { settings });
      setStatus(msg);
    } catch (e) {
      setError(String(e));
    }
  };

  const refreshModels = async () => {
    setLoadingModels(true);
    setError(null);
    try {
      const list = await invoke<OllamaModel[]>("list_local_models", { settings });
      setModels(list);
      setStatus(copy.ai.modelsLoaded(list.length));
      if (list.length > 0 && !list.some((m) => m.name === settings.model)) {
        setSettings({ ...settings, model: list[0].name });
      }
    } catch (e) {
      setError(String(e));
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const isOllama = settings.apiStyle === "ollama";

  return (
    <Stack spacing={2} sx={{ mt: 3, pt: 3, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <Typography variant="h6">{copy.ai.sectionTitle}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
        {copy.ai.sectionIntro}
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
          />
        }
        label={copy.ai.enabled}
      />
      <TextField
        label={copy.ai.endpoint}
        fullWidth
        value={settings.endpoint}
        onChange={(e) => setSettings({ ...settings, endpoint: e.target.value })}
      />
      <FormControl fullWidth>
        <InputLabel id="api-style-label">API</InputLabel>
        <Select
          labelId="api-style-label"
          label="API"
          value={settings.apiStyle}
          onChange={(e) => {
            const apiStyle = e.target.value as AiSettings["apiStyle"];
            setSettings({ ...settings, apiStyle });
            setModels([]);
          }}
        >
          <MenuItem value="ollama">{copy.ai.apiOllama}</MenuItem>
          <MenuItem value="openai">{copy.ai.apiOpenAi}</MenuItem>
        </Select>
      </FormControl>

      {isOllama ? (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Button variant="outlined" disabled={loadingModels} onClick={() => void refreshModels()}>
              {loadingModels ? copy.ai.loadingModels : copy.ai.refreshModels}
            </Button>
            <Typography variant="caption" color="text.secondary">
              {copy.ai.ollamaModelHint}
            </Typography>
          </Stack>
          {models.length > 0 ? (
            <FormControl fullWidth>
              <InputLabel id="ollama-model-label">{copy.ai.model}</InputLabel>
              <Select
                labelId="ollama-model-label"
                label={copy.ai.model}
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              >
                {models.map((m) => (
                  <MenuItem key={m.name} value={m.name}>
                    {m.name}
                    {formatSize(m.sizeBytes)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              label={copy.ai.model}
              fullWidth
              placeholder="qwen3:8b"
              helperText={copy.ai.modelManualHint}
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            />
          )}
        </Stack>
      ) : (
        <TextField
          label={copy.ai.model}
          fullWidth
          placeholder="local-model-id"
          value={settings.model}
          onChange={(e) => setSettings({ ...settings, model: e.target.value })}
        />
      )}

      <Stack direction="row" spacing={1}>
        <Button variant="contained" onClick={() => void save()}>
          Save
        </Button>
        <Button variant="outlined" onClick={() => void test()}>
          {copy.ai.test}
        </Button>
      </Stack>
      {status && (
        <Typography variant="body2" color="success.main">
          {status}
        </Typography>
      )}
      {error && (
        <Typography variant="body2" color="error" sx={{ whiteSpace: "pre-line", lineHeight: 1.55 }}>
          {error}
        </Typography>
      )}
    </Stack>
  );
}