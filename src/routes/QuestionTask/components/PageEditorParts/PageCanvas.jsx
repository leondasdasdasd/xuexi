import React, { useCallback, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";

import {
  PaperAiParsingPolygonEditorCanvas,
  POLYGON_EDITOR_EVENT,
  usePolygonEditorController,
} from "../../../../components/PaperAiParsingPolygonEditor";
import { trans } from "../../../../utils/i18n";
import { ORIGINAL_ZOOM_SCALE, QUESTION_CATEGORY } from "./pageEditorData";

import styles from "./PageCanvas.module.less";

const CENTER_DIVISOR = 2;
const EMPTY_BLOCK_CLASS_NAME = styles["empty-block"];

const hasSelectedAnnotation = (selectedAnnotationId) =>
  selectedAnnotationId !== undefined;

const shouldScrollToQuestion = (focusRequest, page, pageReference) =>
  focusRequest &&
  focusRequest.source === "result" &&
  page &&
  pageReference.current &&
  page.questions.some(
    (question) => question.draftId === focusRequest.questionId,
  );

const getPageBlockStyle = (zoomScale) => ({
  // 将缩放宽度放在滚动内容层，超过 100% 时滚动区域才能拿到真实宽度。
  alignSelf: zoomScale > ORIGINAL_ZOOM_SCALE ? "flex-start" : "center",
  width: `${zoomScale}%`,
});

const getQuestionScrollTop = ({
  imageNode,
  scrollContainer,
  targetQuestion,
}) => {
  const scale = imageNode.clientWidth / imageNode.naturalWidth;
  const containerRect = scrollContainer.getBoundingClientRect();
  const imageRect = imageNode.getBoundingClientRect();
  const centerY =
    ((targetQuestion.polygonBounds.top + targetQuestion.polygonBounds.bottom) /
      CENTER_DIVISOR) *
    scale;

  return (
    scrollContainer.scrollTop +
    (imageRect.top - containerRect.top) +
    centerY -
    scrollContainer.clientHeight / CENTER_DIVISOR
  );
};

const getPageContentNode = ({
  controller,
  isPolygonVisible,
  isQuestionSelectionLocked,
  page,
}) => {
  if (!page) {
    return (
      <div className={EMPTY_BLOCK_CLASS_NAME}>
        {trans("questionTask.noPage", "暂无页面")}
      </div>
    );
  }

  if (page.errorMessage) {
    return <div className={EMPTY_BLOCK_CLASS_NAME}>{page.errorMessage}</div>;
  }

  if (!page.imageUrl) {
    return (
      <div className={EMPTY_BLOCK_CLASS_NAME}>
        {trans("questionTask.missingPageImage", "当前页缺少图片地址")}
      </div>
    );
  }

  return (
    <PaperAiParsingPolygonEditorCanvas
      controller={controller}
      hideDeleteControl
      renderStage={({ containerProps, imageNode, overlayNode }) => (
        <div className={styles["page-canvas"]}>
          <div {...containerProps} className={styles["page-stage"]}>
            <div className={styles["page-badge"]}>
              {trans("questionTask.pageTitle", "第{$pageNumber}页", {
                pageNumber: page.pageNumber,
              })}
            </div>
            {imageNode}
            {isPolygonVisible ? (
              <div
                className={
                  isQuestionSelectionLocked
                    ? styles["page-overlay-locked"]
                    : undefined
                }
              >
                {overlayNode}
              </div>
            ) : undefined}
          </div>
        </div>
      )}
    />
  );
};

const PageCanvas = ({
  focusRequest,
  isPolygonVisible,
  isQuestionSelectionLocked,
  onQuestionSelect,
  page,
  scrollContainerRef,
  selectedQuestionId,
  zoomScale,
}) => {
  const pageReference = useRef(null);
  const handleEditorEvent = useCallback(
    (payload) => {
      if (
        payload.type !== POLYGON_EDITOR_EVENT.POLYGON_SELECT ||
        !payload.polygon
      ) {
        return;
      }
      onQuestionSelect(payload.polygon.id, "editor");
    },
    [onQuestionSelect],
  );
  const polygons = useMemo(
    () =>
      ((page && page.questions) || [])
        .map((question) => question.polygon)
        .filter(Boolean),
    [page],
  );
  const controller = usePolygonEditorController({
    allowOverlap: true,
    imageUrl: page && page.imageUrl,
    onEvent: handleEditorEvent,
    polygonCategories: QUESTION_CATEGORY,
    polygons,
    readOnly: true,
  });
  const { clearSelection, selectAnnotation } = controller.actions;
  const { annotations, selectedAnnotationId } = controller.state;

  useEffect(() => {
    if (!selectedQuestionId) {
      if (hasSelectedAnnotation(selectedAnnotationId)) {
        clearSelection();
      }
      return;
    }

    const annotation = annotations.find(
      (item) => String(item.id) === String(selectedQuestionId),
    );
    if (!annotation) {
      if (hasSelectedAnnotation(selectedAnnotationId)) {
        clearSelection();
      }
      return;
    }

    if (String(selectedAnnotationId) !== String(selectedQuestionId)) {
      selectAnnotation(annotation);
    }
  }, [
    annotations,
    clearSelection,
    selectAnnotation,
    selectedAnnotationId,
    selectedQuestionId,
  ]);

  useEffect(() => {
    if (!shouldScrollToQuestion(focusRequest, page, pageReference)) {
      return;
    }

    const targetQuestion = page.questions.find(
      (question) =>
        question.draftId === focusRequest.questionId && question.polygonBounds,
    );
    const scrollContainer = scrollContainerRef && scrollContainerRef.current;
    const imageNode = pageReference.current.querySelector("img");

    if (
      targetQuestion &&
      scrollContainer &&
      imageNode &&
      imageNode.naturalWidth &&
      imageNode.clientWidth
    ) {
      const top = getQuestionScrollTop({
        imageNode,
        scrollContainer,
        targetQuestion,
      });
      const maxTop =
        scrollContainer.scrollHeight - scrollContainer.clientHeight;

      scrollContainer.scrollTo({
        behavior: "smooth",
        top: Math.min(Math.max(0, top), Math.max(0, maxTop)),
      });
      return;
    }

    pageReference.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [focusRequest, page, scrollContainerRef]);

  const contentNode = getPageContentNode({
    controller,
    isPolygonVisible,
    isQuestionSelectionLocked,
    page,
  });

  return (
    <div
      ref={pageReference}
      className={styles["flat-page-block"]}
      data-testid="question-page-preview"
      style={getPageBlockStyle(zoomScale)}
    >
      {contentNode}
    </div>
  );
};

PageCanvas.propTypes = {
  focusRequest: PropTypes.shape({
    questionId: PropTypes.string,
    source: PropTypes.string,
    token: PropTypes.number,
  }),
  isPolygonVisible: PropTypes.bool.isRequired,
  isQuestionSelectionLocked: PropTypes.bool,
  onQuestionSelect: PropTypes.func.isRequired,
  page: PropTypes.object.isRequired,
  scrollContainerRef: PropTypes.shape({
    current: PropTypes.any,
  }),
  selectedQuestionId: PropTypes.string,
  zoomScale: PropTypes.number.isRequired,
};

PageCanvas.defaultProps = {
  focusRequest: undefined,
  isQuestionSelectionLocked: false,
  scrollContainerRef: undefined,
  selectedQuestionId: undefined,
};

export default PageCanvas;
