import React from "react";
import PropTypes from "prop-types";

import { DEFAULT_CATEGORY_COLOR } from "./annotationGeometry";
import AnnotationLayer from "./AnnotationLayer";
import {
  categoryMapShape,
  pointShape,
  polygonShape,
  sizeShape,
} from "./annotationPropTypes";
import DraftRectangle from "./DraftRectangle";

const canvasWrapperStyle = {
  height: "100%",
  overflow: "auto",
  width: "100%",
};

const stageStyle = {
  minHeight: "100%",
  position: "relative",
  userSelect: "none",
  WebkitUserSelect: "none",
  width: "100%",
};

const imageStyle = {
  display: "block",
  height: "auto",
  userSelect: "none",
  width: "100%",
};

const overlayStyle = (cursor) => ({
  cursor,
  inset: 0,
  position: "absolute",
  userSelect: "none",
  WebkitUserSelect: "none",
  zIndex: 0,
});

const renderNode = (render, payload, fallback) => {
  if (typeof render !== "function") {
    return fallback;
  }

  const renderedNode = render({
    ...payload,
    defaultNode: fallback,
  });

  return renderedNode == undefined ? fallback : renderedNode;
};

const PaperAiParsingPolygonEditorCanvas = ({
  controller,
  hideDeleteControl,
  renderAnnotation,
  renderDeleteControl,
  renderDraft,
  renderEmptyState,
  renderErrorState,
  renderImage,
  renderResizeControls,
  renderStage,
}) => {
  const { getters, renderContext, state } = controller;
  const {
    activeStrokeColor,
    annotations,
    categoryMap,
    displaySize,
    draftRectangle,
    imageStatus,
    previewAnnotationMap,
    selectedAnnotationId,
  } = renderContext;

  if (imageStatus === "empty") {
    return renderNode(renderEmptyState, { controller }, null);
  }

  if (imageStatus === "error") {
    return renderNode(renderErrorState, { controller }, null);
  }

  const containerProperties = getters.getContainerProps();
  const imageProperties = getters.getImageProps();
  const overlayProperties = getters.getOverlayProps();
  const overlayCursor = state.isPointerInsideAnnotation
    ? "pointer"
    : "crosshair";
  const imageNode = renderNode(
    renderImage,
    {
      controller,
      imageProps: imageProperties,
    },
    <img {...imageProperties} style={imageStyle} />,
  );
  const overlayNode = (
    <svg {...overlayProperties} style={overlayStyle(overlayCursor)}>
      <AnnotationLayer
        annotations={annotations}
        categoryMap={categoryMap}
        displaySize={displaySize}
        getAnnotationProps={getters.getAnnotationProps}
        getDeleteControlProps={getters.getDeleteControlProps}
        getResizeHandleProps={getters.getResizeHandleProps}
        hideDeleteControl={hideDeleteControl}
        previewAnnotationMap={previewAnnotationMap}
        renderAnnotation={renderAnnotation}
        renderDeleteControl={renderDeleteControl}
        renderResizeControls={
          state.readOnly ? () => false : renderResizeControls
        }
        selectedAnnotationId={selectedAnnotationId}
      />
      <DraftRectangle
        color={activeStrokeColor || DEFAULT_CATEGORY_COLOR}
        displaySize={displaySize}
        points={draftRectangle}
        renderDraft={renderDraft}
      />
    </svg>
  );
  const defaultStageNode = (
    <div style={canvasWrapperStyle}>
      <div {...containerProperties} style={stageStyle}>
        {imageNode}
        {overlayNode}
      </div>
    </div>
  );

  return renderNode(
    renderStage,
    {
      containerProps: containerProperties,
      controller,
      imageNode,
      overlayNode,
      stageProps: {
        style: stageStyle,
      },
    },
    defaultStageNode,
  );
};

PaperAiParsingPolygonEditorCanvas.propTypes = {
  controller: PropTypes.shape({
    getters: PropTypes.shape({
      getAnnotationProps: PropTypes.func.isRequired,
      getContainerProps: PropTypes.func.isRequired,
      getDeleteControlProps: PropTypes.func.isRequired,
      getImageProps: PropTypes.func.isRequired,
      getOverlayProps: PropTypes.func.isRequired,
      getResizeHandleProps: PropTypes.func.isRequired,
    }).isRequired,
    renderContext: PropTypes.shape({
      activeStrokeColor: PropTypes.string,
      annotations: PropTypes.arrayOf(polygonShape).isRequired,
      categoryMap: categoryMapShape.isRequired,
      displaySize: sizeShape.isRequired,
      draftRectangle: PropTypes.arrayOf(pointShape),
      imageStatus: PropTypes.string.isRequired,
      previewAnnotationMap: PropTypes.objectOf(PropTypes.arrayOf(pointShape))
        .isRequired,
      selectedAnnotationId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
    }).isRequired,
    state: PropTypes.shape({
      isPointerInsideAnnotation: PropTypes.bool.isRequired,
      readOnly: PropTypes.bool,
    }).isRequired,
  }).isRequired,
  hideDeleteControl: PropTypes.bool,
  renderAnnotation: PropTypes.func,
  renderDeleteControl: PropTypes.func,
  renderDraft: PropTypes.func,
  renderEmptyState: PropTypes.func,
  renderErrorState: PropTypes.func,
  renderImage: PropTypes.func,
  renderResizeControls: PropTypes.func,
  renderStage: PropTypes.func,
};

PaperAiParsingPolygonEditorCanvas.defaultProps = {
  hideDeleteControl: false,
  renderAnnotation: null,
  renderDeleteControl: null,
  renderDraft: null,
  renderEmptyState: null,
  renderErrorState: null,
  renderImage: null,
  renderResizeControls: null,
  renderStage: null,
};

export default PaperAiParsingPolygonEditorCanvas;
