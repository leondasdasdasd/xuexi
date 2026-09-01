import { trans } from "../utils/i18n";
import {
  collectQuestionContentBusinessQuestionTypeIds,
  type QuestionContentBusinessTypeSource,
} from "../utils/questionContentV2Tree";
import type { ExamPaperQuestionResponse } from "./examPaperV2.types";

interface QuestionContentSource {
  questionData: QuestionContentBusinessTypeSource | null;
}

interface QuestionTypeSnapshotSource {
  children: QuestionTypeSnapshotSource[];
  questionTypeData?: ExamPaperQuestionResponse["questionTypeData"];
}

interface QuestionModuleSource<Question> {
  questionList: Question[];
}

type QuestionTypeSnapshot = NonNullable<
  ExamPaperQuestionResponse["questionTypeData"]
>;

const collectExamPaperQuestionData = (
  modules: Array<QuestionModuleSource<QuestionContentSource>>,
): QuestionContentBusinessTypeSource[] =>
  modules.flatMap((module) =>
    module.questionList.flatMap((question) =>
      question.questionData ? [question.questionData] : [],
    ),
  );

const collectQuestionTypeSnapshots = (
  question: QuestionTypeSnapshotSource,
  snapshotsById: Map<number, QuestionTypeSnapshot>,
): void => {
  const snapshot = question.questionTypeData;
  if (snapshot && !snapshotsById.has(snapshot.businessQuestionTypeId)) {
    snapshotsById.set(snapshot.businessQuestionTypeId, snapshot);
  }
  for (const child of question.children) {
    collectQuestionTypeSnapshots(child, snapshotsById);
  }
};

export const collectExamPaperQuestionTypeSnapshots = (
  modules: Array<QuestionModuleSource<QuestionTypeSnapshotSource>>,
): QuestionTypeSnapshot[] => {
  const snapshotsById = new Map<number, QuestionTypeSnapshot>();
  for (const module of modules) {
    for (const question of module.questionList) {
      collectQuestionTypeSnapshots(question, snapshotsById);
    }
  }
  return [...snapshotsById.values()];
};

// 已冻结试卷只能使用同一快照内的题型模板，避免实时目录变化破坏历史试卷渲染。
export const requireExamPaperQuestionTypeSnapshots = (
  modules: Array<
    QuestionModuleSource<QuestionContentSource & QuestionTypeSnapshotSource>
  >,
): QuestionTypeSnapshot[] => {
  const snapshots = collectExamPaperQuestionTypeSnapshots(modules);
  const snapshotIds = new Set(
    snapshots.map((snapshot) => snapshot.businessQuestionTypeId),
  );
  const missingTypeIds = collectQuestionContentBusinessQuestionTypeIds(
    collectExamPaperQuestionData(modules),
  ).filter((id) => !snapshotIds.has(id));
  if (missingTypeIds.length > 0) {
    throw new Error(
      trans("examPaper.questionTypeMissing", "试卷依赖的业务题型不完整"),
    );
  }
  return snapshots;
};
