use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

const EMBEDDED_LIMITS: &str = include_str!("../../config/scoring-limits.json");

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoringLimitsFile {
    pub version: u32,
    pub context_window_safety_factor: f64,
    pub chars_per_token: u32,
    pub default_profile: ProfileRef,
    pub providers: HashMap<String, ProviderEntry>,
    pub scoring_weights: ScoringWeights,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileRef {
    pub provider_id: String,
    pub model_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderEntry {
    pub label: String,
    pub models: HashMap<String, ModelLimits>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelLimits {
    pub label: String,
    pub context_window_tokens: usize,
    pub always_on_budget_fraction: f64,
    pub total_instructions_budget_fraction: f64,
    pub max_single_file_tokens: usize,
    pub max_always_on_rule_lines: usize,
    pub line_length_warn_chars: usize,
    pub max_duplicate_groups_before_warn: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoringWeights {
    pub total_footprint: f64,
    pub always_on_proxy: f64,
    pub oversized_files: f64,
    pub duplicates: f64,
    pub platform_sprawl: f64,
    pub mcp_bloat: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedBudgets {
    pub provider_id: String,
    pub provider_label: String,
    pub model_id: String,
    pub model_label: String,
    pub effective_context_tokens: usize,
    pub always_on_budget_tokens: usize,
    pub total_instructions_budget_tokens: usize,
    pub max_single_file_tokens: usize,
    pub max_always_on_rule_lines: usize,
    pub line_length_warn_chars: usize,
    pub max_duplicate_groups_before_warn: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoringLimitsResponse {
    pub limits: ScoringLimitsFile,
    pub active_profile: ProfileRef,
    pub budgets: ResolvedBudgets,
}

pub fn load_limits_file() -> Result<ScoringLimitsFile, String> {
    if let Ok(path) = user_limits_path() {
        if path.is_file() {
            let text = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            return serde_json::from_str(&text).map_err(|e| e.to_string());
        }
    }
    serde_json::from_str(EMBEDDED_LIMITS).map_err(|e| e.to_string())
}

pub fn save_user_limits(file: &ScoringLimitsFile) -> Result<(), String> {
    let path = user_limits_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let text = serde_json::to_string_pretty(file).map_err(|e| e.to_string())?;
    fs::write(path, text).map_err(|e| e.to_string())
}

pub fn reset_user_limits() -> Result<(), String> {
    if let Ok(path) = user_limits_path() {
        if path.is_file() {
            fs::remove_file(path).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn user_limits_path() -> Result<PathBuf, String> {
  let base = dirs::data_local_dir().ok_or("Cannot resolve app data dir")?;
    Ok(base.join("AgentInspect").join("scoring-limits.json"))
}

pub fn resolve_budgets(limits: &ScoringLimitsFile, profile: &ProfileRef) -> Result<ResolvedBudgets, String> {
    let provider = limits
        .providers
        .get(&profile.provider_id)
        .ok_or_else(|| format!("Unknown provider: {}", profile.provider_id))?;
    let model = provider
        .models
        .get(&profile.model_id)
        .ok_or_else(|| format!("Unknown model: {}", profile.model_id))?;

    let effective = ((model.context_window_tokens as f64) * limits.context_window_safety_factor).floor() as usize;

    Ok(ResolvedBudgets {
        provider_id: profile.provider_id.clone(),
        provider_label: provider.label.clone(),
        model_id: profile.model_id.clone(),
        model_label: model.label.clone(),
        effective_context_tokens: effective,
        always_on_budget_tokens: (effective as f64 * model.always_on_budget_fraction).floor() as usize,
        total_instructions_budget_tokens: (effective as f64
            * model.total_instructions_budget_fraction)
            .floor() as usize,
        max_single_file_tokens: model.max_single_file_tokens,
        max_always_on_rule_lines: model.max_always_on_rule_lines,
        line_length_warn_chars: model.line_length_warn_chars,
        max_duplicate_groups_before_warn: model.max_duplicate_groups_before_warn,
    })
}

pub fn limits_response(active: Option<ProfileRef>) -> Result<ScoringLimitsResponse, String> {
    let limits = load_limits_file()?;
    let profile = active.unwrap_or_else(|| limits.default_profile.clone());
    let budgets = resolve_budgets(&limits, &profile)?;
    Ok(ScoringLimitsResponse {
        limits,
        active_profile: profile,
        budgets,
    })
}