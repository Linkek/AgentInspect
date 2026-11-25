mod ai;
mod limits;
mod scanner;
mod scoring;

use ai::{
    apply_instruction_file as write_instruction_file, list_ollama_models, load_ai_settings,
    refine_improvement, save_ai_settings, suggest_improvement, test_ai_connection, AiSettings,
    ImprovementSuggestion, OllamaModel,
};
use limits::{
    limits_response, load_limits_file, resolve_budgets, reset_user_limits, save_user_limits,
    ProfileRef, ScoringLimitsResponse,
};
use scanner::{scan_repository, ScanProgress};
use scoring::{
    build_platform_bundle, detect_language, line_flags_for_content, FileView, PlatformScanBundle,
};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};

#[tauri::command]
fn get_scoring_limits(profile: Option<ProfileRef>) -> Result<ScoringLimitsResponse, String> {
    limits_response(profile)
}

#[tauri::command]
fn set_scoring_profile(profile: ProfileRef) -> Result<ScoringLimitsResponse, String> {
    let mut limits = load_limits_file()?;
    limits.default_profile = profile.clone();
    save_user_limits(&limits)?;
    limits_response(Some(profile))
}

#[tauri::command]
fn reset_scoring_limits() -> Result<ScoringLimitsResponse, String> {
    reset_user_limits()?;
    limits_response(None)
}

#[tauri::command]
fn get_ai_settings() -> AiSettings {
    load_ai_settings()
}

#[tauri::command]
fn set_ai_settings(settings: AiSettings) -> Result<(), String> {
    save_ai_settings(&settings)
}

#[tauri::command]
async fn test_local_ai(settings: Option<AiSettings>) -> Result<String, String> {
    let settings = settings.unwrap_or_else(load_ai_settings);
    test_ai_connection(&settings).await
}

#[tauri::command]
async fn scan_repo(
    app: AppHandle,
    repo_path: String,
    profile: Option<ProfileRef>,
) -> Result<PlatformScanBundle, String> {
    let limits = load_limits_file()?;
    let profile = profile.unwrap_or_else(|| limits.default_profile.clone());
    let budgets = resolve_budgets(&limits, &profile)?;
    let weights = limits.scoring_weights.clone();
    let repo = repo_path.clone();
    let app_handle = app.clone();

    let summary = tauri::async_runtime::spawn_blocking(move || {
        scan_repository(&repo, |p: ScanProgress| {
            let _ = app_handle.emit("scan-progress", p);
        })
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(build_platform_bundle(summary, &budgets, &weights))
}

#[tauri::command]
fn read_instruction_file(
    repo_path: String,
    relative_path: String,
    profile: Option<ProfileRef>,
) -> Result<FileView, String> {
    let limits = load_limits_file()?;
    let profile = profile.unwrap_or_else(|| limits.default_profile.clone());
    let budgets = resolve_budgets(&limits, &profile)?;
    let root = PathBuf::from(&repo_path)
        .canonicalize()
        .map_err(|e| e.to_string())?;
    let full = root.join(&relative_path);
    if !full.starts_with(&root) {
        return Err("Path escapes repository".into());
    }
    let content = fs::read_to_string(&full).map_err(|e| e.to_string())?;
    let language = detect_language(&relative_path);
    let flags = line_flags_for_content(
        &content,
        budgets.line_length_warn_chars,
        budgets.max_single_file_tokens,
        limits.chars_per_token,
    );
    Ok(FileView {
        relative_path,
        content,
        language,
        flags,
    })
}

#[tauri::command]
async fn list_local_models(settings: Option<AiSettings>) -> Result<Vec<OllamaModel>, String> {
    let settings = settings.unwrap_or_else(load_ai_settings);
    list_ollama_models(&settings).await
}

#[tauri::command]
async fn refine_instruction_improvement(
    platform: String,
    relative_path: String,
    baseline_original: String,
    current_draft: String,
    user_message: String,
    prior_feedback: Vec<String>,
) -> Result<ImprovementSuggestion, String> {
    let settings = load_ai_settings();
    refine_improvement(
        &settings,
        platform,
        relative_path,
        baseline_original,
        current_draft,
        user_message,
        prior_feedback,
    )
    .await
}

#[tauri::command]
async fn suggest_instruction_improvement(
    repo_path: String,
    relative_path: String,
    platform: String,
    load_scope: String,
    file_kind: String,
    issue_notes: Vec<String>,
) -> Result<ImprovementSuggestion, String> {
    let settings = load_ai_settings();
    let root = PathBuf::from(&repo_path)
        .canonicalize()
        .map_err(|e| e.to_string())?;
    let full = root.join(&relative_path);
    if !full.starts_with(&root) {
        return Err("Path escapes repository".into());
    }
    let original = fs::read_to_string(&full).map_err(|e| e.to_string())?;
    suggest_improvement(
        &settings,
        platform,
        relative_path,
        load_scope,
        file_kind,
        issue_notes,
        original,
    )
    .await
}

#[tauri::command]
fn apply_instruction_file(
    repo_path: String,
    relative_path: String,
    content: String,
) -> Result<String, String> {
    write_instruction_file(&repo_path, &relative_path, &content)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_repo,
            get_scoring_limits,
            set_scoring_profile,
            reset_scoring_limits,
            read_instruction_file,
            get_ai_settings,
            set_ai_settings,
            test_local_ai,
            suggest_instruction_improvement,
            refine_instruction_improvement,
            list_local_models,
            apply_instruction_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}