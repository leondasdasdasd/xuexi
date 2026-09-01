import { trans } from "../../utils/i18n";
import {
  collectPaperBusinessQuestionTypeIds,
  createPaperQuestionContentDraft,
  createPaperQuestionTypeTemplates,
} from "./paperQuestionContentAdapter";
import type { PaperQuestionAssetResult } from "./questionAssetPaperAdapter";
import { collectLeafQuestionScoreFields } from "./questionScoreFieldsModel";
import type {
  BasketQuestionResponse,
  MoveQuestionCommand,
  PaperEditorDraft,
  PaperModuleDraft,
  PaperQuestionDraft,
  PaperSaveQuestionRequest,
  PaperSaveRequest,
  QuestionBasketResponse,
} from "./types";
export const collectBasketBusinessQuestionTypeIds = (
  basket: QuestionBasketResponse,
): number[] => collectPaperBusinessQuestionTypeIds(basket.moduleList);

type PaperEditorValidationErrorCode =
  | "emptyPaper"
  | "emptyModule"
  | "emptyPlacement"
  | "missingModuleTitle"
  | "missingPaperTitle"
  | "missingPaperType"
  | "missingGrade";

export interface MissingPaperQuestionScore {
  leafQuestionKey: string;
  moduleKey: string;
  path: number[];
  questionKey: string;
  questionNumber: number;
}

export type PaperEditorValidationError =
  | PaperEditorValidationErrorCode
  | { code: "missingScore"; missingScores: MissingPaperQuestionScore[] };

export type BatchScoreMode = "missing-only" | "overwrite-all";

const moveItem = <T>(items: T[], oldIndex: number, newIndex: number) => {
  if (
    oldIndex === newIndex ||
    oldIndex < 0 ||
    newIndex < 0 ||
    oldIndex >= items.length ||
    newIndex >= items.length
  ) {
    return items;
  }
  const nextItems = [...items];
  const [item] = nextItems.splice(oldIndex, 1);
  nextItems.splice(newIndex, 0, item);
  return nextItems;
};

const createQuestionDraft = (
  question: BasketQuestionResponse,
): PaperQuestionDraft => ({
  key: `question-${question.questionId}`,
  questionId: question.questionId,
  content: createPaperQuestionContentDraft(question),
  children: question.children.map((child) => createQuestionDraft(child)),
});

export const createPaperEditorDraft = (
  basket: QuestionBasketResponse,
  questionTypes: object[],
  locale?: string,
): PaperEditorDraft => ({
  title: "",
  subjectId: basket.subjectId,
  subjectName: basket.subjectName,
  modules: basket.moduleList.map((module, index) => ({
    key: `module-${module.businessQuestionTypeId}-${index}`,
    title: module.moduleName,
    questions: module.questionList.map((question) =>
      createQuestionDraft(question),
    ),
  })),
  questionTypeTemplates: createPaperQuestionTypeTemplates(
    questionTypes,
    locale,
  ),
});

export const updatePaperGrade = (
  draft: PaperEditorDraft,
  grade: { gradeId: number; name: string },
): PaperEditorDraft => ({
  ...draft,
  gradeId: grade.gradeId,
  gradeName: grade.name,
});

export const updatePaperSubject = (
  draft: PaperEditorDraft,
  subject: { name: string; subjectId: number },
): PaperEditorDraft => ({
  ...draft,
  subjectId: subject.subjectId,
  subjectName: subject.name,
});

const normalizeScorePrecision = (score: number): number =>
  Math.round(score * 10) / 10;

const addScores = (scores: number[]): number =>
  normalizeScorePrecision(scores.reduce((total, score) => total + score, 0));

export const isValidLeafScore = (score?: number): boolean =>
  typeof score === "number" &&
  Number.isFinite(score) &&
  score > 0 &&
  Math.abs(score * 10 - Math.round(score * 10)) < Number.EPSILON * 10;

export const getQuestionScore = (question: PaperQuestionDraft): number =>
  question.children.length > 0
    ? addScores(question.children.map((child) => getQuestionScore(child)))
    : question.score || 0;

export const getModuleScore = (module: PaperModuleDraft): number =>
  addScores(module.questions.map((question) => getQuestionScore(question)));

export const getPaperTotalScore = (draft: PaperEditorDraft): number =>
  addScores(draft.modules.map((module) => getModuleScore(module)));

export const getPaperQuestionCount = (draft: PaperEditorDraft): number =>
  draft.modules.reduce((total, module) => total + module.questions.length, 0);

export const movePaperModule = (
  draft: PaperEditorDraft,
  oldIndex: number,
  newIndex: number,
): PaperEditorDraft => ({
  ...draft,
  modules: moveItem(draft.modules, oldIndex, newIndex),
});

const createPaperModuleKey = (draft: PaperEditorDraft): string => {
  const existingKeys = new Set(draft.modules.map((module) => module.key));
  let index = draft.modules.length + 1;
  while (existingKeys.has(`module-new-${index}`)) index += 1;
  return `module-new-${index}`;
};

export const appendPaperModule = (
  draft: PaperEditorDraft,
): PaperEditorDraft => ({
  ...draft,
  modules: [
    ...draft.modules,
    { key: createPaperModuleKey(draft), questions: [], title: "" },
  ],
});

export const removePaperModule = (
  draft: PaperEditorDraft,
  moduleKey: string,
): PaperEditorDraft => ({
  ...draft,
  modules: draft.modules.filter((module) => module.key !== moduleKey),
});

const isQuestionIndexValid = (
  index: number,
  length: number,
  allowEnd = false,
): boolean => index >= 0 && (allowEnd ? index <= length : index < length);

const getQuestionMoveContext = (
  draft: PaperEditorDraft,
  command: MoveQuestionCommand,
) => {
  const sourceModule = draft.modules.find(
    (module) => module.key === command.sourceModuleKey,
  );
  const targetModule = draft.modules.find(
    (module) => module.key === command.targetModuleKey,
  );
  const sourceIndexValid = isQuestionIndexValid(
    command.sourceQuestionIndex,
    sourceModule?.questions.length ?? 0,
  );
  const targetIndexValid = isQuestionIndexValid(
    command.targetQuestionIndex,
    targetModule?.questions.length ?? -1,
    true,
  );
  return sourceModule && targetModule && sourceIndexValid && targetIndexValid
    ? { sourceModule, targetModule }
    : undefined;
};

export const movePaperQuestion = (
  draft: PaperEditorDraft,
  command: MoveQuestionCommand,
): PaperEditorDraft => {
  const context = getQuestionMoveContext(draft, command);
  if (!context) return draft;
  const { sourceModule, targetModule } = context;
  if (sourceModule.key === targetModule.key) {
    if (command.sourceQuestionIndex === command.targetQuestionIndex) {
      return draft;
    }
    return {
      ...draft,
      modules: draft.modules.map((module) =>
        module.key === sourceModule.key
          ? {
              ...module,
              questions: moveItem(
                module.questions,
                command.sourceQuestionIndex,
                command.targetQuestionIndex,
              ),
            }
          : module,
      ),
    };
  }

  const question = sourceModule.questions[command.sourceQuestionIndex];
  return {
    ...draft,
    modules: draft.modules.map((module) => {
      if (module.key === sourceModule.key) {
        return {
          ...module,
          questions: module.questions.filter(
            (_, index) => index !== command.sourceQuestionIndex,
          ),
        };
      }
      if (module.key === targetModule.key) {
        const questions = [...module.questions];
        questions.splice(command.targetQuestionIndex, 0, question);
        return { ...module, questions };
      }
      return module;
    }),
  };
};

export const updateModuleTitle = (
  draft: PaperEditorDraft,
  moduleKey: string,
  title: string,
): PaperEditorDraft => ({
  ...draft,
  modules: draft.modules.map((module) =>
    module.key === moduleKey ? { ...module, title } : module,
  ),
});

const updateQuestionScore = (
  question: PaperQuestionDraft,
  questionKey: string,
  score?: number,
): PaperQuestionDraft =>
  question.key === questionKey && question.children.length === 0
    ? { ...question, score }
    : {
        ...question,
        children: question.children.map((child) =>
          updateQuestionScore(child, questionKey, score),
        ),
      };

export const setLeafQuestionScore = (
  draft: PaperEditorDraft,
  questionKey: string,
  score?: number,
): PaperEditorDraft => ({
  ...draft,
  modules: draft.modules.map((module) => ({
    ...module,
    questions: module.questions.map((question) =>
      updateQuestionScore(question, questionKey, score),
    ),
  })),
});

const setQuestionLeafScores = (
  question: PaperQuestionDraft,
  score: number,
  mode: BatchScoreMode,
): PaperQuestionDraft =>
  question.children.length > 0
    ? {
        ...question,
        children: question.children.map((child) =>
          setQuestionLeafScores(child, score, mode),
        ),
      }
    : mode === "overwrite-all" || !isValidLeafScore(question.score)
      ? { ...question, score }
      : question;

export const setPaperModuleLeafScores = (
  draft: PaperEditorDraft,
  moduleKey: string,
  score: number,
  mode: BatchScoreMode,
): PaperEditorDraft =>
  isValidLeafScore(score)
    ? {
        ...draft,
        modules: draft.modules.map((module) =>
          module.key === moduleKey
            ? {
                ...module,
                questions: module.questions.map((question) =>
                  setQuestionLeafScores(question, score, mode),
                ),
              }
            : module,
        ),
      }
    : draft;

export const removePaperQuestion = (
  draft: PaperEditorDraft,
  questionKey: string,
): PaperEditorDraft => ({
  ...draft,
  modules: draft.modules.map((module) => ({
    ...module,
    questions: module.questions.filter(
      (question) => question.key !== questionKey,
    ),
  })),
});

const collectQuestionScores = (
  question: PaperQuestionDraft,
  scores: Map<number, number | undefined>,
) => {
  if (question.questionId) scores.set(question.questionId, question.score);
  for (const child of question.children) collectQuestionScores(child, scores);
  return scores;
};

const restoreQuestionScores = (
  question: PaperQuestionDraft,
  scores: ReadonlyMap<number, number | undefined>,
): PaperQuestionDraft => ({
  ...question,
  score:
    question.questionId === null ? undefined : scores.get(question.questionId),
  children: question.children.map((child) =>
    restoreQuestionScores(child, scores),
  ),
});

const mergeQuestionTypeTemplates = (
  draft: PaperEditorDraft,
  result: PaperQuestionAssetResult,
) => {
  const templates = new Map(
    draft.questionTypeTemplates.map((template) => [
      template.questionTypeKey,
      template,
    ]),
  );
  for (const template of result.questionTypeTemplates) {
    templates.set(template.questionTypeKey, template);
  }
  return [...templates.values()];
};

export const replacePaperQuestionFromAsset = (
  draft: PaperEditorDraft,
  targetQuestionId: number,
  result: PaperQuestionAssetResult,
): PaperEditorDraft => ({
  ...draft,
  questionTypeTemplates: mergeQuestionTypeTemplates(draft, result),
  modules: draft.modules.map((module) => ({
    ...module,
    questions: module.questions.map((question) =>
      question.questionId === targetQuestionId
        ? restoreQuestionScores(
            result.question,
            collectQuestionScores(question, new Map()),
          )
        : question,
    ),
  })),
});

export const appendPaperQuestionFromAsset = (
  draft: PaperEditorDraft,
  result: PaperQuestionAssetResult,
): PaperEditorDraft => {
  const question = result.question;
  const questionTypeKey = question.content?.questionTypeKey;
  const matchingTemplates = result.questionTypeTemplates.filter(
    (template) => template.questionTypeKey === questionTypeKey,
  );
  const templateLabel = matchingTemplates[0]?.label;
  const moduleTitle =
    typeof templateLabel === "string" ? templateLabel.trim() : "";
  if (matchingTemplates.length !== 1 || !moduleTitle) {
    throw new Error(
      trans(
        "paperEditor.questionTypeTemplateMismatch",
        "新增题目与题型模板不匹配",
      ),
    );
  }
  return {
    ...draft,
    questionTypeTemplates: mergeQuestionTypeTemplates(draft, result),
    modules: [
      ...draft.modules,
      {
        key: `module-${questionTypeKey}-question-${question.questionId}`,
        title: moduleTitle,
        questions: [question],
      },
    ],
  };
};

const collectQuestionIds = (
  question: PaperQuestionDraft,
  questionIds: Set<number>,
) => {
  if (question.questionId !== null) questionIds.add(question.questionId);
  for (const child of question.children) collectQuestionIds(child, questionIds);
};

export const collectPaperQuestionIds = (draft: PaperEditorDraft): number[] => {
  const questionIds = new Set<number>();
  for (const module of draft.modules) {
    for (const question of module.questions) {
      collectQuestionIds(question, questionIds);
    }
  }
  return [...questionIds];
};

export const appendPaperQuestionsFromLibrary = (
  draft: PaperEditorDraft,
  moduleKey: string,
  results: PaperQuestionAssetResult[],
): PaperEditorDraft => {
  if (results.length === 0) return draft;
  const targetModule = draft.modules.find((module) => module.key === moduleKey);
  const existingQuestionIds = new Set(collectPaperQuestionIds(draft));
  const selectedQuestionIds = new Set<number>();
  const selectionIsValid = results.every((result) => {
    const questionId = result.question.questionId;
    const isUnique =
      questionId !== null &&
      !existingQuestionIds.has(questionId) &&
      !selectedQuestionIds.has(questionId);
    if (questionId !== null) selectedQuestionIds.add(questionId);
    return isUnique;
  });
  if (!targetModule || !selectionIsValid) {
    throw new Error(
      trans(
        "paperEditor.librarySelectionInvalid",
        "所选题目无法添加到当前题型模块",
      ),
    );
  }
  let questionTypeTemplates = draft.questionTypeTemplates;
  for (const result of results) {
    questionTypeTemplates = mergeQuestionTypeTemplates(
      { ...draft, questionTypeTemplates },
      result,
    );
  }
  return {
    ...draft,
    questionTypeTemplates,
    modules: draft.modules.map((module) =>
      module.key === moduleKey
        ? {
            ...module,
            questions: [
              ...module.questions,
              ...results.map((result) => result.question),
            ],
          }
        : module,
    ),
  };
};

export const collectMissingPaperQuestionScores = (
  draft: PaperEditorDraft,
): MissingPaperQuestionScore[] => {
  let questionNumber = 0;
  return draft.modules.flatMap((module) =>
    module.questions.flatMap((question) => {
      questionNumber += 1;
      return collectLeafQuestionScoreFields(question)
        .filter((field) => !isValidLeafScore(field.question.score))
        .map((field) => ({
          leafQuestionKey: field.question.key,
          moduleKey: module.key,
          path: field.path,
          questionKey: question.key,
          questionNumber,
        }));
    }),
  );
};

const validatePaperProperties = (
  draft: PaperEditorDraft,
): PaperEditorValidationErrorCode | undefined => {
  if (!draft.title.trim()) return "missingPaperTitle";
  if (!draft.paperType) return "missingPaperType";
  if (!draft.gradeId) return "missingGrade";
  return undefined;
};

export const validatePaperEditorDraft = (
  draft: PaperEditorDraft,
): PaperEditorValidationError | undefined => {
  const propertyError = validatePaperProperties(draft);
  if (propertyError) return propertyError;
  if (draft.modules.length === 0) return "emptyPaper";
  if (draft.modules.some((module) => module.questions.length === 0)) {
    return "emptyModule";
  }
  if (
    draft.modules.some((module) =>
      module.questions.some((question) => question.questionId === null),
    )
  ) {
    return "emptyPlacement";
  }
  if (draft.modules.some((module) => !module.title.trim())) {
    return "missingModuleTitle";
  }
  const missingScores = collectMissingPaperQuestionScores(draft);
  if (missingScores.length > 0) return { code: "missingScore", missingScores };
  return undefined;
};

const createSaveQuestion = (
  question: PaperQuestionDraft,
): PaperSaveQuestionRequest => {
  if (question.questionId === null) {
    throw new Error(
      trans(
        "paperEditor.emptyPlacementCannotBeSaved",
        "空题位不能提交到试卷保存接口",
      ),
    );
  }
  return {
    questionId: question.questionId,
    questionScore: getQuestionScore(question),
    ...(question.children.length > 0
      ? {
          children: question.children.map((child) => createSaveQuestion(child)),
        }
      : {}),
  };
};

export const createPaperSaveRequest = (
  draft: PaperEditorDraft,
): PaperSaveRequest => ({
  ...(draft.paperId ? { paperId: draft.paperId } : {}),
  paperTypeCode: draft.paperType as number,
  title: draft.title.trim(),
  gradeId: draft.gradeId as number,
  subjectId: draft.subjectId,
  totalScore: getPaperTotalScore(draft),
  modules: draft.modules.map((module) => ({
    moduleName: module.title.trim(),
    questions: module.questions.map((question) => createSaveQuestion(question)),
  })),
});
