import get from "lodash/get";
import { v4 as uuidv4 } from "uuid";
import { message } from "antd";

import { queryExamPaperOcrTaskResult } from "../../../services/example";
import {
  DEFAULT_BATCH_ANALYSIS_PROMPT,
  DEFAULT_BATCH_QUALITY_CHECK_PROMPT,
  enhanceSingleQuestionFields,
} from "../../../services/questionTaskAi";
import {
  queryQuestionAnalysisTasks,
  queryQuestionQualityCheckTasks,
  queryQuestionTaskPrompts,
} from "../../../services/questionTaskAiTask";
import { trans } from "../../../utils/i18n";
import {
  buildVisibleQuestionState,
  buildQuestionAiQualityCheck,
  hasQuestionAnalysis,
  hasQuestionAnswer,
  normalizeTaskResult,
} from "../domain/questionTaskViewModel";
import { assignMissingTaskResultQuestionUuids } from "../domain/questionTaskUuidModel";
import {
  buildAiPreviewQuestion,
  getFirstAiReviewId,
} from "../ai/questionTaskAiDiffModel";
import { buildClearQuestionQualityCheckPatch } from "./questionTaskQuestionMutationModel";

export { saveBatchAiModalSettings } from "./questionTaskAiPromptSettingsModel";

const AI_TASK_QUERY_BATCH_SIZE = 100;
const QUALITY_PROMPT_KEY = "quality_check";
const LEGACY_BATCH_ANALYSIS_PROMPT =
  "请为缺少答案或解析的题目补充参考答案和解析。答案应准确、简洁，解析应便于教师快速复核；已有答案或解析的字段不要覆盖。";
const LEGACY_BATCH_QUALITY_CHECK_PROMPT =
  "请按正式出版级标准，对每道题进行通用质检。请同时检查题干、选项、答案、解析、分数、格式、错别字、语义准确性、逻辑一致性，以及答案与解析是否匹配。请输出明确的风险等级（质检通过/低风险/高风险）、错误类型、质检结果和简洁修改建议。";
const ANALYSIS_PROMPT_KEY_MAP = {
  answer: "essay",
  blank: "filled_in",
  choice: "choice",
  judge: "judge",
  prompt: "analysis_extra",
};
const AI_ANALYSIS_CHANGE_FIELDS = [
  "analysis",
  "analysisTaskErrorMessage",
  "analysisTaskStatus",
  "answer",
  "aiQualityCheck",
  "qualityCheckTaskErrorMessage",
  "qualityCheckTaskStatus",
];
const AI_ANALYSIS_SERIALIZED_CHANGE_FIELDS = [
  "gapFillingAnswer",
  "qualityCheckResult",
];
const AI_QUALITY_CHANGE_FIELDS = [
  "qualityCheckTaskErrorMessage",
  "qualityCheckTaskStatus",
];
const AI_QUALITY_SERIALIZED_CHANGE_FIELDS = [
  "aiQualityCheck",
  "qualityCheckResult",
];

const getArrayItem = (items, index) =>
  (Array.isArray(items) ? items : []).slice(index, index + 1).shift();

const getPromptItemValue = (promptItems, key) =>
  (Array.isArray(promptItems) ? promptItems : []).find(
    (item) => item && item.key === key,
  )?.prompt || "";

const localizeLegacyPrompt = (prompt, legacyPrompt, nextPrompt) =>
  prompt === legacyPrompt ? nextPrompt : prompt;

export const getQuestionTaskLanguageCode = (event) => {
  void event;

  return String(window?.globalLange || navigator?.language || "en")
    .toLowerCase()
    .startsWith("en")
    ? "en"
    : "cn";
};

export const buildBatchAiSettingsFromPromptItems = (
  promptItems,
  normalizeBatchAiSettings,
) =>
  normalizeBatchAiSettings({
    prompt: localizeLegacyPrompt(
      getPromptItemValue(promptItems, "analysis_extra"),
      LEGACY_BATCH_ANALYSIS_PROMPT,
      DEFAULT_BATCH_ANALYSIS_PROMPT,
    ),
    typeExamples: Object.fromEntries(
      Object.entries(ANALYSIS_PROMPT_KEY_MAP).map(([fieldKey, promptKey]) => [
        fieldKey,
        getPromptItemValue(promptItems, promptKey),
      ]),
    ),
  });

export const buildBatchQualitySettingsFromPromptItems = (
  promptItems,
  normalizeBatchQualitySettings,
) =>
  normalizeBatchQualitySettings({
    prompt: localizeLegacyPrompt(
      getPromptItemValue(promptItems, QUALITY_PROMPT_KEY),
      LEGACY_BATCH_QUALITY_CHECK_PROMPT,
      DEFAULT_BATCH_QUALITY_CHECK_PROMPT,
    ),
  });

const chunkArray = (items, size = AI_TASK_QUERY_BATCH_SIZE, startIndex = 0) => {
  const source = Array.isArray(items) ? items : [];

  if (startIndex >= source.length) {
    return [];
  }

  return [
    source.slice(startIndex, startIndex + size),
    ...chunkArray(source, size, startIndex + size),
  ];
};

const getVisibleQuestionsWithTasks = (taskResult) =>
  buildVisibleQuestionState(taskResult && taskResult.pages).questions;

const getQuestionDataChildByQuestion = (
  childQuestionDataList,
  childQuestion,
  index,
) =>
  (Array.isArray(childQuestionDataList) ? childQuestionDataList : []).find(
    (item) =>
      item &&
      childQuestion &&
      item.uuid &&
      childQuestion.uuid &&
      item.uuid === childQuestion.uuid,
  ) || getArrayItem(childQuestionDataList, index);

const buildBlankAnalysisAnswerPatch = (question, questionData) => {
  if (questionData.gapFillingAnswer) {
    return {
      gapFillingAnswer: {
        ...questionData.gapFillingAnswer,
      },
    };
  }

  if (questionData.answer === undefined) {
    return question.gapFillingAnswer
      ? { gapFillingAnswer: question.gapFillingAnswer }
      : {};
  }

  return {
    gapFillingAnswer: {
      ...(question.gapFillingAnswer || {
        answers: [],
        isOrder: false,
      }),
      answers: [questionData.answer],
    },
  };
};

const buildAnalysisAnswerPatch = (
  question,
  questionData,
  questionTypeBlank,
) => {
  if (hasQuestionAnswer(question)) {
    return {
      answer: question.answer,
      gapFillingAnswer: question.gapFillingAnswer,
    };
  }

  if (Number(question.type) === questionTypeBlank) {
    return buildBlankAnalysisAnswerPatch(question, questionData);
  }

  return questionData.answer === undefined
    ? {}
    : { answer: questionData.answer };
};

const buildAnalysisQualityResetPatch = (analysisItem) =>
  analysisItem.status === "SUCCEEDED"
    ? buildClearQuestionQualityCheckPatch()
    : {};

const hasQuestionFieldChanged = (previousQuestion, nextQuestion, field) =>
  get(previousQuestion, [field]) !== get(nextQuestion, [field]);

const hasQuestionSerializedFieldChanged = (
  previousQuestion,
  nextQuestion,
  field,
) =>
  JSON.stringify(get(previousQuestion, [field])) !==
  JSON.stringify(get(nextQuestion, [field]));

const hasAnalysisQuestionChanged = (childChanged, question, mergedQuestion) =>
  childChanged ||
  AI_ANALYSIS_CHANGE_FIELDS.some((field) =>
    hasQuestionFieldChanged(question, mergedQuestion, field),
  ) ||
  AI_ANALYSIS_SERIALIZED_CHANGE_FIELDS.some((field) =>
    hasQuestionSerializedFieldChanged(question, mergedQuestion, field),
  );

const mergeAnalysisTaskQuestion = (
  question,
  analysisItem,
  questionTypeBlank,
) => {
  if (!question || !analysisItem) {
    return { changed: false, question };
  }

  const questionData = analysisItem.questionData || {};
  const questionDataChildren = Array.isArray(questionData.sonQuestionList)
    ? questionData.sonQuestionList
    : [];
  const childResults = (
    Array.isArray(question.sonQuestionList) ? question.sonQuestionList : []
  ).map((childQuestion, index) => {
    const childQuestionData = getQuestionDataChildByQuestion(
      questionDataChildren,
      childQuestion,
      index,
    );

    return childQuestionData
      ? mergeAnalysisTaskQuestion(
          childQuestion,
          {
            ...analysisItem,
            questionData: childQuestionData,
          },
          questionTypeBlank,
        )
      : { changed: false, question: childQuestion };
  });
  const childMergeResult = {
    changed: childResults.some((childResult) => childResult.changed),
    sonQuestionList: childResults.map((childResult) => childResult.question),
  };
  const mergedQuestion = {
    ...question,
    ...questionData,
    ...buildAnalysisAnswerPatch(question, questionData, questionTypeBlank),
    ...(hasQuestionAnalysis(question) ? { analysis: question.analysis } : {}),
    ...buildAnalysisQualityResetPatch(analysisItem),
    analysisTaskErrorMessage: analysisItem.errorMessage || "",
    analysisTaskStatus: analysisItem.status,
    sonQuestionList: childMergeResult.sonQuestionList,
  };

  return {
    changed: hasAnalysisQuestionChanged(
      childMergeResult.changed,
      question,
      mergedQuestion,
    ),
    question: mergedQuestion,
  };
};

const buildQualityResultPatch = (question, qualityItem) =>
  qualityItem.qualityResult
    ? {
        aiQualityCheck: buildQuestionAiQualityCheck(qualityItem.qualityResult),
        qualityCheckResult: {
          ...qualityItem.qualityResult,
        },
      }
    : {
        aiQualityCheck: question.aiQualityCheck,
        qualityCheckResult: question.qualityCheckResult,
      };

const hasQualityQuestionChanged = (question, mergedQuestion) =>
  AI_QUALITY_CHANGE_FIELDS.some((field) =>
    hasQuestionFieldChanged(question, mergedQuestion, field),
  ) ||
  AI_QUALITY_SERIALIZED_CHANGE_FIELDS.some((field) =>
    hasQuestionSerializedFieldChanged(question, mergedQuestion, field),
  );

const mergeQualityTaskQuestion = (question, qualityItem) => {
  if (!question || !qualityItem) {
    return { changed: false, question };
  }

  const mergedQuestion = {
    ...question,
    ...buildQualityResultPatch(question, qualityItem),
    qualityCheckTaskErrorMessage: qualityItem.errorMessage || "",
    qualityCheckTaskStatus: qualityItem.status,
  };

  return {
    changed: hasQualityQuestionChanged(question, mergedQuestion),
    question: mergedQuestion,
  };
};

const applyTaskItemsToQuestion = (
  question,
  analysisItem,
  qualityItem,
  blank,
) => {
  const analysisResult = analysisItem
    ? mergeAnalysisTaskQuestion(question, analysisItem, blank)
    : { changed: false, question };
  const qualityResult = qualityItem
    ? mergeQualityTaskQuestion(analysisResult.question, qualityItem)
    : { changed: false, question: analysisResult.question };

  return {
    changed: analysisResult.changed || qualityResult.changed,
    question: qualityResult.question,
  };
};

export const createAiModalState = (
  defaultAiModel,
  createEmptyTypeExamples,
) => ({
  batchActionType: "analysis",
  loading: false,
  mode: "batch",
  model: defaultAiModel,
  activeReviewId: "",
  previewFields: [],
  previewPatch: undefined,
  prompt: "",
  reviewDecisions: {},
  reviewFuture: [],
  reviewHistory: [],
  targetFields: [],
  typeExamples: createEmptyTypeExamples(),
  visible: false,
  questionId: "",
});

export const createAiPopoverState = (event) => {
  void event;

  return {
    left: 0,
    reviewId: "",
    top: 0,
    visible: false,
  };
};

export const hasQuestionAiSupplementTarget = (question) =>
  !!question &&
  (!hasQuestionAnswer(question) || !hasQuestionAnalysis(question));

export const getResponseErrorMessage = (response) =>
  (response && (response.message || (response.err && response.err.message))) ||
  trans("questionTask.requestFailed", "请求失败");

export const getAiGenerateFailedMessage = (error) =>
  (error && error.message) ||
  trans("questionTask.aiGenerateFailed", "AI 生成失败");

export const showAiGenerateError = (error) => {
  message.error(getAiGenerateFailedMessage(error));
};

export const assertTaskResponseContent = (response) => {
  if (response && response.status && response.content) {
    return response.content;
  }

  return new Function("error", "throw error")(
    new Error(getResponseErrorMessage(response)),
  );
};

const buildTaskItemMap = (items) =>
  new Map(
    (Array.isArray(items) ? items : [])
      .filter((item) => item && item.uuid)
      .map((item) => [item.uuid, item]),
  );

const mergeTaskItemsIntoPage = (
  page,
  analysisItemMap,
  qualityItemMap,
  blank,
) => {
  const questionResults = (
    Array.isArray(page.questions) ? page.questions : []
  ).map((question) =>
    applyTaskItemsToQuestion(
      question,
      analysisItemMap.get(question.uuid),
      qualityItemMap.get(question.uuid),
      blank,
    ),
  );
  const changed = questionResults.some((result) => result.changed);

  return {
    changed,
    page: changed
      ? {
          ...page,
          questions: questionResults.map((result) => result.question),
        }
      : page,
  };
};

export const mergeTaskItemsIntoTaskResult = (
  taskResult,
  questionTypeBlank,
  { analysisItems = [], qualityItems = [] } = {},
) => {
  if (!taskResult) {
    return { changed: false, taskResult };
  }

  const analysisItemMap = buildTaskItemMap(analysisItems);
  const qualityItemMap = buildTaskItemMap(qualityItems);
  const pageResults = (
    Array.isArray(taskResult.pages) ? taskResult.pages : []
  ).map((page) =>
    mergeTaskItemsIntoPage(
      page,
      analysisItemMap,
      qualityItemMap,
      questionTypeBlank,
    ),
  );
  const changed = pageResults.some((result) => result.changed);

  return {
    changed,
    taskResult: changed
      ? {
          ...taskResult,
          pages: pageResults.map((result) => result.page),
        }
      : taskResult,
  };
};

export const getFoundTaskItems = (content) =>
  (Array.isArray(content && content.items) ? content.items : []).filter(
    (item) => item && item.found !== false,
  );

const queryTaskItemChunk = async (uuidChunk, queryFunction) => {
  if (uuidChunk.length === 0) {
    return [];
  }

  const content = assertTaskResponseContent(
    await queryFunction({ uuids: uuidChunk }),
  );

  return getFoundTaskItems(content);
};

const queryTaskItemsFromChunks = async (
  uuidChunks,
  queryFunction,
  chunkIndex = 0,
  items = [],
) => {
  if (chunkIndex >= uuidChunks.length) {
    return items;
  }

  const chunkItems = await queryTaskItemChunk(
    getArrayItem(uuidChunks, chunkIndex),
    queryFunction,
  );

  return queryTaskItemsFromChunks(uuidChunks, queryFunction, chunkIndex + 1, [
    ...items,
    ...chunkItems,
  ]);
};

export const queryTaskItemsInChunks = async (uuids, queryFunction) => {
  const uniqueUuids = [
    ...new Set((Array.isArray(uuids) ? uuids : []).filter(Boolean)),
  ];

  return queryTaskItemsFromChunks(chunkArray(uniqueUuids), queryFunction);
};

const getQuestionUuidsForAiTaskState = (taskResult) =>
  getVisibleQuestionsWithTasks(taskResult)
    .map((question) => question.uuid)
    .filter(Boolean);

const loadQuestionTaskPromptSettings = async ({
  mountState,
  normalizeBatchAiSettings,
  normalizeBatchQualitySettings,
  setBatchAiSettings,
  setBatchQualitySettings,
  taskId,
}) => {
  try {
    const promptContent = assertTaskResponseContent(
      await queryQuestionTaskPrompts({ taskId }),
    );

    if (mountState.mounted) {
      setBatchAiSettings(
        buildBatchAiSettingsFromPromptItems(
          promptContent.prompts,
          normalizeBatchAiSettings,
        ),
      );
      setBatchQualitySettings(
        buildBatchQualitySettingsFromPromptItems(
          promptContent.prompts,
          normalizeBatchQualitySettings,
        ),
      );
    }
  } catch (error) {
    void error;
  }
};

const queryInitialQuestionAiTaskItems = async (taskResult) => {
  const questionUuids = getQuestionUuidsForAiTaskState(taskResult);
  const analysisItems = await queryTaskItemsInChunks(
    questionUuids,
    queryQuestionAnalysisTasks,
  ).catch(() => []);
  const qualityItems = await queryTaskItemsInChunks(
    questionUuids,
    queryQuestionQualityCheckTasks,
  ).catch(() => []);

  return {
    analysisItems,
    qualityItems,
  };
};

const shouldUseServerAiTaskState = (taskId) => taskId !== "mock";

const buildInitialAiTaskResultState = async (
  taskId,
  normalizedTaskResult,
  questionTypeBlank,
) => {
  const taskResultWithUuids = assignMissingTaskResultQuestionUuids(
    normalizedTaskResult,
    uuidv4,
  );
  const uuidChanged =
    JSON.stringify(normalizedTaskResult.pages) !==
    JSON.stringify(taskResultWithUuids.pages);

  if (taskId === "mock") {
    return {
      changed: uuidChanged,
      taskResult: taskResultWithUuids,
    };
  }

  const taskItems = await queryInitialQuestionAiTaskItems(taskResultWithUuids);
  const mergeResult = mergeTaskItemsIntoTaskResult(
    taskResultWithUuids,
    questionTypeBlank,
    taskItems,
  );

  return {
    changed: uuidChanged || mergeResult.changed,
    taskResult: mergeResult.taskResult,
  };
};

export const loadInitialQuestionTaskState = async ({
  mountState,
  normalizeBatchAiSettings,
  normalizeBatchQualitySettings,
  questionTypeBlank,
  setBatchAiSettings,
  setBatchQualitySettings,
  taskId,
}) => {
  const response = await queryExamPaperOcrTaskResult({ taskId });

  if (!mountState.mounted) {
    return;
  }

  const normalizedTaskResult = normalizeTaskResult(
    assertTaskResponseContent(response),
  );

  if (shouldUseServerAiTaskState(taskId)) {
    await loadQuestionTaskPromptSettings({
      mountState,
      normalizeBatchAiSettings,
      normalizeBatchQualitySettings,
      setBatchAiSettings,
      setBatchQualitySettings,
      taskId,
    });
  }

  return buildInitialAiTaskResultState(
    taskId,
    normalizedTaskResult,
    questionTypeBlank,
  );
};

export const applyInitialQuestionTaskState = ({
  initialTaskState,
  mountState,
  setTaskResult,
  silentSaveAiTaskState,
  taskId,
}) => {
  if (!mountState.mounted || !initialTaskState) {
    return;
  }

  if (shouldUseServerAiTaskState(taskId) && initialTaskState.changed) {
    void silentSaveAiTaskState(initialTaskState.taskResult);
  }

  setTaskResult(initialTaskState.taskResult);
};

export const reportInitialQuestionTaskLoadError = ({
  error,
  mountState,
  setTaskResult,
}) => {
  if (!mountState.mounted) {
    return;
  }

  message.error(
    (error && error.message) || trans("questionTask.requestFailed", "请求失败"),
  );
  setTaskResult();
};

export const finishQuestionTaskLoading = ({ mountState, setLoading }) => {
  if (mountState.mounted) {
    setLoading(false);
  }
};

export const getSingleAiPrompt = (aiModal) =>
  String(aiModal.prompt || "").trim();

export const buildSingleAiPreviewPatch = (aiModal, responsePatch) => ({
  ...aiModal.previewPatch,
  ...responsePatch,
});

export const applySingleAiPreviewState = (
  setAiModal,
  previewFields,
  nextPreviewPatch,
) => {
  setAiModal((previousState) => ({
    ...previousState,
    activeReviewId: getFirstAiReviewId(previewFields),
    loading: false,
    previewFields,
    previewPatch: nextPreviewPatch,
    prompt: "",
    reviewDecisions: {},
    reviewFuture: [],
    reviewHistory: [],
  }));
};

export const canRunSingleAiSend = ({ aiModal, aiTargetQuestion, prompt }) => {
  if (aiModal.loading) {
    return false;
  }

  if (!aiTargetQuestion) {
    message.error(
      trans("questionTask.missingCurrentQuestion", "未找到当前题目"),
    );
    return false;
  }

  if (!prompt) {
    message.error(trans("questionTask.missingAiPrompt", "请先填写修改要求"));
    return false;
  }

  return true;
};

export const resetSingleAiLoading = (setAiModal) => {
  setAiModal((previousState) => ({ ...previousState, loading: false }));
};

export const hasSingleAiPatchContent = (responsePatch, setAiModal) => {
  if (Object.keys(responsePatch).length > 0) {
    return true;
  }

  message.info(trans("questionTask.emptyAiPatch", "AI 未返回可应用的修改内容"));
  resetSingleAiLoading(setAiModal);
  return false;
};

export const hasSingleAiPreviewFields = (previewFields, setAiModal) => {
  if (previewFields.length > 0) {
    return true;
  }

  message.info(trans("questionTask.emptyAiPatch", "AI 未返回可应用的修改内容"));
  resetSingleAiLoading(setAiModal);
  return false;
};

export const requestSingleAiPatch = async ({
  aiModal,
  aiTargetQuestion,
  prompt,
}) => {
  const currentPreviewQuestion = buildAiPreviewQuestion(
    aiTargetQuestion,
    aiModal.previewPatch,
  );

  return enhanceSingleQuestionFields({
    model: aiModal.model,
    prompt,
    question: currentPreviewQuestion || aiTargetQuestion,
    targetFields: aiModal.targetFields,
  });
};

export const canConfirmAiModal = ({ aiModal, aiTargetQuestion }) => {
  if (aiModal.loading) {
    return false;
  }

  if (aiModal.mode === "single" && !aiTargetQuestion) {
    message.error(
      trans("questionTask.missingCurrentQuestion", "未找到当前题目"),
    );
    return false;
  }

  return true;
};
