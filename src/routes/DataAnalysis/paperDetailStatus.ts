export const PAPER_DETAIL_STATUS = {
  denied: "denied",
  error: "error",
  loading: "loading",
  ready: "ready",
} as const;

export type PaperDetailStatus =
  (typeof PAPER_DETAIL_STATUS)[keyof typeof PAPER_DETAIL_STATUS];

export const isValidPaperDetailId = (
  paperId?: number | null,
): paperId is number => !!paperId && Number.isInteger(paperId) && paperId > 0;
