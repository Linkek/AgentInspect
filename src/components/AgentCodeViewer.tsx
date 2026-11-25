import Box from "@mui/material/Box";
import { type CSSProperties } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { APP_SCROLL_CLASS } from "../themeScrollbars";

export function AgentCodeViewer({
  language,
  content,
  fontSize,
}: {
  language: string;
  content: string;
  fontSize: number;
}) {
  const lineSize = Math.max(9, fontSize - 2);

  return (
    <Box
      className={APP_SCROLL_CLASS}
      sx={{
        "& pre[class*='language-']": {
          fontSize: `${fontSize}px !important`,
          lineHeight: 1.55,
        },
        "& code": {
          fontSize: `${fontSize}px !important`,
          fontFamily: "inherit",
        },
        "& code span": {
          fontSize: `${fontSize}px !important`,
          lineHeight: "inherit !important",
        },
        "& .linenumber": {
          fontSize: `${lineSize}px !important`,
          minWidth: `${Math.max(2.25, fontSize * 0.22)}em !important`,
        },
      }}
    >
      <SyntaxHighlighter
        key={fontSize}
        language={language}
        style={vscDarkPlus}
        showLineNumbers
        wrapLongLines
        customStyle={{
          margin: 0,
          fontSize,
          lineHeight: 1.55,
          borderRadius: 0,
          background: "transparent",
        }}
        codeTagProps={{
          style: {
            fontSize,
            lineHeight: 1.55,
          },
        }}
        lineNumberStyle={{
          fontSize: lineSize,
          minWidth: "2.25em",
          paddingRight: "1em",
        }}
        lineProps={(): { style: CSSProperties } => ({ style: { display: "block" } })}
      >
        {content}
      </SyntaxHighlighter>
    </Box>
  );
}