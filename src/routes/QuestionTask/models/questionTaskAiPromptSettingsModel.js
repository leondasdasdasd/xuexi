import { message } from "antd";

import { saveQuestionTaskPrompts } from "../../../services/questionTaskAiTask";
import { trans } from "../../../utils/i18n";

const buildBatchAnalysisPromptPayload = (settings, getTypeExampleValue) => ({
  prompts: {
    analysis_extra: typeof settings?.prompt === "string" ? settings.prompt : "",
    choice: getTypeExampleValue(settings, { key: "choice" }),
    essay: getTypeExampleValue(settings, { key: "answer" }),
    filled_in: getTypeExampleValue(settings, { key: "blank" }),
    judge: getTypeExampleValue(settings, { key: "judge" }),
  },
});

const buildBatchQualityPromptPayload = (settings) => ({
  prompts: {
    quality_check: typeof settings?.prompt === "string" ? settings.prompt : "",
  },
});

const BATCH_AI_PROMPT_PAYLOAD_REGISTRY = new Map([
  [
    "analysis",
    (aiModal, getTypeExampleValue) =>
      buildBatchAnalysisPromptPayload(aiModal, getTypeExampleValue),
  ],
  ["qualityCheck", (aiModal) => buildBatchQualityPromptPayload(aiModal)],
]);

const getBatchAiPromptPayloadBuilder = (batchActionType) =>
  BATCH_AI_PROMPT_PAYLOAD_REGISTRY.get(batchActionType) ||
  BATCH_AI_PROMPT_PAYLOAD_REGISTRY.get("analysis");

const getQuestionTaskPromptPayload = (
  taskId,
  aiModal,
  getTypeExampleValue,
) => ({
  prompts: getBatchAiPromptPayloadBuilder(aiModal.batchActionType)(
    aiModal,
    getTypeExampleValue,
  ).prompts,
  taskId,
});

const BATCH_AI_MODAL_SETTINGS_REGISTRY = new Map([
  [
    "analysis",
    {
      buildSettings: ({ aiModal, defaultAiModel, normalizeBatchAiSettings }) =>
        normalizeBatchAiSettings({
          model: defaultAiModel,
          prompt: aiModal.prompt,
          typeExamples: aiModal.typeExamples,
        }),
      saveMessage: (event) => {
        void event;

        return trans("questionTask.aiAnalysisPromptSaved", "AI 解析设置已保存");
      },
      setSettings: ({ nextSettings, setBatchAiSettings }) => {
        setBatchAiSettings(nextSettings);
      },
    },
  ],
  [
    "qualityCheck",
    {
      buildSettings: ({ aiModal, normalizeBatchQualitySettings }) =>
        normalizeBatchQualitySettings({
          prompt: aiModal.prompt,
        }),
      saveMessage: (event) => {
        void event;

        return trans("questionTask.aiQualityPromptSaved", "AI 质检设置已保存");
      },
      setSettings: ({ nextSettings, setBatchQualitySettings }) => {
        setBatchQualitySettings(nextSettings);
      },
    },
  ],
]);

const getBatchAiModalSettingsConfig = (batchActionType) =>
  BATCH_AI_MODAL_SETTINGS_REGISTRY.get(batchActionType) ||
  BATCH_AI_MODAL_SETTINGS_REGISTRY.get("analysis");

export const saveBatchAiModalSettings = async ({
  aiModal,
  closeAiModal,
  defaultAiModel,
  getTypeExampleValue,
  normalizeBatchAiSettings,
  normalizeBatchQualitySettings,
  setBatchAiSettings,
  setBatchQualitySettings,
  taskId,
}) => {
  if (taskId && taskId !== "mock") {
    await saveQuestionTaskPrompts(
      getQuestionTaskPromptPayload(taskId, aiModal, getTypeExampleValue),
    );
  }

  const settingsConfig = getBatchAiModalSettingsConfig(aiModal.batchActionType);
  const nextSettings = settingsConfig.buildSettings({
    aiModal,
    defaultAiModel,
    normalizeBatchAiSettings,
    normalizeBatchQualitySettings,
  });

  settingsConfig.setSettings({
    nextSettings,
    setBatchAiSettings,
    setBatchQualitySettings,
  });
  closeAiModal();
  message.success(settingsConfig.saveMessage());
};
