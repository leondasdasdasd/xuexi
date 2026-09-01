import {
  saveOcrTaskDraft,
  saveOcrTaskQuestions,
} from "../../../services/inputQuestion";
import { trans } from "../../../utils/i18n";
import { toQuestionTaskTransportQuestion } from "../domain/questionTaskTransportAdapter";

const QUESTION_TASK_SAVE_ACTION_REGISTRY = new Map([
  ["save", saveOcrTaskDraft],
  ["submit", saveOcrTaskQuestions],
]);

const getSavableQuestions = (questions) =>
  (Array.isArray(questions) ? questions : []).filter(
    (question) => !question.deleted,
  );

const getPageQuestions = (page) => {
  if (Array.isArray(page && page.questionList)) {
    return page.questionList;
  }
  if (Array.isArray(page && page.questions)) {
    return page.questions;
  }
  return [];
};

const buildPagesForSave = (pages) =>
  (Array.isArray(pages) ? pages : []).map((page) => ({
    errorMessage: (page && page.errorMessage) || "",
    imageUrl: (page && page.imageUrl) || "",
    itemStatus: page && page.itemStatus,
    pageIndex: page && page.pageIndex,
    questionList: getSavableQuestions(getPageQuestions(page)).map((question) =>
      toQuestionTaskTransportQuestion(question),
    ),
  }));

const buildAnswerPagesForSave = (answerPages) =>
  (Array.isArray(answerPages) ? answerPages : []).map((page) => ({
    errorMessage: (page && page.errorMessage) || "",
    imageUrl: (page && page.imageUrl) || "",
    itemStatus: page && page.itemStatus,
    pageIndex: page && page.pageIndex,
  }));

const countQuestionListItems = (questions, questionIndex = 0, total = 0) => {
  const savableQuestions = getSavableQuestions(questions);

  if (questionIndex >= savableQuestions.length) {
    return total;
  }

  const question = savableQuestions
    .slice(questionIndex, questionIndex + 1)
    .shift();
  const sonQuestionList = question && question.sonQuestionList;

  return countQuestionListItems(
    savableQuestions,
    questionIndex + 1,
    total + 1 + countQuestionListItems(sonQuestionList),
  );
};

const countSavableQuestions = (pages, pageIndex = 0, total = 0) => {
  const normalizedPages = Array.isArray(pages) ? pages : [];

  if (pageIndex >= normalizedPages.length) {
    return total;
  }

  return countSavableQuestions(
    normalizedPages,
    pageIndex + 1,
    total +
      countQuestionListItems(
        getPageQuestions(
          normalizedPages.slice(pageIndex, pageIndex + 1).shift(),
        ),
      ),
  );
};

const validateSaveContext = (saveContext) => {
  if (
    !saveContext ||
    !Array.isArray(saveContext.pages) ||
    countSavableQuestions(saveContext.pages) === 0
  ) {
    return new Error(
      trans("questionTask.noPendingQuestionToSave", "暂无待保存的题目"),
    );
  }

  if (
    saveContext.gradeId === undefined ||
    saveContext.subjectId === undefined
  ) {
    return new Error(
      trans("questionTask.missingSaveParams", "缺少保存所需的年级或学科信息"),
    );
  }

  return false;
};

const createSaveContextErrorThrower = (error) => (context) => {
  void context;

  if (error) {
    // 保存前校验需要维持同步失败，避免调用方继续提交无效 payload。
    return new Function("error", "throw error")(error);
  }

  return false;
};

export const buildQuestionTaskSavePayload = (saveContext) => {
  const validationError = validateSaveContext(saveContext);

  if (validationError) {
    createSaveContextErrorThrower(validationError)(saveContext);
  }

  return buildQuestionTaskSavePayloadFromContext(saveContext);
};

const buildQuestionTaskSavePayloadFromContext = (saveContext) => ({
  answerPages: buildAnswerPagesForSave(saveContext.answerPages),
  answerSheetErrorMessage: saveContext.answerSheetErrorMessage || "",
  answerSheetMarkdown: saveContext.answerSheetMarkdown || "",
  answerSheetStatus: saveContext.answerSheetStatus,
  examPaperId: saveContext.examPaperId,
  gradeId: saveContext.gradeId,
  pages: buildPagesForSave(saveContext.pages),
  status: saveContext.status,
  subjectId: saveContext.subjectId,
  taskId: saveContext.taskId,
});

const rejectSaveResponse = async (response) =>
  new Function("error", "throw error")(
    new Error(getSaveErrorMessage(response)),
  );

const countPayloadQuestions = (payload) =>
  countSavableQuestions(payload && payload.pages);

const requestQuestionTaskSave = (payload, action) => {
  const request =
    QUESTION_TASK_SAVE_ACTION_REGISTRY.get(action) ||
    QUESTION_TASK_SAVE_ACTION_REGISTRY.get("submit");
  return request(payload);
};

const isSuccessfulSaveResponse = (response) =>
  !!(response && response.status && response.content);

const getSaveErrorMessage = (response) =>
  (response && (response.message || (response.err && response.err.message))) ||
  trans("questionTask.saveFailed", "保存失败");

export const saveQuestionTask = async (payload, action = "submit") => {
  if (payload && payload.taskId === "mock") {
    return {
      mock: true,
      savedQuestionCount: countPayloadQuestions(payload),
    };
  }

  const response = await requestQuestionTaskSave(payload, action);

  if (!isSuccessfulSaveResponse(response)) {
    return rejectSaveResponse(response);
  }

  return response.content;
};
