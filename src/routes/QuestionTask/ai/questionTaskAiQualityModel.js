import { trans } from "../../../utils/i18n";

const cloneArrayValue = (value) => (Array.isArray(value) ? [...value] : []);

const normalizeQualityCheckStatus = (riskLevel) => {
  const normalizedRiskLevel = String(riskLevel || "").toLowerCase();

  if (
    normalizedRiskLevel === "high" ||
    normalizedRiskLevel === "high_risk" ||
    normalizedRiskLevel === "risk_high"
  ) {
    return "high";
  }

  if (
    normalizedRiskLevel === "low" ||
    normalizedRiskLevel === "low_risk" ||
    normalizedRiskLevel === "risk_low"
  ) {
    return "low";
  }

  return "pass";
};

const getQualityIssueCount = (qualityCheckResult) =>
  Array.isArray(qualityCheckResult.issueTypes)
    ? qualityCheckResult.issueTypes.length
    : Array.isArray(qualityCheckResult.issues)
      ? qualityCheckResult.issues.length
      : undefined;

const getQualityStatusLabel = (status) => {
  if (status === "high") {
    return trans("questionTask.aiQualityHighLabel", "高风险");
  }

  if (status === "low") {
    return trans("questionTask.aiQualityLowLabel", "低风险");
  }

  return trans("questionTask.aiQualityPassLabel", "质检通过");
};

const getQualityResultLabel = (status) => {
  if (status === "high") {
    return trans(
      "questionTask.aiQualityHighResult",
      "建议优先人工确认后再继续使用",
    );
  }

  if (status === "low") {
    return trans(
      "questionTask.aiQualityLowResult",
      "整体可用，但建议快速复核细节",
    );
  }

  return trans(
    "questionTask.aiQualityPassResult",
    "未发现明显错误，可进入下一步",
  );
};

const buildQualityCheckDisplay = (qualityCheckResult, status) => ({
  checkedAt: qualityCheckResult.checkedAt || "",
  formulaList: cloneArrayValue(qualityCheckResult.formulaList),
  issueCount: getQualityIssueCount(qualityCheckResult),
  issueTypes: cloneArrayValue(qualityCheckResult.issueTypes),
  issues: cloneArrayValue(qualityCheckResult.issues),
  label: qualityCheckResult.label || getQualityStatusLabel(status),
  promptSummary: qualityCheckResult.promptSummary || "",
  reportMarkdown:
    qualityCheckResult.riskItemsMarkdown ||
    qualityCheckResult.reportMarkdown ||
    "",
  resultLabel: qualityCheckResult.conclusion || getQualityResultLabel(status),
  status,
});

export const buildQuestionAiQualityCheck = (
  qualityCheckResult,
  fallbackQualityCheck,
) => {
  if (fallbackQualityCheck) {
    return {
      ...fallbackQualityCheck,
    };
  }

  if (!qualityCheckResult) {
    return;
  }

  const status = normalizeQualityCheckStatus(qualityCheckResult.riskLevel);

  return buildQualityCheckDisplay(qualityCheckResult, status);
};
