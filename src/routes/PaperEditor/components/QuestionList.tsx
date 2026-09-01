import React from "react";

import type { PaperEditorDraft, PaperModuleDraft } from "../types";
import PaperQuestionCard from "./PaperQuestionCard";

interface BaseProps {
  locale: "en-US" | "zh-CN";
  module: PaperModuleDraft;
  templates: PaperEditorDraft["questionTypeTemplates"];
  questionNumberByKey: ReadonlyMap<string, number>;
}

type Props =
  | (BaseProps & {
      editable: true;
      onDeleteQuestion: (questionKey: string) => void;
      onEditQuestion: (questionId: number) => void;
      onScoreChange: (questionKey: string, score?: number) => void;
    })
  | (BaseProps & { editable: false });

/**
 * 按草稿顺序渲染左侧题目，排序统一由右侧题号处理。
 * @param {Props} properties 块内题目列表属性。
 * @returns {React.ReactElement} 题目列表。
 */
function QuestionList(properties: Props): React.ReactElement {
  const { locale, module, editable, questionNumberByKey, templates } =
    properties;
  const editableProperties = editable ? properties : undefined;
  return (
    <div>
      {module.questions.map((question) => (
        <PaperQuestionCard
          key={question.key}
          locale={locale}
          number={questionNumberByKey.get(question.key) ?? 0}
          {...(editable
            ? {
                editable: true as const,
                onDeleteQuestion: editableProperties!.onDeleteQuestion,
                onEditQuestion: editableProperties!.onEditQuestion,
                onScoreChange: editableProperties!.onScoreChange,
              }
            : { editable: false as const })}
          question={question}
          templates={templates}
        />
      ))}
    </div>
  );
}

export default QuestionList;
