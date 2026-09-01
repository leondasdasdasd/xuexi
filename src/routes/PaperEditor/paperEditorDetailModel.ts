import { trans } from "../../utils/i18n";
import {
  createPaperQuestionContentDraft,
  createPaperQuestionTypeTemplates,
} from "./paperQuestionContentAdapter";
import type {
  ExamPaperDetailResponse,
  ExamPaperQuestionResponse,
  GradeOption,
  PaperEditorDraft,
  SubjectOption,
} from "./types";

const normalizeDetailQuestionScore = (
  score: ExamPaperQuestionResponse["questionScore"],
): number | undefined =>
  typeof score === "number" && score > 0 ? score : undefined;

const createDetailQuestionDraft = (
  question: ExamPaperQuestionResponse,
  positionKey: string,
): PaperEditorDraft["modules"][number]["questions"][number] => {
  if (question.questionId === null) {
    if (question.questionData !== null) {
      throw new Error(
        trans(
          "paperEditor.emptyPlacementContainsContent",
          "空题位不得包含题目内容",
        ),
      );
    }
    return {
      key: `empty-placement-${positionKey}`,
      questionId: null,
      score: normalizeDetailQuestionScore(question.questionScore),
      content: null,
      children: question.children.map((child, index) =>
        createDetailQuestionDraft(child, `${positionKey}-${index}`),
      ),
    };
  }
  if (question.questionData === null) {
    return {
      key: `unresolved-placement-${question.questionId}-${positionKey}`,
      questionId: question.questionId,
      score: normalizeDetailQuestionScore(question.questionScore),
      content: null,
      questionSnapshotStatus: "UNRESOLVED",
      questionSnapshotIssueCode: question.questionSnapshotIssueCode,
      children: question.children.map((child, index) =>
        createDetailQuestionDraft(child, `${positionKey}-${index}`),
      ),
    };
  }
  return {
    key:
      question.associationStrategy?.type === "blank"
        ? `question-${question.questionId}-blank-${question.associationStrategy.blankId}-${positionKey}`
        : `question-${question.questionId}`,
    questionId: question.questionId,
    score: normalizeDetailQuestionScore(question.questionScore),
    content: createPaperQuestionContentDraft({
      questionData: question.questionData,
    }),
    children: question.children.map((child, index) =>
      createDetailQuestionDraft(child, `${positionKey}-${index}`),
    ),
    questionSnapshotStatus: question.questionSnapshotStatus,
    questionSnapshotIssueCode: question.questionSnapshotIssueCode,
  };
};

/**
 * 将 V2 详情 DTO 转换为页面权威草稿，基础属性名称仅在此边界解析。
 * @param {ExamPaperDetailResponse} detail V2 试卷详情。
 * @param {object[]} questionTypes 题型模板源数据。
 * @param {GradeOption[]} grades 年级选项。
 * @param {SubjectOption[]} subjects 学科选项。
 * @param {string} [locale] 渲染语言。
 * @returns {PaperEditorDraft} 页面权威草稿。
 */
export const createPaperEditorDraftFromDetail = (
  detail: ExamPaperDetailResponse,
  questionTypes: object[],
  grades: GradeOption[],
  subjects: SubjectOption[],
  locale?: string,
): PaperEditorDraft => ({
  paperId: detail.id,
  title: detail.title,
  paperType: detail.paperTypeCode,
  gradeId: detail.gradeId,
  gradeName: grades.find((grade) => grade.gradeId === detail.gradeId)?.name,
  subjectId: detail.subjectId,
  subjectName:
    subjects.find((subject) => subject.subjectId === detail.subjectId)?.name ||
    "",
  modules: detail.content.moduleList.map((module, index) => ({
    key: `module-${index}`,
    title: module.moduleName,
    questions: module.questionList.map((question, questionIndex) =>
      createDetailQuestionDraft(question, `${index}-${questionIndex}`),
    ),
  })),
  questionTypeTemplates: createPaperQuestionTypeTemplates(
    questionTypes,
    locale,
  ),
});
