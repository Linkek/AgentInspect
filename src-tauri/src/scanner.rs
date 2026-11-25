use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstructionFile {
    pub path: String,
    pub relative_path: String,
    pub platform: String,
    pub kind: String,
    pub chars: usize,
    pub lines: usize,
    pub estimated_tokens: usize,
    pub content_hash: String,
    pub normalized_hash: String,
    pub always_on: bool,
    /// How likely this file is injected every turn vs on-demand (heuristic).
    pub load_scope: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextTax {
    pub always_on_tokens: usize,
    pub path_scoped_tokens: usize,
    pub on_demand_tokens: usize,
    pub tool_config_tokens: usize,
    pub generated_tokens: usize,
    pub reference_tokens: usize,
    /// Repo total minus always-on — usually not loaded every chat turn.
    pub latent_tokens: usize,
    pub top_always_on: Vec<AlwaysOnEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlwaysOnEntry {
    pub relative_path: String,
    pub estimated_tokens: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanProgress {
    pub phase: String,
    pub current: usize,
    pub total: usize,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DuplicateGroup {
    pub hash: String,
    pub normalized: bool,
    pub paths: Vec<String>,
    pub chars: usize,
    pub estimated_tokens: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoleSyncInfo {
    pub detected: bool,
    pub config_path: Option<String>,
    pub catalog_path: Option<String>,
    pub manifest_path: Option<String>,
    pub role_count: usize,
    pub skill_count: usize,
    pub platforms: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanSummary {
    pub repo_path: String,
    pub file_count: usize,
    pub total_chars: usize,
    pub total_lines: usize,
    pub estimated_tokens: usize,
    pub by_platform: HashMap<String, PlatformStats>,
    pub by_kind: HashMap<String, usize>,
    pub largest_files: Vec<InstructionFile>,
    pub duplicate_groups: Vec<DuplicateGroup>,
    pub rolesync: RoleSyncInfo,
    pub warnings: Vec<String>,
    pub files: Vec<InstructionFile>,
    pub by_load_scope: HashMap<String, PlatformStats>,
    pub context_tax: ContextTax,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformStats {
    pub files: usize,
    pub chars: usize,
    pub estimated_tokens: usize,
}

struct ClassifiedPath {
    platform: &'static str,
    kind: &'static str,
}

fn skip_dir(name: &str) -> bool {
    matches!(
        name,
        "node_modules"
            | ".git"
            | "target"
            | "dist"
            | "build"
            | ".next"
            | ".turbo"
            | "coverage"
            | ".nx"
            | "vendor"
            | "__pycache__"
            | ".venv"
            | "venv"
    )
}

fn classify(relative: &str, file_name: &str) -> Option<ClassifiedPath> {
    let normalized = relative.replace('\\', "/");
    let lower = normalized.to_lowercase();

    if file_name == "AGENTS.md" {
        return Some(ClassifiedPath {
            platform: "generic",
            kind: "agents-md",
        });
    }
    if file_name == "CLAUDE.md" {
        return Some(ClassifiedPath {
            platform: "claude-code",
            kind: "project-instructions",
        });
    }
    if file_name == "GEMINI.md" {
        return Some(ClassifiedPath {
            platform: "gemini",
            kind: "project-instructions",
        });
    }
    if file_name == ".mcp.json" || file_name == "mcp.json" {
        let platform = if lower.contains(".cursor/") {
            "cursor"
        } else if lower.contains(".github/") {
            "github"
        } else if lower.contains(".vscode/") {
            "vscode"
        } else {
            "mcp"
        };
        return Some(ClassifiedPath {
            platform,
            kind: "mcp-config",
        });
    }
    if file_name == "copilot-instructions.md" {
        return Some(ClassifiedPath {
            platform: "github-copilot",
            kind: "copilot-instructions",
        });
    }
    if file_name == "SKILL.md" {
        let platform = if lower.contains(".cursor/") {
            "cursor"
        } else if lower.contains(".claude/") {
            "claude-code"
        } else if lower.contains(".agents/") {
            "rolesync"
        } else if lower.contains(".codex/") {
            "codex"
        } else {
            "skill"
        };
        return Some(ClassifiedPath {
            platform,
            kind: "skill",
        });
    }
    if file_name == "plugin.json" && lower.contains(".cursor-plugin/") {
        return Some(ClassifiedPath {
            platform: "cursor",
            kind: "cursor-plugin",
        });
    }
    if file_name == "rolesync.json" || file_name == "catalog.json" || file_name == "generated-manifest.json"
    {
        return Some(ClassifiedPath {
            platform: "rolesync",
            kind: "rolesync-config",
        });
    }
    if file_name.ends_with(".mdc") && lower.contains(".cursor/rules") {
        return Some(ClassifiedPath {
            platform: "cursor",
            kind: "rule",
        });
    }
    if lower.starts_with(".cursor/rules/") && file_name.ends_with(".md") {
        return Some(ClassifiedPath {
            platform: "cursor",
            kind: "rule",
        });
    }
    if lower.starts_with(".cursor/skills/") {
        return Some(ClassifiedPath {
            platform: "cursor",
            kind: "skill-support",
        });
    }
    if lower.starts_with(".agents/roles/") && file_name.ends_with(".md") {
        return Some(ClassifiedPath {
            platform: "rolesync",
            kind: "role",
        });
    }
    if lower.starts_with(".agents/skills/") {
        return Some(ClassifiedPath {
            platform: "rolesync",
            kind: "skill-support",
        });
    }
    if lower.starts_with(".agents/") && file_name.ends_with(".md") {
        return Some(ClassifiedPath {
            platform: "rolesync",
            kind: "agents-doc",
        });
    }
    if lower.starts_with(".claude/agents/") {
        return Some(ClassifiedPath {
            platform: "claude-code",
            kind: "agent",
        });
    }
    if lower.starts_with(".claude/skills/") {
        return Some(ClassifiedPath {
            platform: "claude-code",
            kind: "skill-support",
        });
    }
    if file_name == "settings.json" && lower.starts_with(".claude/") {
        return Some(ClassifiedPath {
            platform: "claude-code",
            kind: "settings",
        });
    }
    if lower.starts_with(".codex/") {
        return Some(ClassifiedPath {
            platform: "codex",
            kind: "codex-config",
        });
    }
    if lower.starts_with(".github/instructions/") {
        return Some(ClassifiedPath {
            platform: "github-copilot",
            kind: "copilot-instruction",
        });
    }
    if lower.starts_with(".github/chatmodes/") {
        return Some(ClassifiedPath {
            platform: "github-copilot",
            kind: "chatmode",
        });
    }
    if lower.starts_with(".windsurf/rules/") || lower.contains("/.windsurf/") {
        return Some(ClassifiedPath {
            platform: "windsurf",
            kind: "rule",
        });
    }
    if lower.starts_with(".continue/") {
        return Some(ClassifiedPath {
            platform: "continue",
            kind: "continue-config",
        });
    }
    if lower.starts_with(".openspec/") {
        return Some(ClassifiedPath {
            platform: "openspec",
            kind: "openspec",
        });
    }
    if lower.starts_with(".amazonq/") {
        return Some(ClassifiedPath {
            platform: "amazon-q",
            kind: "amazon-q-config",
        });
    }
    if lower.contains("/skills/") && (file_name.ends_with(".md") || file_name.ends_with(".mdc")) {
        return Some(ClassifiedPath {
            platform: "skill",
            kind: "skill-support",
        });
    }

    None
}

fn hash_content(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    hex::encode(hasher.finalize())
}

fn normalize_for_dup(content: &str) -> String {
    content
        .lines()
        .map(|line| line.trim())
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
        .to_lowercase()
}

fn estimate_tokens(chars: usize) -> usize {
    (chars + 3) / 4
}

fn count_lines(content: &str) -> usize {
    if content.is_empty() {
        0
    } else {
        content.lines().count()
    }
}

fn extract_frontmatter(content: &str) -> Option<String> {
    if !content.starts_with("---") {
        return None;
    }
    let rest = content.strip_prefix("---")?;
    let end = rest.find("\n---")?;
    Some(rest[..end].to_string())
}

fn frontmatter_flag(fm: &str, key: &str) -> bool {
    let prefix = format!("{key}:");
    fm.lines().any(|line| {
        let t = line.trim().to_lowercase();
        t.starts_with(&prefix) && (t.contains("true") || t.ends_with("true"))
    })
}

fn frontmatter_has_globs(fm: &str) -> bool {
    fm.lines().any(|line| {
        let t = line.trim().to_lowercase();
        t.starts_with("globs:") || t.starts_with("glob:")
    })
}

fn infer_load_scope(
    content: &str,
    relative_path: &str,
    kind: &str,
    rolesync_canonical: bool,
) -> String {
    if kind == "mcp-config" {
        return "tool_config".into();
    }
    if kind == "skill-support" {
        return "reference".into();
    }
    if rolesync_canonical
        && (relative_path.starts_with(".claude/")
            || relative_path.starts_with(".codex/"))
        && kind != "settings"
    {
        return "generated".into();
    }
    if matches!(
        relative_path,
        "AGENTS.md" | "CLAUDE.md" | "GEMINI.md" | ".github/copilot-instructions.md"
    ) {
        return "always_on".into();
    }
    if kind == "skill" {
        return "on_demand".into();
    }
    if let Some(fm) = extract_frontmatter(content) {
        if frontmatter_flag(&fm, "alwaysapply") {
            return "always_on".into();
        }
        if frontmatter_has_globs(&fm) {
            return "path_scoped".into();
        }
        if kind == "rule" {
            return "on_demand".into();
        }
    }
    if kind == "rule" {
        return "path_scoped".into();
    }
    if kind == "agents-md" && relative_path.contains('/') {
        return "path_scoped".into();
    }
    if kind == "copilot-instruction" || kind == "chatmode" {
        return "path_scoped".into();
    }
    "on_demand".into()
}

fn build_context_tax(files: &[InstructionFile]) -> ContextTax {
    let mut sums: HashMap<&str, usize> = HashMap::new();
    for f in files {
        *sums.entry(f.load_scope.as_str()).or_insert(0) += f.estimated_tokens;
    }
    let always_on = *sums.get("always_on").unwrap_or(&0);
    let total: usize = files.iter().map(|f| f.estimated_tokens).sum();
    let mut top_always: Vec<AlwaysOnEntry> = files
        .iter()
        .filter(|f| f.load_scope == "always_on")
        .map(|f| AlwaysOnEntry {
            relative_path: f.relative_path.clone(),
            estimated_tokens: f.estimated_tokens,
        })
        .collect();
    top_always.sort_by(|a, b| b.estimated_tokens.cmp(&a.estimated_tokens));
    top_always.truncate(8);

    ContextTax {
        always_on_tokens: always_on,
        path_scoped_tokens: *sums.get("path_scoped").unwrap_or(&0),
        on_demand_tokens: *sums.get("on_demand").unwrap_or(&0),
        tool_config_tokens: *sums.get("tool_config").unwrap_or(&0),
        generated_tokens: *sums.get("generated").unwrap_or(&0),
        reference_tokens: *sums.get("reference").unwrap_or(&0),
        latent_tokens: total.saturating_sub(always_on),
        top_always_on: top_always,
    }
}

pub fn scan_repository(
    repo_path: &str,
    mut on_progress: impl FnMut(ScanProgress),
) -> Result<ScanSummary, String> {
    let root = PathBuf::from(repo_path);
    if !root.is_dir() {
        return Err(format!("Not a directory: {repo_path}"));
    }

    let canonical = root
        .canonicalize()
        .map_err(|e| format!("Cannot read repo path: {e}"))?;

    let mut walker = ignore::WalkBuilder::new(&canonical);
    walker
        .git_ignore(true)
        .git_global(true)
        .git_exclude(true)
        .hidden(false);

    let mut files: Vec<InstructionFile> = Vec::new();
    let mut warnings: Vec<String> = Vec::new();
    let mut candidates: Vec<(PathBuf, String, String)> = Vec::new();

    on_progress(ScanProgress {
        phase: "walking".into(),
        current: 0,
        total: 0,
        message: "Walking repository…".into(),
    });

    let mut walked = 0usize;
    for entry in walker.build().filter_map(Result::ok) {
        walked += 1;
        let path = entry.path();
        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if skip_dir(name) {
                    continue;
                }
            }
            if walked % 200 == 0 {
                on_progress(ScanProgress {
                    phase: "walking".into(),
                    current: walked,
                    total: 0,
                    message: format!("Walking… ({walked} entries)"),
                });
            }
            continue;
        }

        let Ok(meta) = fs::metadata(path) else {
            continue;
        };
        if meta.len() > 2_000_000 {
            warnings.push(format!(
                "Skipped very large file (>2MB): {}",
                path.display()
            ));
            continue;
        }

        let Some(file_name) = path.file_name().and_then(|n| n.to_str()) else {
            continue;
        };

        let Ok(relative) = path.strip_prefix(&canonical) else {
            continue;
        };
        let relative_str = relative.to_string_lossy().replace('\\', "/");

        let Some(class) = classify(&relative_str, file_name) else {
            continue;
        };

        candidates.push((
            path.to_path_buf(),
            relative_str,
            class.platform.to_string(),
        ));
        let _ = class;
    }

    let rolesync_canonical = canonical.join(".agents").is_dir();
    let total = candidates.len();
    on_progress(ScanProgress {
        phase: "reading".into(),
        current: 0,
        total,
        message: format!("Reading {total} instruction files…"),
    });

    for (idx, (path, relative_str, _)) in candidates.into_iter().enumerate() {
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or_default();
        let Some(class) = classify(&relative_str, file_name) else {
            continue;
        };

        on_progress(ScanProgress {
            phase: "reading".into(),
            current: idx + 1,
            total,
            message: relative_str.clone(),
        });

        let Ok(content) = fs::read_to_string(&path) else {
            warnings.push(format!("Could not read as text: {relative_str}"));
            continue;
        };

        let chars = content.chars().count();
        let normalized = normalize_for_dup(&content);
        let load_scope = infer_load_scope(&content, &relative_str, class.kind, rolesync_canonical);
        let always_on = load_scope == "always_on";

        files.push(InstructionFile {
            path: path.to_string_lossy().to_string(),
            relative_path: relative_str,
            platform: class.platform.to_string(),
            kind: class.kind.to_string(),
            chars,
            lines: count_lines(&content),
            estimated_tokens: estimate_tokens(chars),
            content_hash: hash_content(&content),
            normalized_hash: hash_content(&normalized),
            always_on,
            load_scope,
        });
    }

    on_progress(ScanProgress {
        phase: "analyzing".into(),
        current: total,
        total,
        message: "Computing score and issues…".into(),
    });

    let file_count = files.len();
    let total_chars: usize = files.iter().map(|f| f.chars).sum();
    let total_lines: usize = files.iter().map(|f| f.lines).sum();
    let estimated_tokens = estimate_tokens(total_chars);

    let mut by_platform: HashMap<String, PlatformStats> = HashMap::new();
    let mut by_load_scope: HashMap<String, PlatformStats> = HashMap::new();
    let mut by_kind: HashMap<String, usize> = HashMap::new();

    for f in &files {
        let entry = by_platform
            .entry(f.platform.clone())
            .or_insert(PlatformStats {
                files: 0,
                chars: 0,
                estimated_tokens: 0,
            });
        entry.files += 1;
        entry.chars += f.chars;
        entry.estimated_tokens += f.estimated_tokens;

        let ls = by_load_scope
            .entry(f.load_scope.clone())
            .or_insert(PlatformStats {
                files: 0,
                chars: 0,
                estimated_tokens: 0,
            });
        ls.files += 1;
        ls.chars += f.chars;
        ls.estimated_tokens += f.estimated_tokens;

        *by_kind.entry(f.kind.clone()).or_insert(0) += 1;
    }

    let context_tax = build_context_tax(&files);

    if context_tax.always_on_tokens > 12_000 {
        warnings.push(format!(
            "~{} estimated always-on tokens (rules + root AGENTS/CLAUDE). This is what hits most chats — trim alwaysApply rules first.",
            context_tax.always_on_tokens
        ));
    }
    if context_tax.generated_tokens > 2000 && rolesync_canonical {
        warnings.push(
            "~RoleSync generated copies under .claude/.codex still occupy disk and can confuse editors; canonical source should stay in .agents/.".into(),
        );
    }

    let mut largest_files = files.clone();
    largest_files.sort_by(|a, b| b.chars.cmp(&a.chars));
    largest_files.truncate(15);

    let duplicate_groups = find_duplicates(&files);
    let rolesync = detect_rolesync(&canonical, &files);

    if estimated_tokens > 50_000 {
        warnings.push(format!(
            "High estimated instruction volume (~{estimated_tokens} tokens). Consider trimming always-on rules and skills."
        ));
    }
    if duplicate_groups.len() > 5 {
        warnings.push(format!(
            "{} duplicate or near-duplicate groups found — you may be paying for the same text multiple times.",
            duplicate_groups.len()
        ));
    }

    Ok(ScanSummary {
        repo_path: canonical.to_string_lossy().to_string(),
        file_count,
        total_chars,
        total_lines,
        estimated_tokens,
        by_platform,
        by_kind,
        largest_files,
        duplicate_groups,
        rolesync,
        warnings,
        files,
        by_load_scope,
        context_tax,
    })
}

fn find_duplicates(files: &[InstructionFile]) -> Vec<DuplicateGroup> {
    let mut exact: HashMap<String, Vec<&InstructionFile>> = HashMap::new();
    let mut normalized: HashMap<String, Vec<&InstructionFile>> = HashMap::new();

    for f in files {
        exact.entry(f.content_hash.clone()).or_default().push(f);
        normalized
            .entry(f.normalized_hash.clone())
            .or_default()
            .push(f);
    }

    let mut groups = Vec::new();
    let mut seen_pairs: HashSet<String> = HashSet::new();

    for (hash, group) in exact {
        if group.len() < 2 {
            continue;
        }
        let paths: Vec<String> = group.iter().map(|f| f.relative_path.clone()).collect();
        let key = paths.join("|");
        if seen_pairs.insert(key) {
            let sample = group[0];
            groups.push(DuplicateGroup {
                hash,
                normalized: false,
                paths,
                chars: sample.chars,
                estimated_tokens: sample.estimated_tokens,
            });
        }
    }

    for (hash, group) in normalized {
        if group.len() < 2 {
            continue;
        }
        let paths: Vec<String> = group.iter().map(|f| f.relative_path.clone()).collect();
        let all_exact_same = group
            .windows(2)
            .all(|w| w[0].content_hash == w[1].content_hash);
        if all_exact_same {
            continue;
        }
        let key = format!("n:{}", paths.join("|"));
        if seen_pairs.insert(key) {
            let sample = group[0];
            groups.push(DuplicateGroup {
                hash,
                normalized: true,
                paths,
                chars: sample.chars,
                estimated_tokens: sample.estimated_tokens,
            });
        }
    }

    groups.sort_by(|a, b| b.estimated_tokens.cmp(&a.estimated_tokens));
    groups
}

fn detect_rolesync(root: &Path, files: &[InstructionFile]) -> RoleSyncInfo {
    let rolesync_files: Vec<_> = files
        .iter()
        .filter(|f| f.platform == "rolesync")
        .collect();

    let detected = root.join(".agents").is_dir() || !rolesync_files.is_empty();

    let config_path = ["rolesync.json", "loom.json"]
        .iter()
        .map(|name| root.join(".agents").join(name))
        .find(|p| p.is_file())
        .map(|p| p.to_string_lossy().to_string());

    let catalog_path = root
        .join(".agents")
        .join("catalog.json")
        .is_file()
        .then(|| root.join(".agents/catalog.json").to_string_lossy().to_string());

    let manifest_path = root
        .join(".agents")
        .join("generated-manifest.json")
        .is_file()
        .then(|| {
            root.join(".agents/generated-manifest.json")
                .to_string_lossy()
                .to_string()
        });

    let role_count = files
        .iter()
        .filter(|f| f.kind == "role")
        .count();
    let skill_count = files
        .iter()
        .filter(|f| f.kind == "skill" && f.platform == "rolesync")
        .count()
        + root
            .join(".agents/skills")
            .is_dir()
            .then(|| {
                fs::read_dir(root.join(".agents/skills"))
                    .map(|rd| rd.filter_map(Result::ok).count())
                    .unwrap_or(0)
            })
            .unwrap_or(0);

    let mut platforms = Vec::new();
    if root.join(".claude").is_dir() {
        platforms.push("claude".to_string());
    }
    if root.join(".codex").is_dir() {
        platforms.push("codex".to_string());
    }
    if let Some(cfg) = &config_path {
        if let Ok(text) = fs::read_to_string(cfg) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                if let Some(p) = json.get("platform").and_then(|v| v.as_str()) {
                    platforms.push(p.to_string());
                }
            }
        }
    }

    RoleSyncInfo {
        detected,
        config_path,
        catalog_path,
        manifest_path,
        role_count,
        skill_count,
        platforms,
    }
}

/// Build a scan summary scoped to a single agent platform (per-toolchain results).
pub fn summary_for_platform(full: &ScanSummary, platform: &str) -> ScanSummary {
    let files: Vec<InstructionFile> = full
        .files
        .iter()
        .filter(|f| f.platform == platform)
        .cloned()
        .collect();

    let file_count = files.len();
    let total_chars: usize = files.iter().map(|f| f.chars).sum();
    let total_lines: usize = files.iter().map(|f| f.lines).sum();
    let estimated_tokens = estimate_tokens(total_chars);

    let mut by_platform = HashMap::new();
    if file_count > 0 {
        by_platform.insert(
            platform.to_string(),
            PlatformStats {
                files: file_count,
                chars: total_chars,
                estimated_tokens,
            },
        );
    }

    let mut by_load_scope: HashMap<String, PlatformStats> = HashMap::new();
    let mut by_kind: HashMap<String, usize> = HashMap::new();
    for f in &files {
        let ls = by_load_scope
            .entry(f.load_scope.clone())
            .or_insert(PlatformStats {
                files: 0,
                chars: 0,
                estimated_tokens: 0,
            });
        ls.files += 1;
        ls.chars += f.chars;
        ls.estimated_tokens += f.estimated_tokens;
        *by_kind.entry(f.kind.clone()).or_insert(0) += 1;
    }

    let context_tax = build_context_tax(&files);

    let mut largest_files = files.clone();
    largest_files.sort_by(|a, b| b.chars.cmp(&a.chars));
    largest_files.truncate(15);

    let duplicate_groups = find_duplicates(&files);

    let rolesync = if platform == "rolesync" {
        full.rolesync.clone()
    } else {
        RoleSyncInfo {
            detected: false,
            config_path: None,
            catalog_path: None,
            manifest_path: None,
            role_count: 0,
            skill_count: 0,
            platforms: vec![],
        }
    };

    let mut warnings = Vec::new();
    if context_tax.always_on_tokens > 12_000 {
        warnings.push(format!(
            "~{} estimated always-on tokens for {platform} — trim always-on rules first.",
            context_tax.always_on_tokens
        ));
    }
    if estimated_tokens > 50_000 {
        warnings.push(format!(
            "High {platform} instruction volume (~{estimated_tokens} tokens)."
        ));
    }
    if duplicate_groups.len() > 5 {
        warnings.push(format!(
            "{} duplicate groups within {platform} — consolidate copies.",
            duplicate_groups.len()
        ));
    }

    ScanSummary {
        repo_path: full.repo_path.clone(),
        file_count,
        total_chars,
        total_lines,
        estimated_tokens,
        by_platform,
        by_kind,
        largest_files,
        duplicate_groups,
        rolesync,
        warnings,
        files,
        by_load_scope,
        context_tax,
    }
}