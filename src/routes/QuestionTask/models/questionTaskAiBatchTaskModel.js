import {
  cancelQuestionAnalysisTasks,
  cancelQuestionQualityCheckTasks,
  submitQuestionAnalysisTasks,
  submitQuestionQualityCheckTasks,
} from "../../../services/questionTaskAiTask";
import { toQuestionTaskTransportQuestion } from "../domain/questionTaskTransportAdapter";
import {
  assertTaskResponseContent,
  getFoundTaskItems,
  getQuestionTaskLanguageCode,
} from "./questionTaskAiTaskModel";

const toTransportQuestions = (questions) =>
  (Array.isArray(questions) ? questions : []).map((question) =>
    toQuestionTaskTransportQuestion(question),
  );

// AI 后端只接受 QuestionData 传输结构，页面草稿到传输 DTO 的转换集中在此边界。
export const submitBatchQuestionAnalysisTasks = async ({ questions, taskId }) =>
  getFoundTaskItems(
    assertTaskResponseContent(
      await submitQuestionAnalysisTasks({
        questions: toTransportQuestions(questions),
        taskId,
      }),
    ),
  );

export const submitBatchQuestionQualityCheckTasks = async ({
  questions,
  taskId,
}) =>
  getFoundTaskItems(
    assertTaskResponseContent(
      await submitQuestionQualityCheckTasks({
        languageCode: getQuestionTaskLanguageCode(),
        questions: toTransportQuestions(questions),
        taskId,
      }),
    ),
  );

export const cancelQuestionAnalysisTaskByUuid = async (uuid) =>
  getFoundTaskItems(
    assertTaskResponseContent(
      await cancelQuestionAnalysisTasks({ uuids: [uuid] }),
    ),
  );

export const cancelQuestionQualityCheckTaskByUuid = async (uuid) =>
  getFoundTaskItems(
    assertTaskResponseContent(
      await cancelQuestionQualityCheckTasks({ uuids: [uuid] }),
    ),
  );
