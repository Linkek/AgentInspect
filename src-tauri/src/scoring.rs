use crate::limits::{ResolvedBudgets, ScoringWeights};
use crate::scanner::{summary_for_platform, ScanSummary};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoreDimension {
    pub id: String,
    pub label: String,
    pub score: u8,
    pub penalty: f64,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthHighlight {
    pub title: String,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthIssue {
    pub id: String,
    pub category: String,
    pub title: String,
    pub detail: String,
    pub severity: u8,
    pub relative_path: Option<String>,
    pub estimated_tokens: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthScore {
    pub overall: u8,
    pub dimensions: Vec<ScoreDimension>,
    pub highlights: Vec<HealthHighlight>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanReport {
    #[serde(flatten)]
    pub summary: ScanSummary,
    pub score: HealthScore,
    pub issues: Vec<HealthIssue>,
    pub budgets: ResolvedBudgets,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformScanBundle {
    pub repo_path: String,
    pub platforms: Vec<String>,
    pub reports_by_platform: HashMap<String, ScanReport>,
}

pub fn build_platform_bundle(
    full: ScanSummary,
    budgets: &ResolvedBudgets,
    weights: &ScoringWeights,
) -> PlatformScanBundle {
    let mut platforms: Vec<String> = full.by_platform.keys().cloned().collect();
    platforms.sort_by(|a, b| {
        let tb = full.by_platform.get(b).map(|s| s.estimated_tokens).unwrap_or(0);
        let ta = full.by_platform.get(a).map(|s| s.estimated_tokens).unwrap_or(0);
        tb.cmp(&ta)
    });

    let mut reports_by_platform = HashMap::new();
    for platform in &platforms {
        let scoped = summary_for_platform(&full, platform);
        let report = compute_report(scoped, budgets, weights, true);
        reports_by_platform.insert(platform.clone(), report);
    }

    PlatformScanBundle {
        repo_path: full.repo_path,
        platforms,
        reports_by_platform,
    }
}

pub fn compute_report(
    summary: ScanSummary,
    budgets: &ResolvedBudgets,
    weights: &ScoringWeights,
    per_platform: bool,
) -> ScanReport {
    let mut issues: Vec<HealthIssue> = Vec::new();

    let always_on_tokens = summary.context_tax.always_on_tokens;

    let footprint_ratio = ratio(summary.estimated_tokens, budgets.total_instructions_budget_tokens);
    let always_ratio = ratio(always_on_tokens, budgets.always_on_budget_tokens.max(1));

    let oversized: Vec<_> = summary
        .files
        .iter()
        .filter(|f| f.estimated_tokens > budgets.max_single_file_tokens)
        .collect();
    let oversized_penalty = (oversized.len() as f64 * 12.0).min(100.0);

    let dup_waste: usize = summary
        .duplicate_groups
        .iter()
        .map(|g| g.estimated_tokens * (g.paths.len().saturating_sub(1)))
        .sum();
    let dup_penalty = ratio(dup_waste, budgets.total_instructions_budget_tokens / 2).min(1.0) * 100.0;

    let platform_count = if per_platform {
        1
    } else {
        summary.by_platform.len()
    };
    let sprawl_penalty = if per_platform {
        0.0
    } else if platform_count > 5 {
        ((platform_count - 5) as f64 * 8.0).min(40.0)
    } else {
        0.0
    };

    let mcp_tokens: usize = summary
        .files
        .iter()
        .filter(|f| f.kind == "mcp-config")
        .map(|f| f.estimated_tokens)
        .sum();
    let mcp_penalty = ratio(mcp_tokens, budgets.max_single_file_tokens * 2).min(1.0) * 100.0;

    let dim_footprint = penalty_to_dimension_score(footprint_ratio * 100.0);
    let dim_always = penalty_to_dimension_score(always_ratio * 100.0);
    let dim_oversized = penalty_to_dimension_score(oversized_penalty);
    let dim_dupes = penalty_to_dimension_score(dup_penalty);
    let dim_sprawl = penalty_to_dimension_score(sprawl_penalty);
    let dim_mcp = penalty_to_dimension_score(mcp_penalty);

    let weighted_penalty = weights.total_footprint * (100.0 - dim_footprint as f64)
        + weights.always_on_proxy * (100.0 - dim_always as f64)
        + weights.oversized_files * (100.0 - dim_oversized as f64)
        + weights.duplicates * (100.0 - dim_dupes as f64)
        + weights.platform_sprawl * (100.0 - dim_sprawl as f64)
        + weights.mcp_bloat * (100.0 - dim_mcp as f64);

    let overall = (100.0 - weighted_penalty).clamp(0.0, 100.0) as u8;

    for f in &oversized {
        issues.push(HealthIssue {
            id: format!("oversized:{}", f.relative_path),
            category: "oversized".to_string(),
            title: format!("Oversized instruction file"),
            detail: format!(
                "~{} tokens (limit {} for profile)",
                f.estimated_tokens, budgets.max_single_file_tokens
            ),
            severity: severity_from_ratio(
                ratio(f.estimated_tokens, budgets.max_single_file_tokens),
            ),
            relative_path: Some(f.relative_path.clone()),
            estimated_tokens: f.estimated_tokens,
        });
    }

    for g in &summary.duplicate_groups {
        let waste = g.estimated_tokens * (g.paths.len().saturating_sub(1));
        issues.push(HealthIssue {
            id: format!("dup:{}", g.hash.chars().take(12).collect::<String>()),
            category: "duplicate".to_string(),
            title: if g.normalized {
                "Near-duplicate instructions".into()
            } else {
                "Duplicate instructions".into()
            },
            detail: format!(
                "{} copies, ~{} wasted tokens — {}",
                g.paths.len(),
                waste,
                g.paths.join(", ")
            ),
            severity: severity_from_ratio(ratio(waste, budgets.total_instructions_budget_tokens)),
            relative_path: g.paths.first().cloned(),
            estimated_tokens: waste,
        });
    }

    if summary.estimated_tokens > budgets.total_instructions_budget_tokens {
        issues.push(HealthIssue {
            id: "footprint:total".into(),
            category: "footprint".to_string(),
            title: "Total instruction footprint over budget".into(),
            detail: format!(
                "~{} tokens across {} files (budget ~{})",
                summary.estimated_tokens,
                summary.file_count,
                budgets.total_instructions_budget_tokens
            ),
            severity: severity_from_ratio(footprint_ratio),
            relative_path: None,
            estimated_tokens: summary.estimated_tokens,
        });
    }

    if always_on_tokens > budgets.always_on_budget_tokens {
        issues.push(HealthIssue {
            id: "always-on:proxy".into(),
            category: "always-on".to_string(),
            title: "Always-on instruction proxy over budget".into(),
            detail: format!(
                "~{} tokens in AGENTS.md + alwaysApply rules (budget ~{})",
                always_on_tokens, budgets.always_on_budget_tokens
            ),
            severity: severity_from_ratio(always_ratio),
            relative_path: None,
            estimated_tokens: always_on_tokens,
        });
    }

    if !per_platform && summary.by_platform.len() > 6 {
        issues.push(HealthIssue {
            id: "sprawl:platforms".into(),
            category: "sprawl".to_string(),
            title: "Many parallel agent platforms".into(),
            detail: format!(
                "{} platforms detected — use platform tabs to review each toolchain separately",
                summary.by_platform.len()
            ),
            severity: ((summary.by_platform.len() - 6) as u8 * 12).min(95),
            relative_path: None,
            estimated_tokens: 0,
        });
    }

    issues.sort_by(|a, b| b.severity.cmp(&a.severity));

    let mut highlights = Vec::new();
    if summary.duplicate_groups.is_empty() && summary.file_count > 0 {
        highlights.push(HealthHighlight {
            title: "No duplicate bodies detected".into(),
            detail: "Instruction text appears unique across scanned files.".into(),
        });
    }
    if overall >= 80 {
        highlights.push(HealthHighlight {
            title: "Healthy instruction budget".into(),
            detail: "Footprint fits comfortably within the selected model profile.".into(),
        });
    }
    if summary.file_count > 0 && oversized.is_empty() {
        highlights.push(HealthHighlight {
            title: "No oversized single files".into(),
            detail: format!(
                "All files under {} tokens for this profile.",
                budgets.max_single_file_tokens
            ),
        });
    }

    let dimensions = vec![
        ScoreDimension {
            id: "footprint".into(),
            label: "Total footprint".into(),
            score: dim_footprint,
            penalty: footprint_ratio * 100.0,
            detail: format!(
                "{} / {} budget tokens",
                summary.estimated_tokens, budgets.total_instructions_budget_tokens
            ),
        },
        ScoreDimension {
            id: "alwaysOn".into(),
            label: "Always-on proxy".into(),
            score: dim_always,
            penalty: always_ratio * 100.0,
            detail: format!(
                "{} always-on vs {} budget ({} latent on disk)",
                always_on_tokens,
                budgets.always_on_budget_tokens,
                summary.context_tax.latent_tokens
            ),
        },
        ScoreDimension {
            id: "oversized".into(),
            label: "Oversized files".into(),
            score: dim_oversized,
            penalty: oversized_penalty,
            detail: format!("{} files over limit", oversized.len()),
        },
        ScoreDimension {
            id: "duplicates".into(),
            label: "Duplicates".into(),
            score: dim_dupes,
            penalty: dup_penalty,
            detail: format!("{} duplicate groups", summary.duplicate_groups.len()),
        },
        ScoreDimension {
            id: "sprawl".into(),
            label: if per_platform {
                "This toolchain".into()
            } else {
                "Platform sprawl".into()
            },
            score: dim_sprawl,
            penalty: sprawl_penalty,
            detail: if per_platform {
                "Scoped to one agent platform".into()
            } else {
                format!("{} platforms", platform_count)
            },
        },
        ScoreDimension {
            id: "mcp".into(),
            label: "MCP configs".into(),
            score: dim_mcp,
            penalty: mcp_penalty,
            detail: format!("~{} MCP tokens", mcp_tokens),
        },
    ];

    ScanReport {
        summary,
        score: HealthScore {
            overall,
            dimensions,
            highlights,
        },
        issues,
        budgets: budgets.clone(),
    }
}

fn ratio(value: usize, budget: usize) -> f64 {
    if budget == 0 {
        return if value == 0 { 0.0 } else { 1.0 };
    }
    value as f64 / budget as f64
}

fn penalty_to_dimension_score(penalty_percent: f64) -> u8 {
    (100.0 - penalty_percent.min(100.0)).clamp(0.0, 100.0) as u8
}

fn severity_from_ratio(r: f64) -> u8 {
    (r.min(2.0) * 50.0).clamp(15.0, 100.0) as u8
}

pub fn line_flags_for_content(
    content: &str,
    line_length_warn: usize,
    max_single_file_tokens: usize,
    chars_per_token: u32,
) -> Vec<LineFlag> {
    let mut flags = Vec::new();
    let est = (content.chars().count() + 3) / chars_per_token as usize;
    if est > max_single_file_tokens {
        flags.push(LineFlag {
            line: 0,
            kind: "file".into(),
            reason: format!(
                "This file is about {est} tokens — over the {max_single_file_tokens}-token guideline for your scoring model"
            ),
            severity: 90,
        });
    }
    for (idx, line) in content.lines().enumerate() {
        let len = line.chars().count();
        if len > line_length_warn {
            flags.push(LineFlag {
                line: idx + 1,
                kind: "line".into(),
                reason: format!("Line {line_no} is {len} characters — shorter lines are easier to skim", line_no = idx + 1),
                severity: 55,
            });
        }
    }
    flags
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineFlag {
    /// 0 = whole-file note (not a source line).
    pub line: usize,
    pub kind: String,
    pub reason: String,
    pub severity: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileView {
    pub relative_path: String,
    pub content: String,
    pub language: String,
    pub flags: Vec<LineFlag>,
}

pub fn detect_language(relative_path: &str) -> String {
    if relative_path.ends_with(".json") {
        "json".into()
    } else if relative_path.ends_with(".mdc") {
        "markdown".into()
    } else if relative_path.ends_with(".toml") {
        "toml".into()
    } else {
        "markdown".into()
    }
}