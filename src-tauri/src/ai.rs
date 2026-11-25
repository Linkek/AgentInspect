use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::Duration;

const DEFAULT_ENDPOINT: &str = "http://127.0.0.1:11434";
/// Default only when no settings file exists — user should pick via Settings → Load Ollama models.
const DEFAULT_MODEL: &str = "llama3.2:3b";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiSettings {
    pub enabled: bool,
    pub endpoint: String,
    pub model: String,
    #[serde(default = "default_api_style")]
    pub api_style: String,
}

fn default_api_style() -> String {
    "ollama".into()
}

impl Default for AiSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            endpoint: DEFAULT_ENDPOINT.into(),
            model: DEFAULT_MODEL.into(),
            api_style: default_api_style(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImprovementSuggestion {
    pub relative_path: String,
    pub platform: String,
    pub original: String,
    pub suggested: String,
    pub rationale: String,
    pub estimated_tokens_before: usize,
    pub estimated_tokens_after: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OllamaModel {
    pub name: String,
    pub size_bytes: Option<u64>,
}

fn settings_dir() -> Result<PathBuf, String> {
    let base = dirs::data_local_dir().ok_or("Could not resolve app data directory")?;
    let dir = base.join("agentinspect");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn settings_path() -> Result<PathBuf, String> {
    Ok(settings_dir()?.join("ai-settings.json"))
}

pub fn load_ai_settings() -> AiSettings {
    let Ok(path) = settings_path() else {
        return AiSettings::default();
    };
    let Ok(raw) = fs::read_to_string(path) else {
        return AiSettings::default();
    };
    serde_json::from_str(&raw).unwrap_or_default()
}

pub fn save_ai_settings(settings: &AiSettings) -> Result<(), String> {
    let path = settings_path()?;
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

fn estimate_tokens(chars: usize) -> usize {
    (chars + 3) / 4
}

fn extract_assistant_text(body: &str) -> Result<String, String> {
    let v: serde_json::Value = serde_json::from_str(body).map_err(|e| e.to_string())?;
    if let Some(content) = v
        .pointer("/message/content")
        .and_then(|c| c.as_str())
        .or_else(|| v.pointer("/choices/0/message/content").and_then(|c| c.as_str()))
    {
        return Ok(content.to_string());
    }
    Err("LLM response missing content".into())
}

fn unwrap_code_fence(text: &str) -> String {
    let trimmed = text.trim();
    if let Some(rest) = trimmed.strip_prefix("```") {
        let body = rest.trim_start_matches(['m', 'd', 'a', 'r', 'k', 'd', 'o', 'w', 'n', '\n']);
        if let Some(end) = body.rfind("```") {
            return body[..end].trim().to_string();
        }
    }
    trimmed.to_string()
}

const SYSTEM_PROMPT: &str = r#"You are a senior editor for IDE and coding-agent instruction files (Cursor rules, AGENTS.md, CLAUDE.md, Copilot instructions, RoleSync .agents roles/skills, skills with frontmatter).

Your job is token-efficient rewriting: remove redundancy and fluff while preserving every behavior the agent must still follow.

## Non-negotiable — keep unless the user explicitly asks to remove
- YAML frontmatter and activation fields (globs, alwaysApply, description, paths, tags) — exact keys unless optimizing redundant prose below the frontmatter only.
- Hard constraints: NEVER / MUST / REQUIRED / do not / safety / secrets / git destructive commands / production safeguards.
- Tool and CLI names, package managers, and repo-specific conventions (e.g. pnpm-only, test commands).
- Skill triggers: name, description, when-to-use, and steps that define *when* the skill fires.
- Conditional workflows (if/when/unless chains that change agent behavior).
- Links or paths that are the sole authority for a rule (you may shorten prose around them, not delete the link/path).

## Safe to compress
- Repeated rules stated in multiple sections (merge into one bullet block; do not drop the rule).
- Verbose greetings, motivation, and duplicate examples.
- Paragraphs that restate what a heading already implies — convert to imperative bullets.
- Tutorial prose in skills when the checklist already encodes the procedure (keep one minimal example if needed).

## Anti-patterns — never do these
- Summarize with "..." or "rest unchanged" or omit sections.
- Return a partial file or a diff.
- Weaken a prohibition to save tokens.
- Invent new files, paths, or policies not present in the source.
- Change frontmatter globs/paths to "simplify" without user request.

## Method
1. Classify content: factual (labels), behavioral (must/must-not), conditional (when X do Y).
2. Protect behavioral + conditional text; compress factual narration around it.
3. Prefer backbone style: short in-file triggers; keep pointers to longer docs that already exist in the file.
4. Aim ~15–35% shorter on first pass if the file is bloated; prioritize compliance over arbitrary length targets.

## Output
Return ONLY the complete revised file inside a single markdown fenced code block (```md or ```mdc as appropriate). No commentary outside the fence."#;

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(12))
        .timeout(Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())
}

fn format_request_error(endpoint: &str, err: reqwest::Error) -> String {
    let detail = err.to_string();
    let refused = detail.contains("actively refused")
        || detail.contains("connection refused")
        || detail.contains("10061")
        || err.is_connect();
    if refused {
        return format!(
            "Ollama is not accepting connections at {endpoint} (nothing listening on port 11434).\n\
Open the Ollama app and wait until it shows Ready, or run: ollama serve\n\
In Settings use Test connection. LM Studio users: pick OpenAI-compatible API and set that base URL instead."
        );
    }
    if err.is_timeout() || detail.contains("timed out") {
        return format!(
            "Timed out reaching {endpoint}. The Ollama API often looks \"up\" but is stuck.\n\
Quit Ollama from the system tray (or end ollama.exe in Task Manager), start Ollama again, then Test connection in Settings."
        );
    }
    format!("Could not reach local model at {endpoint}: {detail}")
}

fn format_api_error(status: reqwest::StatusCode, body: &str, settings: &AiSettings) -> String {
    if let Ok(v) = serde_json::from_str::<serde_json::Value>(body) {
        if let Some(err) = v.pointer("/error").and_then(|e| e.as_str()) {
            if err.contains("not found") {
                return format!(
                    "Model \"{}\" is not installed in Ollama.\n{err}\n\nFix: Settings → Load Ollama models → pick a name from the list, or run `ollama pull {}`.",
                    settings.model,
                    settings.model
                );
            }
            return format!("Local model error (HTTP {status}): {err}");
        }
        if let Some(msg) = v.pointer("/message").and_then(|m| m.as_str()) {
            return format!("Local model error (HTTP {status}): {msg}");
        }
    }
    if status == reqwest::StatusCode::NOT_FOUND && settings.api_style == "openai" {
        return format!(
            "HTTP 404 — OpenAI-compatible URL may be wrong. LM Studio is usually http://127.0.0.1:1234/v1 (include /v1). Current: {}",
            settings.endpoint
        );
    }
    if status == reqwest::StatusCode::NOT_FOUND {
        return format!(
            "HTTP 404 — check API type and model \"{}\". Ollama endpoint should be http://127.0.0.1:11434 with API set to Ollama.",
            settings.model
        );
    }
    format!(
        "Local model HTTP {status} — check endpoint, model name, and API type (Ollama vs OpenAI-compatible)."
    )
}

async fn chat_completion(
    settings: &AiSettings,
    messages: Vec<serde_json::Value>,
    temperature: f32,
) -> Result<String, String> {
    if !settings.enabled {
        return Err("Local AI is disabled in settings".into());
    }
    if settings.model.trim().is_empty() {
        return Err(
            "No model selected. Open Settings → Load Ollama models and choose an installed model.".into(),
        );
    }

    let client = http_client()?;

    let body = if settings.api_style == "openai" {
        serde_json::json!({
            "model": settings.model,
            "temperature": temperature,
            "max_tokens": 32768,
            "messages": messages,
        })
    } else {
        serde_json::json!({
            "model": settings.model,
            "stream": false,
            "options": {"temperature": temperature, "num_predict": 32768},
            "messages": messages,
        })
    };

    let url = if settings.api_style == "openai" {
        format!(
            "{}/v1/chat/completions",
            settings.endpoint.trim_end_matches('/')
        )
    } else {
        format!("{}/api/chat", settings.endpoint.trim_end_matches('/'))
    };

    let resp = client
        .post(url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format_request_error(&settings.endpoint, e))?;

    let status = resp.status();
    let raw = resp.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(format_api_error(status, &raw, settings));
    }

    extract_assistant_text(&raw)
}

fn token_rationale(before: usize, after: usize) -> String {
    if after < before {
        format!(
            "~{} → ~{} tokens (about {}% shorter).",
            before,
            after,
            ((before.saturating_sub(after)) as f64 / before.max(1) as f64 * 100.0) as usize
        )
    } else {
        format!("~{} tokens now (was ~{}).", after, before)
    }
}

fn load_scope_guidance(load_scope: &str) -> &'static str {
    match load_scope {
        "always_on" => "This file likely loads on MOST chats — prioritize token savings on examples and repetition, but keep every always-on constraint verbatim in meaning.",
        "path_scoped" => "This file loads when matched paths apply — preserve globs/frontmatter exactly; trim only body duplication.",
        "on_demand" => "Skill or on-demand rule — preserve activation/trigger text and frontmatter; trim long tutorials, not the procedure checklist.",
        "tool_config" => "MCP/tool config — preserve server names, commands, and env semantics; remove comments and duplicate JSON keys descriptions only if meaning is unchanged.",
        "generated" => "Generated mirror — prefer minimal edits; do not restructure unless removing obvious duplication safe for regeneration.",
        "reference" => "Reference/helper doc — shorten prose; keep API names, paths, and code identifiers.",
        _ => "Trim redundancy; preserve behavioral constraints.",
    }
}

fn platform_guidance(platform: &str) -> &'static str {
    match platform {
        "cursor" => "Cursor: respect .mdc/.md rule shape, frontmatter, and globs. Keep rules composable (under ~500 lines guidance).",
        "rolesync" => "RoleSync canonical under .agents/ — this is the source of truth for synced tools; do not mirror content meant for .claude/.codex only.",
        "claude-code" | "claude" => "Claude Code / CLAUDE.md: keep imperative project conventions and safety sections tight but complete.",
        "codex" => "Codex tree: preserve command and sandbox-related constraints.",
        "github-copilot" => "Copilot instructions: concise bullets; preserve repo workflow and PR/commit policies.",
        "windsurf" => "Windsurf rules: preserve rule boundaries and triggers.",
        "continue" => "Continue config/instructions: preserve model/tool references.",
        "mcp" => "MCP: preserve JSON structure and server identity fields.",
        _ => "Preserve platform-specific activation metadata.",
    }
}

fn kind_guidance(kind: &str) -> &'static str {
    match kind {
        "skill" => "Kind=skill: keep SKILL frontmatter, when-to-use, and step order. Compress narrative between steps.",
        "role" => "Kind=role: role identity and responsibilities must remain enforceable; compress background story.",
        "rule" | "cursor-rule" => "Kind=rule: each bullet should be one enforceable instruction; merge duplicates.",
        "agents-md" | "agents" => "Kind=agents index: keep short pointers and ownership; avoid duplicating child docs.",
        "mcp-config" => "Kind=MCP config: valid JSON and server commands are sacred.",
        _ => "",
    }
}

fn build_initial_prompt(
    platform: &str,
    relative_path: &str,
    load_scope: &str,
    file_kind: &str,
    issues: &[String],
    original: &str,
) -> String {
    let issue_block = if issues.is_empty() {
        "No specific scanner issues — still apply redundancy removal and clarity pass.".into()
    } else {
        format!("- {}", issues.join("\n- "))
    };
    let kind_line = if file_kind.is_empty() {
        String::new()
    } else {
        format!("File kind: {file_kind}\n{}\n", kind_guidance(file_kind))
    };
    format!(
        r#"## Task
Produce an improved version of this instruction file for platform "{platform}".

## Context
Path: {relative_path}
Load scope: {load_scope}
{load_scope_guidance}
Platform notes: {platform_guidance}
{kind_line}
## Scanner notes (address where safe; never delete constraints to fix a note)
{issue_block}

## First-pass checklist (do internally; output only the file)
1. Mark behavioral/conditional blocks — do not delete or soften.
2. Merge duplicate bullets; one example per rule where possible.
3. Shorten always-on narration if load scope is always_on.
4. Keep frontmatter and activation fields valid.

## Original file
```
{original}
```"#,
        load_scope_guidance = load_scope_guidance(load_scope),
        platform_guidance = platform_guidance(platform),
    )
}

fn build_refine_prompt(
    platform: &str,
    relative_path: &str,
    baseline_original: &str,
    current_draft: &str,
    prior_feedback: &[String],
    user_message: &str,
) -> String {
    let mut prior = String::new();
    if !prior_feedback.is_empty() {
        prior.push_str("Earlier user requests in this session:\n");
        for (i, line) in prior_feedback.iter().enumerate() {
            prior.push_str(&format!("{}. {line}\n", i + 1));
        }
        prior.push('\n');
    }
    format!(
        r#"## Task
Revise the current draft of this {platform} instruction file.

Path: {relative_path}

## User intent (highest priority)
{prior}Latest message:
"{user_message}"

Interpretation rules:
- "Keep X" / "don't remove X" → preserve that section verbatim or restore from baseline if missing.
- "Shorten" / "less verbose" → compress narration only, not prohibitions or tool commands.
- "Add back" → restore from baseline file below, integrated cleanly.
- Later messages override earlier ones only where they conflict.

## Reference: baseline on disk
```
{baseline_original}
```

## Current draft to edit
```
{current_draft}
```

Apply the user message and prior requests. Preserve all constraints not targeted for change.
Return ONLY the complete updated file in one fenced code block."#,
    )
}

pub async fn suggest_improvement(
    settings: &AiSettings,
    platform: String,
    relative_path: String,
    load_scope: String,
    file_kind: String,
    issue_notes: Vec<String>,
    original: String,
) -> Result<ImprovementSuggestion, String> {
    let user = build_initial_prompt(
        &platform,
        &relative_path,
        &load_scope,
        &file_kind,
        &issue_notes,
        &original,
    );
    let messages = vec![
        serde_json::json!({"role": "system", "content": SYSTEM_PROMPT}),
        serde_json::json!({"role": "user", "content": user}),
    ];
    let assistant = chat_completion(settings, messages, 0.15).await?;
    let suggested = unwrap_code_fence(&assistant);
    if suggested.trim().is_empty() {
        return Err("Model returned empty content".into());
    }

    let est_before = estimate_tokens(original.chars().count());
    let est_after = estimate_tokens(suggested.chars().count());

    Ok(ImprovementSuggestion {
        relative_path,
        platform,
        original,
        suggested,
        rationale: format!(
            "First pass (constraint-preserving trim). {}",
            token_rationale(est_before, est_after)
        ),
        estimated_tokens_before: est_before,
        estimated_tokens_after: est_after,
    })
}

pub async fn refine_improvement(
    settings: &AiSettings,
    platform: String,
    relative_path: String,
    baseline_original: String,
    current_draft: String,
    user_message: String,
    prior_feedback: Vec<String>,
) -> Result<ImprovementSuggestion, String> {
    let user = build_refine_prompt(
        &platform,
        &relative_path,
        &baseline_original,
        &current_draft,
        &prior_feedback,
        &user_message,
    );
    let messages = vec![
        serde_json::json!({"role": "system", "content": SYSTEM_PROMPT}),
        serde_json::json!({"role": "user", "content": user}),
    ];
    let assistant = chat_completion(settings, messages, 0.22).await?;
    let suggested = unwrap_code_fence(&assistant);
    if suggested.trim().is_empty() {
        return Err("Model returned empty content".into());
    }

    let est_before = estimate_tokens(baseline_original.chars().count());
    let est_after = estimate_tokens(suggested.chars().count());
    let short = if user_message.chars().count() > 120 {
        format!("{}…", user_message.chars().take(120).collect::<String>())
    } else {
        user_message.clone()
    };

    Ok(ImprovementSuggestion {
        relative_path,
        platform,
        original: baseline_original,
        suggested,
        rationale: format!(
            "Updated for: \"{short}\". {}",
            token_rationale(est_before, est_after)
        ),
        estimated_tokens_before: est_before,
        estimated_tokens_after: est_after,
    })
}

pub fn apply_instruction_file(
    repo_path: &str,
    relative_path: &str,
    new_content: &str,
) -> Result<String, String> {
    let root = PathBuf::from(repo_path)
        .canonicalize()
        .map_err(|e| e.to_string())?;
    let full = root.join(relative_path);
    if !full.starts_with(&root) {
        return Err("Path escapes repository".into());
    }
    if !full.is_file() {
        return Err(format!("Not a file: {relative_path}"));
    }

    let original = fs::read_to_string(&full).map_err(|e| e.to_string())?;
    let backup_dir = root.join(".agentinspect").join("backups");
    fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

    let stamp = unix_ms_stamp();
    let safe_name = relative_path.replace(['/', '\\'], "__");
    let backup_path = backup_dir.join(format!("{stamp}__{safe_name}"));
    fs::write(&backup_path, &original).map_err(|e| e.to_string())?;
    fs::write(&full, new_content).map_err(|e| e.to_string())?;

    Ok(backup_path.to_string_lossy().to_string())
}

fn unix_ms_stamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    format!("{ms}")
}

#[cfg(test)]
mod prompt_tests {
    use super::*;

    #[test]
    fn initial_prompt_includes_scope_and_issues() {
        let p = build_initial_prompt(
            "cursor",
            ".cursor/rules/foo.mdc",
            "always_on",
            "rule",
            &["Large file".into()],
            "# test",
        );
        assert!(p.contains("always_on"));
        assert!(p.contains("Large file"));
        assert!(p.contains("behavioral"));
    }
}

pub async fn list_ollama_models(settings: &AiSettings) -> Result<Vec<OllamaModel>, String> {
    if settings.api_style != "ollama" {
        return Err("Model list is supported for Ollama only. Use OpenAI-compatible servers with a manual model name.".into());
    }
    let client = http_client()?;
    let url = format!("{}/api/tags", settings.endpoint.trim_end_matches('/'));
    let resp = client
        .get(url)
        .timeout(Duration::from_secs(20))
        .send()
        .await
        .map_err(|e| format_request_error(&settings.endpoint, e))?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {} — is Ollama running?", resp.status()));
    }
    let body = resp.text().await.map_err(|e| e.to_string())?;
    let v: serde_json::Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    let models = v
        .pointer("/models")
        .and_then(|m| m.as_array())
        .ok_or("Unexpected Ollama response")?;

    let mut out = Vec::new();
    for m in models {
        let name = m
            .pointer("/name")
            .and_then(|n| n.as_str())
            .unwrap_or_default()
            .to_string();
        if name.is_empty() {
            continue;
        }
        let size_bytes = m.pointer("/size").and_then(|s| s.as_u64());
        out.push(OllamaModel { name, size_bytes });
    }
    out.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(out)
}

pub async fn test_ai_connection(settings: &AiSettings) -> Result<String, String> {
    let client = http_client()?;

    if settings.api_style == "openai" {
        let url = format!(
            "{}/v1/models",
            settings.endpoint.trim_end_matches('/')
        );
        let resp = client
            .get(url)
            .timeout(Duration::from_secs(20))
            .send()
            .await
            .map_err(|e| format_request_error(&settings.endpoint, e))?;
        if resp.status().is_success() {
            return Ok("Connected (OpenAI-compatible API)".into());
        }
        return Err(format!("HTTP {}", resp.status()));
    }

    let models = list_ollama_models(settings).await?;
    let active = settings.model.trim();
    if active.is_empty() {
        return Err(
            "Connected to Ollama but no model is selected — load models and pick one.".into(),
        );
    }
    if !models.iter().any(|m| m.name == active) {
        return Err(format!(
            "Ollama is running but model \"{active}\" is not installed. Use Settings → Load Ollama models and pick one from the list, or run `ollama pull {active}`."
        ));
    }
    Ok(format!(
        "Connected — {} model(s). Active: {active} ✓",
        models.len()
    ))
}