import GlobalStyles from "@mui/material/GlobalStyles";
import { alpha } from "@mui/material/styles";

export const APP_SCROLL_CLASS = "app-scroll";

const thumb = alpha("#94a3b8", 0.38);
const thumbHover = alpha("#5eead4", 0.55);

/** Scrollbar styling for intentional scroll regions — not global `*`. */
export function ThemeScrollbars() {
  return (
    <GlobalStyles
      styles={{
        html: {
          height: "100%",
          overflow: "hidden",
        },
        body: {
          height: "100%",
          margin: 0,
          overflow: "hidden",
        },
        "#root": {
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        },
        [`.${APP_SCROLL_CLASS}`]: {
          scrollbarWidth: "thin",
          scrollbarColor: `${thumb} transparent`,
        },
        [`.${APP_SCROLL_CLASS}::-webkit-scrollbar`]: {
          width: 6,
          height: 6,
        },
        [`.${APP_SCROLL_CLASS}::-webkit-scrollbar-track`]: {
          background: "transparent",
        },
        [`.${APP_SCROLL_CLASS}::-webkit-scrollbar-thumb`]: {
          backgroundColor: thumb,
          borderRadius: 999,
          border: "2px solid transparent",
          backgroundClip: "content-box",
        },
        [`.${APP_SCROLL_CLASS}::-webkit-scrollbar-thumb:hover`]: {
          backgroundColor: thumbHover,
        },
        [`.${APP_SCROLL_CLASS}::-webkit-scrollbar-corner`]: {
          background: "transparent",
        },
      }}
    />
  );
}