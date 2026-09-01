import React from "react";

import type { BatchScoreMode } from "../paperEditorModel";
import { createPaperQuestionDisplayNumbers } from "../paperQuestionDisplayNumbers";
import type { PaperEditorDraft } from "../types";
import PaperModuleCard from "./PaperModuleCard";

interface BaseProps {
  draft: PaperEditorDraft;
  locale: "en-US" | "zh-CN";
}

type Props =
  | (BaseProps & {
      editable: true;
      onDeleteQuestion: (questionKey: string) => void;
      onBatchScore: (
        moduleKey: string,
        score: number,
        mode: BatchScoreMode,
      ) => void;
      onEditQuestion: (questionId: number) => void;
      onScoreChange: (questionKey: string, score?: number) => void;
      onTitleChange: (moduleKey: string, title: string) => void;
    })
  | (BaseProps & { editable: false });

/**
 * 按草稿顺序渲染左侧试卷内容，排序统一由右侧结构栏处理。
 * @param {Props} properties 块列表属性。
 * @returns {React.ReactElement} 试卷块列表。
 */
function ModuleList(properties: Props): React.ReactElement {
  const { draft, editable, locale } = properties;
  const editableProperties = editable ? properties : undefined;
  const questionNumberByKey = createPaperQuestionDisplayNumbers(draft);
  return (
    <div>
      {draft.modules.map((module, moduleIndex) => (
        <PaperModuleCard
          key={module.key}
          locale={locale}
          module={module}
          moduleIndex={moduleIndex}
          {...(editable
            ? {
                editable: true as const,
                onBatchScore: editableProperties!.onBatchScore,
                onDeleteQuestion: editableProperties!.onDeleteQuestion,
                onEditQuestion: editableProperties!.onEditQuestion,
                onScoreChange: editableProperties!.onScoreChange,
                onTitleChange: editableProperties!.onTitleChange,
              }
            : { editable: false as const })}
          questionNumberByKey={questionNumberByKey}
          templates={draft.questionTypeTemplates}
        />
      ))}
    </div>
  );
}

export default ModuleList;
