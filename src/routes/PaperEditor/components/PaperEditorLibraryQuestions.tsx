import type React from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  appendPaperQuestionsFromLibrary,
  collectPaperQuestionIds,
} from "../paperEditorModel";
import type { PaperQuestionAssetResult } from "../questionAssetPaperAdapter";
import type { GradeOption, PaperEditorDraft, SubjectOption } from "../types";
import PaperQuestionLibraryModal from "./PaperQuestionLibraryModal";

export interface QuestionLibraryTarget {
  initialQuestionTypeKey?: number;
  moduleKey: string;
}

interface Props {
  draft: PaperEditorDraft;
  grades: GradeOption[];
  locale: "en-US" | "zh-CN";
  onClose: () => void;
  setDraft: Dispatch<SetStateAction<PaperEditorDraft | null>>;
  subjects: SubjectOption[];
  target?: QuestionLibraryTarget;
}

/**
 * 将题库选择结果收口为 PaperEditor 草稿更新，并保持试卷保存边界独立。
 * @param {Props} properties 当前草稿、目标题型模块和关闭回调。
 * @returns {React.ReactElement|null} 题库选择弹窗或空内容。
 */
function PaperEditorLibraryQuestions(
  properties: Props,
): React.ReactElement | null {
  const { draft, grades, locale, onClose, setDraft, subjects, target } =
    properties;
  if (!target) return null;
  return (
    <PaperQuestionLibraryModal
      excludedQuestionIds={collectPaperQuestionIds(draft)}
      gradeOptions={grades}
      initialGradeId={draft.gradeId}
      initialQuestionTypeKey={target.initialQuestionTypeKey}
      initialSubjectId={draft.subjectId}
      locale={locale}
      onCancel={onClose}
      onConfirm={(results: PaperQuestionAssetResult[]) => {
        const nextDraft = appendPaperQuestionsFromLibrary(
          draft,
          target.moduleKey,
          results,
        );
        setDraft(nextDraft);
        onClose();
      }}
      subjectOptions={subjects}
      visible
    />
  );
}

export default PaperEditorLibraryQuestions;
