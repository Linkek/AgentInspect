import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Box from "@mui/material/Box";
import { useState } from "react";
import { ChartsPanel } from "../components/ChartsPanel";
import { ContextTaxPanel } from "../components/ContextTaxPanel";
import { FilesTable } from "../components/FilesTable";
import { DuplicatesPanel } from "../components/DuplicatesPanel";
import { RoleSyncPanel } from "../components/RoleSyncPanel";
import { SummaryCards } from "../components/SummaryCards";
import { copy } from "../content/uiCopy";
import type { ScanReport } from "../types/scan";

export function ChartsPage({ report }: { report: ScanReport }) {
  const [tab, setTab] = useState(0);
  const showRoleSync = report.rolesync.detected;

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label={copy.report.analyticsTabs.glance} />
        <Tab label={copy.report.analyticsTabs.detail} />
        <Tab label={copy.report.analyticsTabs.files} />
      </Tabs>

      {tab === 0 && (
        <Box>
          <SummaryCards scan={report} />
          <ContextTaxPanel report={report} />
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <ChartsPanel scan={report} />
          <DuplicatesPanel groups={report.duplicateGroups} />
          {showRoleSync && <RoleSyncPanel info={report.rolesync} />}
        </Box>
      )}

      {tab === 2 && <FilesTable files={report.files} />}
    </Box>
  );
}