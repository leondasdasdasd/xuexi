import type { QuestionContentSerializedDraft } from "@yungu-fed/question-editor";
import {
  createEmptyQuestionPlayerResponse,
  createQuestionPreviewDraft,
} from "@yungu-fed/question-editor";

import type {
  ExamPaperDetailResponse,
  ExamPaperQuestionResponse,
} from "../../services/examPaperV2.types";
import type {
  ExamScoredResultDto,
  StudentExamEntryDto,
  StudentExamResultDto,
  StudentExamSubmissionAnswerDto,
  StudentPaperDto,
  TeacherExamStudentDirectoryDto,
} from "../../services/explicitExam.types";
import { parseExplicitExamTime } from "../../services/explicitExamTime";
import { trans } from "../../utils/i18n";
import { createQuestionContentSerializedDraftFromV2Question } from "../../utils/questionContentV2EditorAdapter";
import { createQuestionEditorQuestionTypeTemplates } from "../../utils/questionTypeEditorAdapter";
import { mapV2AnswerJsonToQuestionPlayerResponse } from "../../utils/v2QuestionPlayerResponseAdapter";
import {
  mapExamTimestampToDateDisplayText,
  mapExamTimeToDisplayText,
} from "./examDateMetadata";
import {
  mapExamPaperModules,
  selectExamPaperPlacements,
} from "./examPaperView";
import type {
  ExamDateMetadata,
  ExamPaperView,
  ExamPlacementView,
  StudentFilterView,
  StudentResultDirectoryView,
} from "./types";

const localizedName = (
  chineseName: string | undefined,
  englishName: string | undefined,
  language: string,
) =>
  language === "en"
    ? englishName || chineseName || ""
    : chineseName || englishName || "";

export const mapTeacherExamStudentDirectoryToView = (
  directory: TeacherExamStudentDirectoryDto,
  language: string,
): StudentResultDirectoryView => ({
  groups: directory.groups.map((group) => ({
    id: group.groupId,
    name: localizedName(group.groupName, group.groupEnName, language),
  })),
  students: directory.students.map((student) => ({
    id: student.studentId,
    name:
      localizedName(student.studentName, student.studentEnName, language) ||
      String(student.studentId),
  })),
  total: directory.total,
});

export const mapStudentExamResultToStudentFilterView = (
  result: StudentExamResultDto,
  language: string,
): StudentFilterView => ({
  id: result.studentId,
  name:
    localizedName(result.studentName, result.studentEnName, language) ||
    String(result.studentId),
});

const mapPlacementToSubmissionAnswer = (
  placement: ExamPlacementView,
): StudentExamSubmissionAnswerDto => {
  const { children, questionId, response } = placement;
  const { elementAnswers, id, questionTypeKey, version } = response;
  if (
    id !== questionId ||
    !Number.isSafeInteger(questionTypeKey) ||
    Number(questionTypeKey) <= 0 ||
    version !== "1"
  ) {
    throw new Error(
      trans(
        "explicitExam.invalidSubmissionIdentity",
        "题目作答数据不完整，请刷新后重试",
      ),
    );
  }
  const businessQuestionTypeId = Number(questionTypeKey);
  return {
    businessQuestionTypeId,
    children: children.map((child) => mapPlacementToSubmissionAnswer(child)),
    elementAnswers: [...elementAnswers],
    id,
    version,
  };
};

// 提交边界使用冻结题位校验题目身份，并递归保留完整作答树。
export const mapPaperToSubmissionAnswers = (
  paper: ExamPaperView,
): StudentExamSubmissionAnswerDto[] =>
  selectExamPaperPlacements(paper).map((placement) =>
    mapPlacementToSubmissionAnswer(placement),
  );

const mapExamPaperQuestionToPlacement = (
  question: ExamPaperQuestionResponse,
  templates: ExamPaperView["questionTypeTemplates"],
  positionPath: string,
  order: number,
): ExamPlacementView => {
  if (question.questionId === null || question.questionData === null) {
    throw new Error(
      trans("explicitExam.paperDetailIncomplete", "试卷题位数据不完整"),
    );
  }
  const serialized = createQuestionContentSerializedDraftFromV2Question(
    question.questionData,
  ) as QuestionContentSerializedDraft;
  const content = createQuestionPreviewDraft(serialized, templates);
  if (!content) {
    throw new Error(trans("explicitExam.questionInvalid", "试卷题目无法渲染"));
  }
  const children = question.children.map((child, index) =>
    mapExamPaperQuestionToPlacement(
      child,
      templates,
      `${positionPath}-${index}`,
      index + 1,
    ),
  );
  const emptyResponse = createEmptyQuestionPlayerResponse(content, templates);
  return {
    children,
    content,
    order,
    placementId: `exam-question-${positionPath}-${question.questionId}`,
    questionId: question.questionId,
    response: {
      ...mapV2AnswerJsonToQuestionPlayerResponse(
        question.answerJson,
        emptyResponse,
      ),
      children: children.map((child) => child.response),
    },
    responseVersion: 0,
    score: String(question.questionScore ?? 0),
    isCorrect: question.isCorrect,
    studentScore: question.studentScore,
  };
};

// V2 传输 shape 仅在此边界转换，教师页面只消费共享作答视图。
const mapExamPaperModulesToView = (
  source: {
    dateMetadata: ExamDateMetadata;
    deadlineTimestamp: number | null;
    gradeName: string;
    moduleList: ExamPaperDetailResponse["content"]["moduleList"];
    title: string;
    totalScore: number;
  },
  questionTypes: object[],
): ExamPaperView => {
  const templates = createQuestionEditorQuestionTypeTemplates(
    questionTypes,
  ) as ExamPaperView["questionTypeTemplates"];
  let order = 0;
  return {
    dateMetadata: source.dateMetadata,
    deadlineTimestamp: source.deadlineTimestamp,
    gradeName: source.gradeName,
    modules: source.moduleList.map((module, moduleIndex) => ({
      moduleName: module.moduleName,
      moduleQuestionNumber: module.moduleQuestionNumber,
      moduleScore: String(module.moduleScore),
      order: moduleIndex + 1,
      placements: module.questionList.map((question, questionIndex) =>
        mapExamPaperQuestionToPlacement(
          question,
          templates,
          `${moduleIndex}-${questionIndex}`,
          (order += 1),
        ),
      ),
    })),
    questionTypeTemplates: templates,
    title: source.title,
    totalScore: String(source.totalScore),
  };
};

// 教师试作传输 shape 只在此边界转换为共享作答视图。
export const mapExamPaperV2ToTeacherTrialView = (
  detail: ExamPaperDetailResponse,
  questionTypes: object[],
  currentTimestamp: number,
) =>
  mapExamPaperModulesToView(
    {
      dateMetadata: {
        displayText: mapExamTimestampToDateDisplayText(currentTimestamp),
        kind: "teacher-trial-current-time",
      },
      deadlineTimestamp: null,
      gradeName: detail.gradeName,
      moduleList: detail.content.moduleList,
      title: detail.title,
      totalScore: detail.totalScore,
    },
    questionTypes,
  );

// 学生冻结试卷传输 shape 只在此边界转换，不制造教师详情 DTO。
export const mapStudentPaperV2ToExamPaperView = (
  paper: StudentPaperDto,
  questionTypes: object[],
  entry: StudentExamEntryDto,
) => {
  const parsedAnswerEndTime = parseExplicitExamTime(paper.answerEndTime);
  if (parsedAnswerEndTime.kind === "invalid") {
    throw new Error(
      trans("explicitExam.invalidAnswerEndTime", "考试截止时间格式不正确"),
    );
  }
  return mapExamPaperModulesToView(
    {
      dateMetadata: {
        displayText: mapExamTimeToDisplayText(entry.taskPublishTime),
        kind: "student-task-publish-time",
      },
      deadlineTimestamp:
        parsedAnswerEndTime.kind === "valid"
          ? parsedAnswerEndTime.timestamp
          : null,
      gradeName: entry.gradeName,
      moduleList: paper.moduleList,
      title: paper.title || paper.examPaperName || "",
      totalScore: paper.totalScore || 0,
    },
    questionTypes,
  );
};

export const mapTeacherStudentExamResultToPaperView = (
  result: StudentExamResultDto,
  questionTypes: object[],
) => {
  const paper = result.examPaperDetailResponse;
  return mapExamPaperModulesToView(
    {
      dateMetadata: {
        displayText: mapExamTimeToDisplayText(result.submittedAt),
        kind: "teacher-student-submission-time",
      },
      deadlineTimestamp: null,
      gradeName: paper.gradeName,
      moduleList: paper.moduleList,
      title: paper.title || paper.examPaperName || "",
      totalScore: paper.totalScore || result.examScore || 0,
    },
    questionTypes,
  );
};

const indexResultQuestions = (paper: StudentPaperDto) => {
  const questionsById = new Map<number, ExamPaperQuestionResponse>();
  const indexQuestion = (question: ExamPaperQuestionResponse) => {
    if (question.questionId !== null) {
      questionsById.set(question.questionId, question);
    }
    for (const child of question.children) indexQuestion(child);
  };
  for (const module of paper.moduleList) {
    for (const question of module.questionList) indexQuestion(question);
  }
  return questionsById;
};

export const applyExamPreviewResultToPaper = (
  paper: ExamPaperView,
  resultPaper: StudentPaperDto,
): ExamPaperView => {
  const resultByQuestionId = indexResultQuestions(resultPaper);
  const applyResult = (placement: ExamPlacementView): ExamPlacementView => {
    const result = resultByQuestionId.get(placement.questionId);
    const children = placement.children.map((child) => applyResult(child));
    const response = result?.answerJson
      ? mapV2AnswerJsonToQuestionPlayerResponse(
          result.answerJson,
          placement.response,
        )
      : placement.response;
    return {
      ...placement,
      children,
      isCorrect: result ? result.isCorrect : placement.isCorrect,
      response: {
        ...response,
        children: children.map((child) => child.response),
      },
      studentScore: result ? result.studentScore : placement.studentScore,
    };
  };
  return {
    ...paper,
    modules: mapExamPaperModules(paper, applyResult),
  };
};

export const mapStudentExamResultToView = (result: ExamScoredResultDto) => {
  const pendingCount = result.pendingQuestionNum || 0;
  return {
    correctCount: result.correctQuestionNum || 0,
    fullScore: String(result.examScore || 0),
    incorrectCount: result.errorQuestionNum || 0,
    pendingCount,
    totalScore:
      pendingCount > 0 || result.studentScore == null
        ? null
        : String(result.studentScore),
  };
};
