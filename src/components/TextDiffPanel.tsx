/** @deprecated Use ChangeReviewPanel for AI improve flow. */
import { ChangeReviewPanel } from "./ChangeReviewPanel";

export function TextDiffPanel({ before, after }: { before: string; after: string }) {
  return <ChangeReviewPanel before={before} after={after} />;
}