import { message } from "antd";

import { trans } from "../../../utils/i18n";
import { buildAcceptedAiPreviewPatch } from "../ai/questionTaskAiAcceptPatchModel";
import { saveBatchAiModalSettings } from "./questionTaskAiPromptSettingsModel";
import { buildClearQuestionQualityCheckPatch } from "./questionTaskQuestionMutationModel";

const confirmBatchAiModal = async ({
  aiModal,
  closeAiModal,
  defaultAiModel,
  getTypeExampleValue,
  normalizeBatchAiSettings,
  normalizeBatchQualitySettings,
  setAiModal,
  setBatchAiSettings,
  setBatchQualitySettings,
  taskId,
}) => {
  setAiModal((previousState) => ({
    ...previousState,
    loading: true,
  }));
  await saveBatchAiModalSettings({
    aiModal,
    closeAiModal,
    defaultAiModel,
    getTypeExampleValue,
    normalizeBatchAiSettings,
    normalizeBatchQualitySettings,
    setBatchAiSettings,
    setBatchQualitySettings,
    taskId,
  });
};

const confirmSingleAiModal = async ({
  aiModal,
  aiTargetQuestion,
  applyQuestionPatches,
  closeAiModal,
}) => {
  if (!aiModal.previewPatch || aiModal.previewFields.length === 0) {
    message.info(
      trans("questionTask.aiPreviewRequired", "请先发送修改请求生成预览"),
    );
    return;
  }

  applySingleAiModalAcceptedPatch({
    aiModal,
    aiTargetQuestion,
    applyQuestionPatches,
    closeAiModal,
  });
};

const applySingleAiModalAcceptedPatch = ({
  aiModal,
  aiTargetQuestion,
  applyQuestionPatches,
  closeAiModal,
}) => {
  const acceptedPatch = buildAcceptedAiPreviewPatch({
    previewFields: aiModal.previewFields,
    previewPatch: aiModal.previewPatch,
    question: aiTargetQuestion,
    reviewDecisions: aiModal.reviewDecisions,
  });

  if (Object.keys(acceptedPatch).length === 0) {
    message.info(
      trans(
        "questionTask.missingAiAcceptSelection",
        "请先确认至少一项变更，或点击一键确认所有变更",
      ),
    );
    return;
  }

  applyQuestionPatches([
    {
      draftId: aiTargetQuestion.draftId,
      patch: {
        ...acceptedPatch,
        ...buildClearQuestionQualityCheckPatch(),
      },
    },
  ]);
  message.success(
    trans("questionTask.aiAcceptApplied", "已应用确认的 AI 修改"),
  );
  closeAiModal();
};

const AI_MODAL_CONFIRM_REGISTRY = new Map([
  ["batch", confirmBatchAiModal],
  ["single", confirmSingleAiModal],
]);

export const confirmQuestionTaskAiModal = async (context) => {
  const confirmAction =
    AI_MODAL_CONFIRM_REGISTRY.get(context.aiModal.mode) ||
    AI_MODAL_CONFIRM_REGISTRY.get("single");

  await confirmAction(context);
};
