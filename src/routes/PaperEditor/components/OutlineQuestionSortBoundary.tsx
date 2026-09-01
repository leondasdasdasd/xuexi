import React, { useEffect, useMemo, useRef } from "react";

import { shouldCancelQuestionSortStart } from "../outlineQuestionDragStart";
import {
  createMoveQuestionCommand,
  createOutlineQuestionPositions,
} from "../outlineQuestionMoveAdapter";
import { createPaperQuestionDisplayNumbers } from "../paperQuestionDisplayNumbers";
import type { MoveQuestionCommand, PaperEditorDraft } from "../types";
import SortableOutlineContent from "./SortableOutlineContent";

import styles from "../index.module.less";

interface Props {
  draft: PaperEditorDraft;
  onAddLibraryQuestions: (
    moduleKey: string,
    initialQuestionTypeKey?: number,
  ) => void;
  onDeleteModule: (moduleKey: string) => void;
  onMoveModule: (oldIndex: number, newIndex: number) => void;
  onMoveQuestion: (command: MoveQuestionCommand) => void;
  onNavigate: (elementId: string) => void;
}

/**
 * 将右侧拖拽库索引转换为领域题目移动命令，并隔离拖拽后的点击事件。
 * @param {Props} properties 拖拽边界属性。
 * @returns {React.ReactElement} 题号排序边界。
 */
function OutlineQuestionSortBoundary(properties: Props): React.ReactElement {
  const {
    draft,
    onAddLibraryQuestions,
    onDeleteModule,
    onMoveModule,
    onMoveQuestion,
    onNavigate,
  } = properties;
  const positions = useMemo(
    () => createOutlineQuestionPositions(draft),
    [draft],
  );
  const positionByQuestionKey = useMemo(
    () =>
      new Map(
        positions.map((position, index) => [position.questionKey, index]),
      ),
    [positions],
  );
  const questionNumberByKey = useMemo(
    () => createPaperQuestionDisplayNumbers(draft),
    [draft],
  );
  const suppressNavigation = useRef(false);
  const releaseTimer = useRef<number>();

  useEffect(
    () => () => {
      if (releaseTimer.current) window.clearTimeout(releaseTimer.current);
    },
    [],
  );

  return (
    <SortableOutlineContent
      axis="xy"
      distance={5}
      draft={draft}
      helperClass={styles.dragging}
      onAddLibraryQuestions={onAddLibraryQuestions}
      onDeleteModule={onDeleteModule}
      onMoveModule={onMoveModule}
      onNavigate={(elementId) => {
        if (!suppressNavigation.current) onNavigate(elementId);
      }}
      onSortEnd={({ newIndex, oldIndex }) => {
        const command = createMoveQuestionCommand(
          positions,
          oldIndex,
          newIndex,
        );
        if (command) onMoveQuestion(command);
        releaseTimer.current = window.setTimeout(() => {
          suppressNavigation.current = false;
        }, 0);
      }}
      onSortStart={() => {
        suppressNavigation.current = true;
      }}
      positionByQuestionKey={positionByQuestionKey}
      questionNumberByKey={questionNumberByKey}
      shouldCancelStart={shouldCancelQuestionSortStart}
    />
  );
}

export default OutlineQuestionSortBoundary;
