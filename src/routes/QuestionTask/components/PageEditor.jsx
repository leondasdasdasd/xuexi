import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";

import AnswerPaperPreview from "./PageEditorParts/AnswerPaperPreview";
import AnswerSheetPreview from "./PageEditorParts/AnswerSheetPreview";
import {
  CanvasFloatingControls,
  CanvasZoomControls,
} from "./PageEditorParts/CanvasControls";
import PageCanvas from "./PageEditorParts/PageCanvas";
import {
  clampZoom,
  isEditableTarget,
  ORIGINAL_ZOOM_SCALE,
  ZOOM_STEP,
} from "./PageEditorParts/pageEditorData";
import PreviewSideNav from "./PageEditorParts/PreviewSideNav";

import styles from "./PageEditor.module.less";

const hasAnswerAnalysisContent = ({
  answerFileUrl,
  answerPages,
  answerSheetMarkdown,
  answerTextPages,
}) =>
  !!answerFileUrl ||
  !!(Array.isArray(answerPages) && answerPages.length > 0) ||
  !!String(answerSheetMarkdown || "").trim() ||
  !!(Array.isArray(answerTextPages) && answerTextPages.length > 0);

const hasQuestionPolygons = (pages) =>
  (Array.isArray(pages) ? pages : []).some((page) =>
    (Array.isArray(page && page.questions) ? page.questions : []).some(
      (question) => question && question.polygon,
    ),
  );

const PageEditor = ({
  answerFileUrl,
  answerPages,
  answerSheetMarkdown,
  answerTextPages,
  focusRequest,
  isQuestionSelectionLocked,
  onApplyReferenceEdits,
  onQuestionSelect,
  pages,
  questions,
  selectedQuestionId,
}) => {
  const editorBodyReference = useRef(null);
  const [isPolygonVisible, setIsPolygonVisible] = useState(true);
  const [isPreviewSideCollapsed, setIsPreviewSideCollapsed] = useState(false);
  const [previewMode, setPreviewMode] = useState("question");
  const [zoomScale, setZoomScale] = useState(ORIGINAL_ZOOM_SCALE);
  const hasAnswerAnalysis = hasAnswerAnalysisContent({
    answerFileUrl,
    answerPages,
    answerSheetMarkdown,
    answerTextPages,
  });
  const hasLegacyQuestionPolygons = useMemo(
    () => hasQuestionPolygons(pages),
    [pages],
  );
  const hasAnswerSheet = useMemo(
    () => (Array.isArray(questions) ? questions : []).length > 0,
    [questions],
  );
  const updateZoomScale = useCallback((nextZoomScale) => {
    setZoomScale(clampZoom(nextZoomScale));
  }, []);
  const stepZoomScale = useCallback((delta) => {
    setZoomScale((currentZoomScale) => clampZoom(currentZoomScale + delta));
  }, []);

  useEffect(() => {
    if (!hasAnswerAnalysis && previewMode === "analysis") {
      setPreviewMode("question");
    }
    if (!hasAnswerSheet && previewMode === "answerSheet") {
      setPreviewMode("question");
    }
  }, [hasAnswerAnalysis, hasAnswerSheet, previewMode]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (previewMode !== "question" || isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        stepZoomScale(ZOOM_STEP);
        return;
      }

      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        stepZoomScale(-ZOOM_STEP);
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        updateZoomScale(ORIGINAL_ZOOM_SCALE);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return (event) => {
      void event;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewMode, stepZoomScale, updateZoomScale]);

  return (
    <div className={styles["preview-shell"]}>
      <PreviewSideNav
        collapsed={isPreviewSideCollapsed}
        hasAnswerAnalysis={hasAnswerAnalysis}
        hasAnswerSheet={hasAnswerSheet}
        onPreviewModeChange={setPreviewMode}
        onToggleCollapse={(event) => {
          void event;
          setIsPreviewSideCollapsed((current) => !current);
        }}
        previewMode={previewMode}
      />
      <div className={styles["preview-content"]}>
        {previewMode === "analysis" && hasAnswerAnalysis ? (
          <AnswerPaperPreview
            answerFileUrl={answerFileUrl}
            answerPages={answerPages}
            answerSheetMarkdown={answerSheetMarkdown}
            answerTextPages={answerTextPages}
            onZoomChange={updateZoomScale}
            zoomScale={zoomScale}
          />
        ) : previewMode === "answerSheet" ? (
          <AnswerSheetPreview
            onApplyReferenceEdits={onApplyReferenceEdits}
            onQuestionSelect={onQuestionSelect}
            questions={questions}
          />
        ) : (
          <div ref={editorBodyReference} className={styles["editor-body"]}>
            {hasLegacyQuestionPolygons ? (
              <CanvasFloatingControls
                isPolygonVisible={isPolygonVisible}
                onTogglePolygonVisible={(event) => {
                  void event;
                  setIsPolygonVisible((visible) => !visible);
                }}
              />
            ) : undefined}
            <div className={styles["flat-page-list"]}>
              {pages.map((page) => (
                <PageCanvas
                  key={page.pageKey}
                  focusRequest={focusRequest}
                  isPolygonVisible={isPolygonVisible}
                  isQuestionSelectionLocked={isQuestionSelectionLocked}
                  onQuestionSelect={onQuestionSelect}
                  page={page}
                  scrollContainerRef={editorBodyReference}
                  selectedQuestionId={selectedQuestionId}
                  zoomScale={zoomScale}
                />
              ))}
            </div>
            <CanvasZoomControls
              onZoomChange={updateZoomScale}
              zoomScale={zoomScale}
            />
          </div>
        )}
      </div>
    </div>
  );
};

PageEditor.propTypes = {
  answerFileUrl: PropTypes.string,
  answerPages: PropTypes.arrayOf(PropTypes.object),
  answerSheetMarkdown: PropTypes.string,
  answerTextPages: PropTypes.arrayOf(PropTypes.object),
  focusRequest: PropTypes.shape({
    questionId: PropTypes.string,
    source: PropTypes.string,
    token: PropTypes.number,
  }),
  isQuestionSelectionLocked: PropTypes.bool,
  onApplyReferenceEdits: PropTypes.func.isRequired,
  onQuestionSelect: PropTypes.func.isRequired,
  pages: PropTypes.arrayOf(PropTypes.object).isRequired,
  questions: PropTypes.arrayOf(PropTypes.object),
  selectedQuestionId: PropTypes.string,
};

PageEditor.defaultProps = {
  answerFileUrl: "",
  answerPages: [],
  answerSheetMarkdown: "",
  answerTextPages: [],
  focusRequest: undefined,
  isQuestionSelectionLocked: false,
  questions: [],
  selectedQuestionId: undefined,
};

export default PageEditor;
