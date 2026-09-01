import React, { createRef, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";
import {
  getArrayItem,
  OPTION_INDEX_OFFSET,
} from "../domain/questionTaskShared";
import {
  canMergeQuestionSelection,
  canSplitQuestionSelection,
  getSelectedQuestionSelectionItems,
} from "../domain/questionTaskStructure";
import { getQuestionSectionDisplayLabel } from "../domain/questionTaskViewModel";
import { syncFormulaImageSizes } from "./formulaImageSizing";
import {
  isQuestionCardInteractiveTarget,
  renderQuestionContent,
} from "./QuestionCardContent";
import QuestionCardHeaderActions from "./QuestionCardHeaderActions";
import {
  createSubQuestionSelectionControlRenderer,
  renderInsertSlot,
  renderSelectionToolbar,
} from "./QuestionCardSelectionBar";
import {
  clampValue,
  getCardClassName,
  getDragDropPosition,
  getQuestionSectionDisplayNumber,
  getSelectedQuestionScrollKey,
  getSelectedQuestionScrollNode,
  getSubQuestionIndexFromEvent,
  HALF_DIVISOR,
  QUALITY_ANCHOR_MAX_OFFSET,
  QUALITY_ARROW_ANCHOR_OFFSET,
  QUALITY_ARROW_BOTTOM_GAP,
  QUALITY_ARROW_MIN_TOP,
  QUALITY_INITIAL_ARROW_TOP,
  QUALITY_POPOVER_GAP,
  QUALITY_POPOVER_MARGIN,
  QUALITY_POPOVER_WIDTH,
  shouldRenderQuestionSectionHeader,
} from "./QuestionCardsLayout";
import { renderQualityReport } from "./QuestionCardStatusUI";
import { renderSubQuestionMoveActions } from "./QuestionSubQuestionMoveActions";

import styles from "./QuestionCardsView.module.less";

const getQuestionCardsClassName = (displayMode) =>
  `${styles["question-cards"]} ${
    displayMode === "review" ? styles["question-cards-review"] : ""
  }`;

const getReviewStatus = ({
  displayMode,
  questionId,
  reviewStatusByQuestionId,
}) =>
  displayMode === "review"
    ? reviewStatusByQuestionId.get(questionId)
    : undefined;

const QuestionCards = ({
  displayMode,
  lockedQuestionIds,
  onCancelQuestionAnalysis,
  onCancelQuestionQualityCheck,
  readOnly,
  onInsertAtEnd,
  onInsertAtStart,
  onQuestionAiEnhance,
  onQuestionDelete,
  onQuestionDuplicateAfter,
  onQuestionEdit,
  onQuestionInsertAfter,
  onQuestionReorder,
  onQuestionDeselect,
  onQuestionSectionInsertAfter,
  onQuestionSectionInsertAtStart,
  onQuestionSectionUpdate,
  onQuestionSelect,
  onQuestionSelectionChange,
  onQuestionSelectionClear,
  onSubQuestionMove,
  onSelectedQuestionMerge,
  onSelectedQuestionSplit,
  questions,
  reviewStatusByQuestionId,
  selectedQuestionId,
  selectedQuestionIds,
}) => {
  const [draggingQuestionId, setDraggingQuestionId] = useState("");
  const [dragOverState, setDragOverState] = useState({
    position: "after",
    questionId: "",
  });
  const [selectedSubQuestionTarget, setSelectedSubQuestionTarget] = useState();
  const [openedQualityReportId, setOpenedQualityReportId] = useState("");
  const [qualityPopoverPosition, setQualityPopoverPosition] = useState();
  const questionCardsReference = useRef();
  const lastAutoScrolledQuestionIdReference = useRef("");
  const qualityPopoverReference = useRef();
  const lockedQuestionIdSet = useMemo(
    () => new Set(Array.isArray(lockedQuestionIds) ? lockedQuestionIds : []),
    [lockedQuestionIds],
  );
  const selectedQuestionIdSet = useMemo(
    () =>
      new Set(Array.isArray(selectedQuestionIds) ? selectedQuestionIds : []),
    [selectedQuestionIds],
  );
  const selectedQuestionItems = useMemo(
    () =>
      getSelectedQuestionSelectionItems({
        selectedQuestionIds,
        visibleQuestions: questions,
      }),
    [questions, selectedQuestionIds],
  );
  const isQuestionLocked = (questionId) => lockedQuestionIdSet.has(questionId);
  const isQuestionReadOnly = (questionId) =>
    readOnly || isQuestionLocked(questionId);
  const hasLockedSelectedQuestion = selectedQuestionItems.some((item) =>
    isQuestionLocked(item.parentQuestionId || item.questionId),
  );
  const canMergeSelectedQuestions =
    !readOnly &&
    !hasLockedSelectedQuestion &&
    canMergeQuestionSelection(selectedQuestionItems);
  const canSplitSelectedQuestion =
    !readOnly &&
    !hasLockedSelectedQuestion &&
    canSplitQuestionSelection(selectedQuestionItems);
  const sectionDisplayNumberByQuestionId = useMemo(
    () =>
      new Map(
        (Array.isArray(questions) ? questions : []).map((question, index) => [
          question.draftId,
          getQuestionSectionDisplayNumber(questions, index),
        ]),
      ),
    [questions],
  );
  const getAdjacentQuestion = (index, direction) =>
    direction === "up"
      ? getArrayItem(questions, index - OPTION_INDEX_OFFSET)
      : getArrayItem(questions, index + OPTION_INDEX_OFFSET);

  const resetDragState = (event) => {
    if (event) {
      event.stopPropagation();
    }

    setDraggingQuestionId("");
    setDragOverState({
      position: "after",
      questionId: "",
    });
  };

  const getCardProperties = (questionId) =>
    readOnly
      ? {
          "aria-disabled": true,
          onClick: undefined,
          onKeyDown: undefined,
          tabIndex: -OPTION_INDEX_OFFSET,
        }
      : {
          "aria-disabled": false,
          onClick: (event) => {
            if (event) {
              event.currentTarget.blur();
            }
            const subQuestionIndex = getSubQuestionIndexFromEvent(event);
            const isSubQuestionClick = Number.isInteger(subQuestionIndex);

            if (!isSubQuestionClick) {
              setSelectedSubQuestionTarget();
            }

            if (selectedQuestionId === questionId && !isSubQuestionClick) {
              onQuestionDeselect();
              return;
            }

            onQuestionSelect(questionId, "result");
          },
          onMouseUp: (event) => {
            if (event && event.currentTarget) {
              event.currentTarget.blur();
            }
          },
          onKeyDown: (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onQuestionSelect(questionId, "result");
            }
          },
          tabIndex: 0,
        };

  const handleQuestionCardDoubleClick = (
    questionId,
    event,
    subQuestionIndex,
  ) => {
    if (
      isQuestionReadOnly(questionId) ||
      isQuestionCardInteractiveTarget(
        event,
        'button,input,textarea,select,a,label,[data-question-card-interactive="true"]',
      )
    ) {
      return;
    }

    if (Number.isInteger(subQuestionIndex)) {
      onQuestionEdit(questionId, { subQuestionIndex });
      return;
    }

    onQuestionEdit(questionId);
  };

  const cardReferenceMap = useMemo(
    (event) => {
      if (event) {
        event.preventDefault();
      }

      return new Map(
        (Array.isArray(questions) ? questions : []).map((question) => [
          question.draftId,
          createRef(),
        ]),
      );
    },
    [questions],
  );

  useEffect(() => {
    if (!selectedQuestionId) {
      lastAutoScrolledQuestionIdReference.current = "";
      return;
    }

    const selectedQuestionScrollKey = getSelectedQuestionScrollKey(
      selectedQuestionId,
      selectedSubQuestionTarget,
    );

    if (
      lastAutoScrolledQuestionIdReference.current === selectedQuestionScrollKey
    ) {
      return;
    }

    const targetReference = cardReferenceMap.get(selectedQuestionId);
    const targetNode = targetReference && targetReference.current;

    const scrollTargetNode = getSelectedQuestionScrollNode(
      targetNode,
      selectedQuestionId,
      selectedSubQuestionTarget,
    );

    if (
      scrollTargetNode &&
      typeof scrollTargetNode.scrollIntoView === "function"
    ) {
      // 仅在选中题真实变化时自动定位，避免 AI 轮询刷新题目数据打断用户手动滚动。
      scrollTargetNode.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      lastAutoScrolledQuestionIdReference.current = selectedQuestionScrollKey;
    }
  }, [cardReferenceMap, selectedQuestionId, selectedSubQuestionTarget]);

  useEffect(() => {
    // 富文本公式图片没有 React props，加载后按原图高度分级，避免普通公式和复杂公式被压成同一高度。
    return syncFormulaImageSizes(questionCardsReference.current);
  }, [questions]);

  useEffect(() => {
    if (
      openedQualityReportId &&
      !(Array.isArray(questions) ? questions : []).some(
        (question) => question.draftId === openedQualityReportId,
      )
    ) {
      setOpenedQualityReportId("");
    }
  }, [openedQualityReportId, questions]);

  useEffect(() => {
    if (!draggingQuestionId) {
      return;
    }

    if (
      !(Array.isArray(questions) ? questions : []).some(
        (question) => question.draftId === draggingQuestionId,
      )
    ) {
      resetDragState();
    }
  }, [draggingQuestionId, questions]);

  useEffect(() => {
    if (!openedQualityReportId) {
      return;
    }

    const closeQualityPopover = (event) => {
      if (
        qualityPopoverReference.current &&
        qualityPopoverReference.current.contains(event.target)
      ) {
        return;
      }

      if (event.target?.closest?.("[data-quality-report-trigger='true']")) {
        return;
      }

      setOpenedQualityReportId("");
      setQualityPopoverPosition();
    };

    const handleWindowResize = (event) => {
      if (event) {
        event.stopPropagation();
      }

      setQualityPopoverPosition((currentPosition) =>
        currentPosition
          ? {
              ...currentPosition,
              top: clampValue(
                currentPosition.top,
                QUALITY_POPOVER_MARGIN,
                Math.max(
                  QUALITY_POPOVER_MARGIN,
                  window.innerHeight - QUALITY_POPOVER_MARGIN,
                ),
              ),
            }
          : currentPosition,
      );
    };

    document.addEventListener("mousedown", closeQualityPopover);
    window.addEventListener("resize", handleWindowResize);

    return (event) => {
      if (event) {
        event.preventDefault();
      }

      document.removeEventListener("mousedown", closeQualityPopover);
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [openedQualityReportId]);

  useEffect(() => {
    if (
      !openedQualityReportId ||
      !qualityPopoverPosition ||
      !qualityPopoverReference.current
    ) {
      return;
    }

    const popoverRect = qualityPopoverReference.current.getBoundingClientRect();
    const availableMaxTop = Math.max(
      QUALITY_POPOVER_MARGIN,
      window.innerHeight - popoverRect.height - QUALITY_POPOVER_MARGIN,
    );
    const nextTop = clampValue(
      qualityPopoverPosition.top,
      QUALITY_POPOVER_MARGIN,
      availableMaxTop,
    );
    const nextArrowTop = clampValue(
      qualityPopoverPosition.anchorY - nextTop - QUALITY_ARROW_ANCHOR_OFFSET,
      QUALITY_ARROW_MIN_TOP,
      Math.max(
        QUALITY_ARROW_MIN_TOP,
        popoverRect.height - QUALITY_ARROW_BOTTOM_GAP,
      ),
    );

    if (
      nextTop !== qualityPopoverPosition.top ||
      nextArrowTop !== qualityPopoverPosition.arrowTop
    ) {
      setQualityPopoverPosition((currentPosition) =>
        currentPosition
          ? {
              ...currentPosition,
              arrowTop: nextArrowTop,
              top: nextTop,
            }
          : currentPosition,
      );
    }
  }, [openedQualityReportId, qualityPopoverPosition]);

  if (questions.length === 0) {
    return (
      <div className={styles["question-cards"]}>
        <div className={styles["question-cards-list"]}>
          <div className={styles["empty-block-compact"]}>
            {trans("questionTask.noQuestion", "暂无题目")}
          </div>
        </div>
      </div>
    );
  }

  const toggleQualityReport = (question, event) => {
    if (event) {
      event.stopPropagation();
    }

    const cardReference = cardReferenceMap.get(question.draftId);
    const cardNode = cardReference && cardReference.current;

    onQuestionSelect(question.draftId, "result");

    setOpenedQualityReportId((currentId) => {
      if (currentId === question.draftId) {
        setQualityPopoverPosition();
        return "";
      }

      if (cardNode && typeof cardNode.getBoundingClientRect === "function") {
        const rect = cardNode.getBoundingClientRect();
        const nextLeft = Math.max(
          QUALITY_POPOVER_MARGIN,
          rect.left - QUALITY_POPOVER_WIDTH - QUALITY_POPOVER_GAP,
        );
        const anchorY =
          rect.top +
          Math.min(rect.height / HALF_DIVISOR, QUALITY_ANCHOR_MAX_OFFSET);

        setQualityPopoverPosition({
          anchorY,
          arrowTop: QUALITY_INITIAL_ARROW_TOP,
          left: nextLeft,
          top: Math.max(QUALITY_POPOVER_MARGIN, rect.top),
        });
      } else {
        setQualityPopoverPosition();
      }

      return question.draftId;
    });
  };

  const handleQuestionDragStart = (questionId, event) => {
    if (isQuestionReadOnly(questionId)) {
      event.preventDefault();
      return;
    }

    event.stopPropagation();
    setDraggingQuestionId(questionId);
    setDragOverState({
      position: "after",
      questionId: "",
    });

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", questionId);
    }
  };

  const handleQuestionDragOver = (questionId, event) => {
    if (
      readOnly ||
      isQuestionLocked(questionId) ||
      isQuestionLocked(draggingQuestionId) ||
      !draggingQuestionId ||
      draggingQuestionId === questionId
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const nextPosition = getDragDropPosition(event);

    setDragOverState((currentState) =>
      currentState.questionId === questionId &&
      currentState.position === nextPosition
        ? currentState
        : {
            position: nextPosition,
            questionId,
          },
    );

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  };

  const handleQuestionDrop = (questionId, event) => {
    if (
      readOnly ||
      isQuestionLocked(questionId) ||
      isQuestionLocked(draggingQuestionId)
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (draggingQuestionId && draggingQuestionId !== questionId) {
      onQuestionReorder(
        draggingQuestionId,
        questionId,
        getDragDropPosition(event),
      );
    }

    resetDragState();
  };

  const handleQuestionDragEnd = (event) => {
    event.stopPropagation();
    resetDragState();
  };

  const handleQuestionMove = (question, index, direction, event) => {
    if (event) {
      event.stopPropagation();
    }

    const adjacentQuestion = getAdjacentQuestion(index, direction);

    if (!adjacentQuestion || isQuestionReadOnly(question.draftId)) {
      return;
    }

    onQuestionReorder(
      question.draftId,
      adjacentQuestion.draftId,
      direction === "up" ? "before" : "after",
    );
  };

  const handleSubQuestionMove = (
    question,
    subQuestionIndex,
    direction,
    event,
  ) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const subQuestions = Array.isArray(question.sonQuestionList)
      ? question.sonQuestionList
      : [];
    const targetIndex =
      direction === "up"
        ? subQuestionIndex - OPTION_INDEX_OFFSET
        : subQuestionIndex + OPTION_INDEX_OFFSET;

    if (
      isQuestionReadOnly(question.draftId) ||
      targetIndex < 0 ||
      targetIndex >= subQuestions.length
    ) {
      return;
    }

    onSubQuestionMove(question.draftId, subQuestionIndex, direction);
  };

  const renderQuestionHeader = (question, index) => (
    <QuestionCardHeaderActions
      isQuestionLocked={isQuestionLocked}
      isQuestionReadOnly={isQuestionReadOnly}
      onCancelQuestionAnalysis={onCancelQuestionAnalysis}
      onCancelQuestionQualityCheck={onCancelQuestionQualityCheck}
      onDragEnd={handleQuestionDragEnd}
      onDragStart={handleQuestionDragStart}
      onQuestionAiEnhance={onQuestionAiEnhance}
      onQuestionDelete={onQuestionDelete}
      onQuestionEdit={onQuestionEdit}
      onQuestionMove={handleQuestionMove}
      onQuestionSelectionChange={onQuestionSelectionChange}
      onToggleQualityReport={toggleQualityReport}
      question={question}
      questionIndex={index}
      reviewStatus={getReviewStatus({
        displayMode,
        questionId: question.draftId,
        reviewStatusByQuestionId,
      })}
      questions={questions}
      selectedQuestionIdSet={selectedQuestionIdSet}
    />
  );

  const renderQuestionSectionHeader = (question) => (
    <div
      className={styles["question-section-header"]}
      data-testid="question-section-header"
    >
      <button
        type="button"
        className={styles["question-section-edit-button"]}
        data-question-card-interactive="true"
        onClick={(event) => {
          event.stopPropagation();
          onQuestionSectionUpdate(question.draftId);
        }}
      >
        <span className={styles["question-section-header-title"]}>
          {getQuestionSectionDisplayLabel(
            question,
            sectionDisplayNumberByQuestionId.get(question.draftId),
          )}
        </span>
        <span className={styles["question-section-edit-hint"]}>
          {trans("global.edit", "编辑")}
        </span>
      </button>
    </div>
  );

  const renderQuestionCard = (question, index) => {
    const cardProperties = getCardProperties(question.draftId);
    const questionReadOnly = isQuestionReadOnly(question.draftId);

    return (
      <React.Fragment key={question.draftId}>
        {shouldRenderQuestionSectionHeader(questions, question, index) &&
          renderQuestionSectionHeader(question)}
        <div
          ref={cardReferenceMap.get(question.draftId)}
          role="button"
          tabIndex={cardProperties.tabIndex}
          aria-disabled={cardProperties["aria-disabled"]}
          className={getCardClassName({
            dragOverState,
            draggingQuestionId,
            question,
            readOnly: questionReadOnly,
            selectedQuestionId,
          })}
          onClick={cardProperties.onClick}
          onDoubleClick={(event) =>
            handleQuestionCardDoubleClick(question.draftId, event)
          }
          onMouseUp={cardProperties.onMouseUp}
          onKeyDown={cardProperties.onKeyDown}
          onDragOver={(event) =>
            handleQuestionDragOver(question.draftId, event)
          }
          onDrop={(event) => handleQuestionDrop(question.draftId, event)}
        >
          {renderQuestionHeader(question, index)}
          <div className={styles["question-card-body"]}>
            {renderQuestionContent(
              question,
              createSubQuestionSelectionControlRenderer({
                isQuestionReadOnly,
                onQuestionSelectionChange,
                question,
                selectedQuestionIdSet,
              }),
              (subQuestionIndex, event) =>
                handleQuestionCardDoubleClick(
                  question.draftId,
                  event,
                  subQuestionIndex,
                ),
              (subQuestion, subQuestionIndex) =>
                renderSubQuestionMoveActions({
                  handleSubQuestionMove,
                  isQuestionReadOnly,
                  question,
                  subQuestion,
                  subQuestionIndex,
                }),
              (subQuestionIndex) =>
                setSelectedSubQuestionTarget({
                  questionId: question.draftId,
                  subQuestionIndex,
                }),
            )}
          </div>
        </div>
        {index < questions.length - OPTION_INDEX_OFFSET &&
          renderInsertSlot({
            onInsertAtEnd,
            onInsertAtStart,
            onQuestionDuplicateAfter,
            onQuestionInsertAfter,
            onQuestionSectionInsertAfter,
            onQuestionSectionInsertAtStart,
            position: "between",
            questionId: question.draftId,
            readOnly: readOnly || isQuestionLocked(question.draftId),
            sectionQuestionId: getArrayItem(
              questions,
              index + OPTION_INDEX_OFFSET,
            )?.draftId,
          })}
      </React.Fragment>
    );
  };

  const openedQualityQuestion = (
    Array.isArray(questions) ? questions : []
  ).find((question) => question.draftId === openedQualityReportId);

  return (
    <div
      ref={questionCardsReference}
      className={getQuestionCardsClassName(displayMode)}
    >
      {renderSelectionToolbar({
        canMergeSelectedQuestions,
        canSplitSelectedQuestion,
        onQuestionSelectionClear,
        onSelectedQuestionMerge,
        onSelectedQuestionSplit,
        selectedCount: selectedQuestionItems.length,
      })}
      <div className={styles["question-cards-list"]}>
        {renderInsertSlot({
          onInsertAtEnd,
          onInsertAtStart,
          onQuestionDuplicateAfter,
          onQuestionInsertAfter,
          onQuestionSectionInsertAfter,
          onQuestionSectionInsertAtStart,
          position: "start",
          readOnly,
        })}
        {questions.map((question, index) =>
          renderQuestionCard(question, index),
        )}
        {renderInsertSlot({
          onInsertAtEnd,
          onInsertAtStart,
          onQuestionDuplicateAfter,
          onQuestionInsertAfter,
          onQuestionSectionInsertAfter,
          onQuestionSectionInsertAtStart,
          position: "end",
          readOnly,
        })}
      </div>
      {openedQualityQuestion &&
        renderQualityReport({
          openedQualityReportId,
          qualityPopoverPosition,
          qualityPopoverReference,
          question: openedQualityQuestion,
        })}
    </div>
  );
};

QuestionCards.propTypes = {
  displayMode: PropTypes.oneOf(["preview", "review"]),
  lockedQuestionIds: PropTypes.arrayOf(PropTypes.string),
  onCancelQuestionAnalysis: PropTypes.func,
  onCancelQuestionQualityCheck: PropTypes.func,
  onInsertAtEnd: PropTypes.func.isRequired,
  onInsertAtStart: PropTypes.func.isRequired,
  onQuestionAiEnhance: PropTypes.func.isRequired,
  onQuestionDelete: PropTypes.func.isRequired,
  onQuestionDuplicateAfter: PropTypes.func.isRequired,
  onQuestionEdit: PropTypes.func.isRequired,
  onQuestionInsertAfter: PropTypes.func.isRequired,
  onQuestionReorder: PropTypes.func.isRequired,
  onQuestionDeselect: PropTypes.func.isRequired,
  onQuestionSectionInsertAfter: PropTypes.func.isRequired,
  onQuestionSectionInsertAtStart: PropTypes.func.isRequired,
  onQuestionSectionUpdate: PropTypes.func.isRequired,
  onQuestionSelect: PropTypes.func.isRequired,
  onQuestionSelectionChange: PropTypes.func,
  onQuestionSelectionClear: PropTypes.func,
  onSubQuestionMove: PropTypes.func,
  onSelectedQuestionMerge: PropTypes.func,
  onSelectedQuestionSplit: PropTypes.func,
  questions: PropTypes.arrayOf(PropTypes.object),
  readOnly: PropTypes.bool,
  reviewStatusByQuestionId: PropTypes.instanceOf(Map),
  selectedQuestionId: PropTypes.string,
  selectedQuestionIds: PropTypes.arrayOf(PropTypes.string),
};

QuestionCards.defaultProps = {
  displayMode: "preview",
  lockedQuestionIds: [],
  onCancelQuestionAnalysis: (event) => {
    void event;
  },
  onCancelQuestionQualityCheck: (event) => {
    void event;
  },
  onQuestionSelectionChange: (event) => {
    void event;
  },
  onQuestionSelectionClear: (event) => {
    void event;
  },
  onSubQuestionMove: (event) => {
    void event;
  },
  onSelectedQuestionMerge: (event) => {
    void event;
  },
  onSelectedQuestionSplit: (event) => {
    void event;
  },
  questions: [],
  readOnly: false,
  reviewStatusByQuestionId: new Map(),
  selectedQuestionId: "",
  selectedQuestionIds: [],
};

export default QuestionCards;
