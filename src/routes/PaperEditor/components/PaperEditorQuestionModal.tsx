import type { Dispatch, SetStateAction } from "react";

import QuestionAssetEditorModal from "../../QuestionAssetInput/components/QuestionAssetEditorModal";
import type { QuestionAssetBusinessQuestionType } from "../../QuestionAssetInput/questionAssetEditorTypes";
import {
  appendPaperQuestionFromAsset,
  replacePaperQuestionFromAsset,
} from "../paperEditorModel";
import {
  createPaperQuestionAssetResult,
  type QuestionAssetSavedResource,
} from "../questionAssetPaperAdapter";
import type { PaperEditorDraft } from "../types";

interface Props {
  draft: PaperEditorDraft;
  editable: boolean;
  onClose: () => void;
  setDraft: Dispatch<SetStateAction<PaperEditorDraft | null>>;
  targetQuestionId: number | null | undefined;
}

const applySavedQuestion = (
  draft: PaperEditorDraft,
  targetQuestionId: number | null,
  result: ReturnType<typeof createPaperQuestionAssetResult>,
) =>
  targetQuestionId === null
    ? appendPaperQuestionFromAsset(draft, result)
    : replacePaperQuestionFromAsset(draft, targetQuestionId, result);

/**
 * 将题目录入弹窗的保存结果收口为 PaperEditor 草稿更新。
 * @param {Props} properties 当前试卷草稿、权限和弹窗状态。
 * @returns {React.ReactElement|null} PaperEditor 使用的题目录入弹窗。
 */
const PaperEditorQuestionModal = (properties: Props) => {
  const { draft, editable, onClose, setDraft, targetQuestionId } = properties;
  if (!editable || targetQuestionId === undefined) return null;
  return (
    <QuestionAssetEditorModal
      initialScope={{
        gradeId: draft.gradeId,
        subjectId: draft.subjectId,
      }}
      onCancel={onClose}
      onSaved={({
        questionTypes,
        resource,
      }: {
        questionTypes: QuestionAssetBusinessQuestionType[];
        resource: QuestionAssetSavedResource;
      }) => {
        const result = createPaperQuestionAssetResult(resource, questionTypes);
        const nextDraft = applySavedQuestion(draft, targetQuestionId, result);
        setDraft(nextDraft);
        onClose();
      }}
      questionId={targetQuestionId ?? undefined}
      visible
    />
  );
};

export default PaperEditorQuestionModal;
