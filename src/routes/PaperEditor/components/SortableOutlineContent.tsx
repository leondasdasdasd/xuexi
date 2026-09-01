import React from "react";
import { SortableContainer } from "react-sortable-hoc";

import { getPaperQuestionElementId } from "../paperEditorDomIds";
import type { PaperEditorDraft } from "../types";
import OutlineModuleHeader from "./OutlineModuleHeader";
import OutlineQuestionNumber from "./OutlineQuestionNumber";

import styles from "../index.module.less";

interface Props {
  draft: PaperEditorDraft;
  onAddLibraryQuestions: (
    moduleKey: string,
    initialQuestionTypeKey?: number,
  ) => void;
  onDeleteModule: (moduleKey: string) => void;
  onMoveModule: (oldIndex: number, newIndex: number) => void;
  onNavigate: (elementId: string) => void;
  positionByQuestionKey: ReadonlyMap<string, number>;
  questionNumberByKey: ReadonlyMap<string, number>;
}

/**
 * 在同一拖拽容器中渲染全部块的题号，使题目可跨块移动。
 * @param {Props} properties 结构目录属性。
 * @returns {React.ReactElement} 可排序题号目录。
 */
export function SortableOutlineContent(properties: Props): React.ReactElement {
  const {
    draft,
    onAddLibraryQuestions,
    onDeleteModule,
    onMoveModule,
    onNavigate,
    positionByQuestionKey,
    questionNumberByKey,
  } = properties;
  return (
    <div
      className={styles["outline-sort-grid"]}
      data-testid="outline-sort-grid"
    >
      {draft.modules.map((module, moduleIndex) => (
        <React.Fragment key={module.key}>
          <OutlineModuleHeader
            isFirst={moduleIndex === 0}
            isLast={moduleIndex === draft.modules.length - 1}
            module={module}
            moduleIndex={moduleIndex}
            onAddLibraryQuestions={onAddLibraryQuestions}
            onDeleteModule={onDeleteModule}
            onMoveModule={onMoveModule}
          />
          {module.questions.map((question) => (
            <OutlineQuestionNumber
              index={positionByQuestionKey.get(question.key) ?? 0}
              key={question.key}
              number={questionNumberByKey.get(question.key) ?? 0}
              onNavigate={() =>
                onNavigate(getPaperQuestionElementId(question.key))
              }
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

export default SortableContainer<Props>(SortableOutlineContent);
