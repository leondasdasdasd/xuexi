import type { QuestionPlayerResponse } from "@yungu-fed/question-editor";

import type { PaperStructureModuleView } from "../../common/PaperStructureNavigation/types";
import type {
  ExamPaperModuleView,
  ExamPaperView,
  ExamPlacementView,
} from "./types";

export const selectExamPaperPlacements = (
  paper: ExamPaperView,
): ExamPlacementView[] => paper.modules.flatMap((module) => module.placements);

export const selectExamPaperQuestion = (
  paper: ExamPaperView,
  questionIndex: number,
): ExamPaperView | undefined => {
  const placement = selectExamPaperPlacements(paper).at(questionIndex);
  if (!placement) return undefined;
  const module = paper.modules.find((candidate) =>
    candidate.placements.some(
      (item) => item.placementId === placement.placementId,
    ),
  );
  return module
    ? { ...paper, modules: [{ ...module, placements: [placement] }] }
    : undefined;
};

export const mapExamPaperViewToStructureNavigation = (
  paper: ExamPaperView,
): PaperStructureModuleView[] =>
  paper.modules.map((module) => ({
    key: String(module.order),
    name: module.moduleName,
    order: module.order,
    questionCount: module.moduleQuestionNumber,
    questions: module.placements.map((placement) => ({
      key: placement.placementId,
      number: placement.order,
    })),
    score: module.moduleScore,
  }));

export const selectExamPaperNavigationQuestionKey = (
  modules: PaperStructureModuleView[],
  questionIndex: number,
): string | undefined =>
  modules.flatMap((module) => module.questions).at(questionIndex)?.key;

export const selectExamPaperQuestionIndexByPlacementId = (
  paper: ExamPaperView,
  placementId: string,
): number =>
  selectExamPaperPlacements(paper).findIndex(
    (placement) => placement.placementId === placementId,
  );

export const mapExamPlacementTree = (
  placement: ExamPlacementView,
  mapPlacement: (placement: ExamPlacementView) => ExamPlacementView,
): ExamPlacementView => {
  const children = placement.children.map((child) =>
    mapExamPlacementTree(child, mapPlacement),
  );
  return mapPlacement({
    ...placement,
    children,
    response: {
      ...placement.response,
      children: children.map((child) => child.response),
    },
  });
};

const applyResponseTree = (
  placement: ExamPlacementView,
  response: QuestionPlayerResponse,
): ExamPlacementView => {
  const children = placement.children.map((child, index) =>
    applyResponseTree(child, response.children.at(index) || child.response),
  );
  return {
    ...placement,
    children,
    response: {
      ...response,
      children: children.map((child) => child.response),
    },
  };
};

const updatePlacements = (
  placements: ExamPlacementView[],
  placementId: string,
  response: QuestionPlayerResponse,
): ExamPlacementView[] =>
  placements.map((placement) => ({
    ...placement,
    ...(placement.placementId === placementId
      ? applyResponseTree(placement, response)
      : {
          children: updatePlacements(placement.children, placementId, response),
        }),
  }));

export const updateExamPaperPlacementResponse = (
  paper: ExamPaperView,
  placementId: string,
  response: QuestionPlayerResponse,
): ExamPaperView => ({
  ...paper,
  modules: paper.modules.map((module) => ({
    ...module,
    placements: updatePlacements(module.placements, placementId, response),
  })),
});

export const mapExamPaperModules = (
  paper: ExamPaperView,
  mapPlacement: (placement: ExamPlacementView) => ExamPlacementView,
): ExamPaperModuleView[] =>
  paper.modules.map((module) => ({
    ...module,
    placements: module.placements.map((placement) => mapPlacement(placement)),
  }));
