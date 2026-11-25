import Box from "@mui/material/Box";
import { AgentWorkspace } from "../components/AgentWorkspace";
import type { NavPage } from "../layout/AppSidebar";
import type { PlatformScanBundle, ProfileRef, ScanReport } from "../types/scan";

export function AgentPage({
  bundle,
  report,
  platform,
  profile,
  initialPath,
  onInitialConsumed,
  onOpenSettings,
}: {
  bundle: PlatformScanBundle | null;
  report: ScanReport;
  platform: string;
  profile: ProfileRef;
  initialPath: string | null;
  onInitialConsumed: () => void;
  onOpenSettings: (page: NavPage) => void;
}) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <AgentWorkspace
        bundle={bundle}
        report={report}
        platform={platform}
        profile={profile}
        initialPath={initialPath}
        onInitialConsumed={onInitialConsumed}
        onOpenSettings={onOpenSettings}
      />
    </Box>
  );
}