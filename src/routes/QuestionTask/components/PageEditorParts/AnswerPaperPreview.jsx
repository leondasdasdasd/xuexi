import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

import { trans } from "../../../../utils/i18n";
import AnswerTextPreview from "./AnswerTextPreview";
import { CanvasZoomControls } from "./CanvasControls";
import {
  isEditableTarget,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
} from "./pageEditorData";

import previewStyles from "./AnswerPaperPreview.module.less";
import styles from "./AnswerPaperPreviewLayout.module.less";

const css = {
  imageError: previewStyles["answer-preview-image-error"],
  imageList: previewStyles["answer-preview-image-list"],
  imagePage: previewStyles["answer-preview-image-page"],
  imagePageBadge: previewStyles["answer-preview-image-page-badge"],
};
const ORIGINAL_ZOOM_SCALE = 100;

const getAnswerPageNumber = (page, index) =>
  page && page.pageNumber ? page.pageNumber : index + 1;

const hasPageImage = (answerPages) =>
  (Array.isArray(answerPages) ? answerPages : []).some(
    (page) => !!(page && page.imageUrl),
  );

const getAnswerPreviewAvailability = ({
  answerFileUrl,
  answerPages,
  answerSheetMarkdown,
  answerTextPages,
}) => ({
  hasImage: hasPageImage(answerPages) || !!answerFileUrl,
  hasText:
    !!String(answerSheetMarkdown || "").trim() ||
    (Array.isArray(answerTextPages) && answerTextPages.length > 0),
});

const AnswerPageImage = ({ index, page }) => {
  const imageReference = useRef(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imageUrl = page && page.imageUrl;
  const pageNumber = getAnswerPageNumber(page, index);
  const handleImageLoad = (event) => {
    if (event.currentTarget) {
      setIsImageLoaded(true);
    }
  };

  useEffect(() => {
    setIsImageLoaded(false);
  }, [imageUrl]);

  useEffect(() => {
    if (
      imageReference.current &&
      imageReference.current.complete &&
      imageReference.current.naturalWidth > 0
    ) {
      setIsImageLoaded(true);
    }
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <div className={css.imageError}>
        {page && page.errorMessage
          ? page.errorMessage
          : trans("questionTask.noAnswerImage", "暂无解析图片")}
      </div>
    );
  }

  return (
    <>
      {isImageLoaded && (
        <div className={css.imagePageBadge}>
          {trans("questionTask.answerPageLabel", "解析第 {$pageNumber} 页", {
            pageNumber,
          })}
        </div>
      )}
      <img
        ref={imageReference}
        alt={trans("questionTask.answerPageAlt", "解析第 {$pageNumber} 页", {
          pageNumber,
        })}
        src={imageUrl}
        onLoad={handleImageLoad}
      />
    </>
  );
};

AnswerPageImage.propTypes = {
  index: PropTypes.number.isRequired,
  page: PropTypes.object,
};

AnswerPageImage.defaultProps = {
  page: undefined,
};

const renderAnswerPageImageContent = (page, index) =>
  page && page.imageUrl ? (
    <AnswerPageImage index={index} page={page} />
  ) : (
    <div className={css.imageError}>
      {page && page.errorMessage
        ? page.errorMessage
        : trans("questionTask.noAnswerImage", "暂无解析图片")}
    </div>
  );

const renderAnswerPageImage = (page, index) => (
  <section
    className={css.imagePage}
    key={(page && page.pageKey) || `answer-page-${index + 1}`}
  >
    {renderAnswerPageImageContent(page, index)}
  </section>
);

const renderAnswerPageImageList = (answerPages) => (
  <div className={css.imageList}>
    {answerPages.map((page, index) => renderAnswerPageImage(page, index))}
  </div>
);

const renderOriginalAnswerFilePreview = (answerFileUrl) => (
  <iframe
    className={styles["answer-preview-frame"]}
    src={answerFileUrl}
    title={trans("detail.viewAnalysis", "查看解析")}
  />
);

const renderAnswerImagePreview = ({
  answerFileUrl,
  normalizedAnswerPages,
  onZoomChange,
  shouldRenderAnswerPages,
  zoomScale,
}) => (
  <>
    <div className={styles["answer-preview-image-body"]}>
      <div
        className={styles["answer-preview-image-stage"]}
        style={{
          height: `${zoomScale}%`,
          width: `${zoomScale}%`,
        }}
      >
        {shouldRenderAnswerPages
          ? renderAnswerPageImageList(normalizedAnswerPages)
          : renderOriginalAnswerFilePreview(answerFileUrl)}
      </div>
    </div>
    <CanvasZoomControls onZoomChange={onZoomChange} zoomScale={zoomScale} />
  </>
);

const AnswerPaperPreview = ({
  answerFileUrl,
  answerPages,
  answerSheetMarkdown,
  answerTextPages,
  onZoomChange,
  zoomScale,
}) => {
  const normalizedAnswerPages = Array.isArray(answerPages) ? answerPages : [];
  const shouldRenderAnswerPages = hasPageImage(normalizedAnswerPages);
  const { hasImage, hasText } = getAnswerPreviewAvailability({
    answerFileUrl,
    answerPages: normalizedAnswerPages,
    answerSheetMarkdown,
    answerTextPages,
  });
  const [answerPreviewMode, setAnswerPreviewMode] = useState(
    hasImage ? "image" : "text",
  );

  useEffect(() => {
    if (answerPreviewMode === "image" && !hasImage) {
      setAnswerPreviewMode("text");
    }
    if (answerPreviewMode === "text" && !hasText && hasImage) {
      setAnswerPreviewMode("image");
    }
  }, [answerPreviewMode, hasImage, hasText]);

  useEffect(() => {
    if (answerPreviewMode !== "image") {
      return;
    }

    const handleKeyDown = (event) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        onZoomChange(Math.min(MAX_ZOOM, zoomScale + ZOOM_STEP));
        return;
      }

      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        onZoomChange(Math.max(MIN_ZOOM, zoomScale - ZOOM_STEP));
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        onZoomChange(ORIGINAL_ZOOM_SCALE);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return (cleanupToken) => {
      void cleanupToken;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [answerPreviewMode, onZoomChange, zoomScale]);

  const showImagePreview = (event) => {
    event.preventDefault();
    setAnswerPreviewMode("image");
  };
  const showTextPreview = (event) => {
    event.preventDefault();
    setAnswerPreviewMode("text");
  };

  return (
    <div className={styles["answer-preview"]}>
      <div className={styles["answer-preview-top-actions"]}>
        <div className={styles["answer-preview-mode-switch"]}>
          <button
            className={`${styles["answer-preview-mode-button"]} ${
              answerPreviewMode === "image"
                ? styles["answer-preview-mode-button-active"]
                : ""
            }`}
            disabled={!hasImage}
            type="button"
            onClick={showImagePreview}
          >
            {trans("questionTask.answerImageTab", "图片")}
          </button>
          <button
            className={`${styles["answer-preview-mode-button"]} ${
              answerPreviewMode === "text"
                ? styles["answer-preview-mode-button-active"]
                : ""
            }`}
            disabled={!hasText}
            type="button"
            onClick={showTextPreview}
          >
            {trans("questionTask.answerTextTab", "文本")}
          </button>
        </div>
      </div>
      {answerPreviewMode === "text" ? (
        <AnswerTextPreview
          markdown={answerSheetMarkdown}
          pages={answerTextPages}
        />
      ) : (
        renderAnswerImagePreview({
          answerFileUrl,
          normalizedAnswerPages,
          onZoomChange,
          shouldRenderAnswerPages,
          zoomScale,
        })
      )}
    </div>
  );
};

AnswerPaperPreview.propTypes = {
  answerFileUrl: PropTypes.string,
  answerPages: PropTypes.arrayOf(PropTypes.object),
  answerSheetMarkdown: PropTypes.string,
  answerTextPages: PropTypes.arrayOf(PropTypes.object),
  onZoomChange: PropTypes.func.isRequired,
  zoomScale: PropTypes.number.isRequired,
};

AnswerPaperPreview.defaultProps = {
  answerFileUrl: "",
  answerPages: [],
  answerSheetMarkdown: "",
  answerTextPages: [],
};

export default AnswerPaperPreview;
