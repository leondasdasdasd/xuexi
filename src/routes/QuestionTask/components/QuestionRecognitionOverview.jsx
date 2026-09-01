import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";

import styles from "./QuestionRecognitionOverview.module.less";

const DRAG_START_THRESHOLD = 3;
const COLLAPSED_TOGGLE_HEIGHT = 44;
const DEFAULT_OVERVIEW_TOP = 62;

const getRuntimeResizeObserver = (event) => {
  void event;

  if (typeof window === "undefined") {
    return false;
  }

  return window["ResizeObserver"];
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const QuestionRecognitionOverview = ({
  onQuestionSelect,
  reviewSummary,
  selectedQuestionId,
}) => {
  const containerReference = useRef(null);
  const dragStateReference = useRef(null);
  const hasDraggedReference = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ top: DEFAULT_OVERVIEW_TOP });
  const summary = useMemo(
    () => ({
      completedCount: reviewSummary.completedCount || 0,
      groups: (reviewSummary.groups || []).filter(
        (group) => group.items.length,
      ),
      totalCount: reviewSummary.bigQuestionCount || 0,
    }),
    [reviewSummary],
  );

  const handleDragMove = useCallback((event) => {
    const dragState = dragStateReference.current;

    if (!dragState) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (
      Math.abs(deltaX) > DRAG_START_THRESHOLD ||
      Math.abs(deltaY) > DRAG_START_THRESHOLD
    ) {
      hasDraggedReference.current = true;
    }

    setPosition({
      top: clamp(
        dragState.startTop + deltaY,
        0,
        Math.max(0, dragState.parentHeight - COLLAPSED_TOGGLE_HEIGHT),
      ),
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    dragStateReference.current = undefined;
    setIsDragging(false);
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
  }, [handleDragMove]);

  const handleDragStart = useCallback(
    (event) => {
      if (
        event.button !== 0 ||
        !containerReference.current ||
        !containerReference.current.parentElement
      ) {
        return;
      }

      const containerRect = containerReference.current.getBoundingClientRect();
      const parentRect =
        containerReference.current.parentElement.getBoundingClientRect();

      hasDraggedReference.current = false;
      dragStateReference.current = {
        height: containerRect.height,
        parentHeight: parentRect.height,
        startTop: containerRect.top - parentRect.top,
        startX: event.clientX,
        startY: event.clientY,
        width: containerRect.width,
      };

      setIsDragging(true);
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
    },
    [handleDragEnd, handleDragMove],
  );

  const handleToggleClick = useCallback(() => {
    if (hasDraggedReference.current) {
      hasDraggedReference.current = false;
      return;
    }

    setExpanded((current) => !current);
  }, []);

  const handleDragMouseDown = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleDragStart(event);
    },
    [handleDragStart],
  );

  const clampPositionWithinParent = useCallback(() => {
    setPosition((currentPosition) => {
      if (
        !currentPosition ||
        !containerReference.current ||
        !containerReference.current.parentElement
      ) {
        return currentPosition;
      }

      const containerRect = containerReference.current.getBoundingClientRect();
      const parentRect =
        containerReference.current.parentElement.getBoundingClientRect();
      const nextTop = clamp(
        currentPosition.top,
        0,
        Math.max(
          0,
          parentRect.height - Math.min(containerRect.height, parentRect.height),
        ),
      );

      if (nextTop === currentPosition.top) {
        return currentPosition;
      }

      return {
        top: nextTop,
      };
    });
  }, []);

  useEffect(() => {
    if (
      !containerReference.current ||
      !containerReference.current.parentElement
    ) {
      return;
    }

    const parentElement = containerReference.current.parentElement;
    const RuntimeResizeObserver = getRuntimeResizeObserver();

    if (typeof RuntimeResizeObserver !== "function") {
      window.addEventListener("resize", clampPositionWithinParent);

      return (event) => {
        void event;
        window.removeEventListener("resize", clampPositionWithinParent);
      };
    }

    const resizeObserver = new RuntimeResizeObserver((entries) => {
      void entries;
      clampPositionWithinParent();
    });

    resizeObserver.observe(containerReference.current);
    resizeObserver.observe(parentElement);

    return (event) => {
      void event;
      resizeObserver.disconnect();
    };
  }, [clampPositionWithinParent]);

  useEffect(() => {
    clampPositionWithinParent();
  }, [clampPositionWithinParent, expanded]);

  useEffect(
    () => (event) => {
      void event;
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    },
    [handleDragEnd, handleDragMove],
  );

  if (!summary.totalCount) {
    return false;
  }

  return (
    <div
      ref={containerReference}
      className={`${styles["question-overview-float"]} ${
        expanded
          ? styles["question-overview-float-open"]
          : styles["question-overview-float-collapsed"]
      } ${isDragging ? styles["question-overview-float-dragging"] : ""}`}
      style={position ? { top: position.top } : undefined}
    >
      {expanded ? (
        <div className={styles["question-overview-panel"]}>
          <div className={styles["recognition-header"]}>
            <div>
              <div className={styles["recognition-eyebrow"]}>
                {trans("questionTask.reviewOverviewTitle", "题目概览")}
              </div>
              <div className={styles["recognition-title"]}>
                {trans(
                  "questionTask.overviewRecognizedCount",
                  "共识别 {$count} 道题",
                  {
                    count: summary.totalCount,
                  },
                )}
              </div>
            </div>
            <div className={styles["recognition-status"]}>
              <span className={styles["status-complete-dot"]} />
              {trans(
                "questionTask.overviewCompletedCount",
                "{$count} 题满足提交条件",
                {
                  count: summary.completedCount,
                },
              )}
            </div>
          </div>
          <div className={styles["recognition-groups"]}>
            {summary.groups.map((group) => (
              <div key={group.key} className={styles["recognition-group"]}>
                <div className={styles["recognition-group-header"]}>
                  <span>{group.label}</span>
                  <strong>
                    {trans("questionTask.reviewQuestionCount", "{$count} 题", {
                      count: group.items.length,
                    })}
                  </strong>
                </div>
                <div className={styles["question-number-list"]}>
                  {group.items.map((question) => {
                    const isActive = selectedQuestionId === question.draftId;

                    return (
                      <button
                        key={question.draftId}
                        className={`${styles["question-number-button"]} ${question.statusClassName} ${
                          isActive ? styles["question-number-active"] : ""
                        }`}
                        title={trans(
                          "questionTask.overviewQuestionTitle",
                          "第 {$number} 题：{$label}",
                          {
                            label: question.statusLabel,
                            number: question.number,
                          },
                        )}
                        type="button"
                        onClick={(event) => {
                          void event;
                          onQuestionSelect(question.draftId, "result");
                        }}
                      >
                        {question.number}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className={styles["recognition-legend"]}>
            <span>
              <i className={styles["legend-complete"]} />
              {trans("questionTask.reviewStatusCompleteShort", "完整")}
            </span>
            <span>
              <i className={styles["legend-missing-score"]} />
              {trans("questionTask.reviewStatusMissingScoreShort", "缺分数")}
            </span>
            <span>
              <i className={styles["legend-missing-analysis"]} />
              {trans("questionTask.reviewStatusMissingAnalysisShort", "缺解析")}
            </span>
            <span>
              <i className={styles["legend-missing-answer"]} />
              {trans("questionTask.reviewStatusMissingAnswerShort", "缺答案")}
            </span>
            <span>
              <i className={styles["legend-missing-all"]} />
              {trans("questionTask.reviewStatusPending", "待补齐")}
            </span>
          </div>
        </div>
      ) : undefined}
      <div className={styles["question-overview-toggle"]}>
        <button
          aria-label={
            expanded
              ? trans("questionTask.overviewCollapse", "收起")
              : trans("questionTask.overviewExpand", "展开")
          }
          className={styles["question-overview-toggle-button"]}
          title={
            expanded
              ? trans("questionTask.overviewCollapse", "收起")
              : trans("questionTask.overviewExpand", "展开")
          }
          type="button"
          onClick={handleToggleClick}
          onMouseDown={handleDragMouseDown}
        >
          <span className={styles["question-overview-toggle-count"]}>
            {summary.totalCount}
          </span>
        </button>
      </div>
    </div>
  );
};

QuestionRecognitionOverview.propTypes = {
  onQuestionSelect: PropTypes.func.isRequired,
  reviewSummary: PropTypes.shape({
    bigQuestionCount: PropTypes.number,
    completedCount: PropTypes.number,
    groups: PropTypes.arrayOf(PropTypes.object),
  }),
  selectedQuestionId: PropTypes.string,
};

QuestionRecognitionOverview.defaultProps = {
  reviewSummary: {
    bigQuestionCount: 0,
    completedCount: 0,
    groups: [],
  },
  selectedQuestionId: "",
};

export default QuestionRecognitionOverview;
