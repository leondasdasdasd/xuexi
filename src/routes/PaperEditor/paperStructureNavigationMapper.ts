import type { PaperStructureModuleView } from "../../common/PaperStructureNavigation/types";
import { getModuleScore } from "./paperEditorModel";
import { createPaperQuestionDisplayNumbers } from "./paperQuestionDisplayNumbers";
import type { PaperEditorDraft } from "./types";

/**
 * 将编辑器草稿转换为只读试卷结构展示模型。
 * @param {PaperEditorDraft} draft 试卷编辑器的权威草稿。
 * @returns {PaperStructureModuleView[]} 仅包含导航展示信息的模块列表。
 */
export const mapPaperEditorDraftToStructureNavigation = (
  draft: PaperEditorDraft,
): PaperStructureModuleView[] => {
  const questionNumbers = createPaperQuestionDisplayNumbers(draft);
  return draft.modules.map((module, moduleIndex) => ({
    key: module.key,
    name: module.title,
    order: moduleIndex + 1,
    questionCount: module.questions.length,
    questions: module.questions.map((question) => ({
      key: question.key,
      number: questionNumbers.get(question.key) ?? 0,
    })),
    score: String(getModuleScore(module)),
  }));
};
