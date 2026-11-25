import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "./components/PageHeader";
import { ReportContextBar } from "./components/ReportContextBar";
import { ScanProgressBar } from "./components/ScanProgressBar";
import { AppSidebar, type NavPage } from "./layout/AppSidebar";
import { AgentPage } from "./pages/AgentPage";
import { BrowsePage } from "./pages/BrowsePage";
import { ChartsPage } from "./pages/ChartsPage";
import { IssuesPage } from "./pages/IssuesPage";
import { ScanPage } from "./pages/ScanPage";
import { ScorePage } from "./pages/ScorePage";
import { SettingsPage } from "./pages/SettingsPage";
import { drawerWidth } from "./theme";
import { APP_SCROLL_CLASS } from "./themeScrollbars";
import { copy } from "./content/uiCopy";
import type { PlatformScanBundle, ProfileRef, ScoringLimitsResponse } from "./types/scan";
import { activeReport, pickDefaultPlatform } from "./utils/platformScan";
import { roleSyncDetected } from "./utils/rolesyncAgent";

const RESULT_PAGES: NavPage[] = ["score", "issues", "charts", "browse", "agent"];

function App() {
  const [bundle, setBundle] = useState<PlatformScanBundle | null>(null);
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<NavPage>("scan");
  const [profile, setProfile] = useState<ProfileRef | null>(null);
  const [browsePath, setBrowsePath] = useState<string | null>(null);
  const [agentPath, setAgentPath] = useState<string | null>(null);

  const report = useMemo(
    () => activeReport(bundle, platform),
    [bundle, platform],
  );

  useEffect(() => {
    if (!isTauri()) return;
    void invoke<ScoringLimitsResponse>("get_scoring_limits", { profile: null }).then((r) => {
      setProfile(r.activeProfile);
    });
  }, []);

  const runScan = useCallback(
    async (path: string) => {
      setLoading(true);
      setError(null);
      setPage("scan");
      try {
        const result = await invoke<PlatformScanBundle>("scan_repo", {
          repoPath: path,
          profile,
        });
        setBundle(result);
        setPlatform(pickDefaultPlatform(result.platforms));
        setPage("score");
        setError(null);
      } catch (e) {
        setError(String(e));
        setPage("scan");
      } finally {
        setLoading(false);
      }
    },
    [profile],
  );

  const pickRepo = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select repository root",
    });
    if (typeof selected === "string") {
      await runScan(selected);
    }
  };

  const openInAgent = (path: string) => {
    setAgentPath(path);
    if (bundle?.platforms.includes("rolesync") && path.replace(/\\/g, "/").startsWith(".agents/")) {
      setPlatform("rolesync");
    }
    setPage("agent");
  };

  const goToAgent = useCallback(() => {
    if (bundle && roleSyncDetected(bundle) && bundle.platforms.includes("rolesync")) {
      setPlatform("rolesync");
    }
    setPage("agent");
  }, [bundle]);

  const showScanPage = page === "scan";
  const showResults = report && RESULT_PAGES.includes(page);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        maxHeight: "100%",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <AppSidebar
        page={page}
        onPage={(p) => {
          if (p === "agent") goToAgent();
          else setPage(p);
        }}
        report={report}
        loading={loading}
        onPickFolder={() => void pickRepo()}
      />

      <Box
        component="main"
        sx={{
          flex: 1,
          width: `calc(100% - ${drawerWidth}px)`,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {showScanPage && (
          <Box className={APP_SCROLL_CLASS} sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <ScanPage
              loading={loading}
              error={error}
              onPickFolder={() => void pickRepo()}
              bundle={bundle}
              onOpenLast={() => setPage("score")}
            />
          </Box>
        )}

        {!showScanPage && (
          <Box
            className={page === "agent" ? undefined : APP_SCROLL_CLASS}
            sx={{
              px: { xs: 2, sm: 3, md: 4 },
              py: page === "agent" ? { xs: 1, sm: 1.25 } : 3,
              maxWidth: page === "agent" ? "none" : 1200,
              pr: page === "agent" ? { md: 2 } : undefined,
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: page === "agent" ? "hidden" : "auto",
            }}
          >
            {loading && (
              <Box sx={{ mb: 2 }}>
                <ScanProgressBar active />
              </Box>
            )}

            <Box sx={{ flexShrink: 0 }}>
              {bundle && report && RESULT_PAGES.includes(page) ? (
                <ReportContextBar
                  page={page}
                  bundle={bundle}
                  platform={platform}
                  report={report}
                  onPlatform={setPlatform}
                />
              ) : (
                <PageHeader page={page} />
              )}
            </Box>

            {page === "settings" && (
              <SettingsPage
                onProfileSaved={(r) => {
                  setProfile(r.activeProfile);
                }}
              />
            )}

            {showResults && page === "score" && (
              <ScorePage
                report={report}
                onGoTo={(p) => {
                  if (p === "agent") goToAgent();
                  else setPage(p);
                }}
              />
            )}
            {showResults && page === "issues" && (
              <IssuesPage report={report} onOpenFile={openInAgent} />
            )}
            {showResults && page === "charts" && <ChartsPage report={report} />}
            {showResults && page === "browse" && profile && (
              <BrowsePage
                report={report}
                initialPath={browsePath}
                profile={profile}
                onInitialConsumed={() => setBrowsePath(null)}
                onOpenInAgent={openInAgent}
              />
            )}
            {showResults && page === "agent" && profile && (
              <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", mt: 0.5 }}>
                <AgentPage
                  bundle={bundle}
                  report={report}
                  platform={platform}
                  profile={profile}
                  initialPath={agentPath}
                  onInitialConsumed={() => setAgentPath(null)}
                  onOpenSettings={setPage}
                />
              </Box>
            )}

            {RESULT_PAGES.includes(page) && !report && (
              <Typography
                sx={{ py: 4, textAlign: "center", color: "text.secondary", lineHeight: 1.6 }}
              >
                {copy.scan.noResultsYet}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default App;