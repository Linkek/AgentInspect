import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { copy } from "../content/uiCopy";
import type { NavPage } from "../layout/AppSidebar";

const titles: Record<NavPage, { title: string; subtitle: string }> = {
  scan: copy.pages.scan,
  score: copy.pages.overview,
  issues: copy.pages.issues,
  charts: copy.pages.analytics,
  browse: copy.pages.explorer,
  agent: copy.pages.agent,
  settings: copy.pages.settings,
};

export function PageHeader({ page }: { page: NavPage }) {
  const meta = titles[page];
  return (
    <Box
      sx={{
        mb: 3,
        pb: 2,
        borderBottom: `1px solid ${alpha("#fff", 0.06)}`,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
        {meta.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6, maxWidth: 640 }}>
        {meta.subtitle}
      </Typography>
    </Box>
  );
}