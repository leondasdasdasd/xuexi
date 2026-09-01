import { trans } from "../../utils/i18n";

const legacyMigrationMessage = () =>
  trans(
    "explicitExam.legacyMigrationRequired",
    "该历史考试保持 LEGACY，尚未迁移到 V2，当前页面不可用",
  );

// 后端 V2 reader 使用 requiredContractVersion=V2 明确拒绝 LEGACY 试卷。
export const mapExplicitExamLoadError = (error: unknown): Error => {
  const source = error instanceof Error ? error : new Error(String(error));
  return source.message.includes("requiredContractVersion=V2")
    ? new Error(legacyMigrationMessage())
    : source;
};
