import React from "react";
import PropTypes from "prop-types";

import AnnotationDeleteButton from "./AnnotationDeleteButton";
import {
  getDeleteButtonPosition,
  getRectangleMetrics,
  getResizeHandlePositions,
  isAxisAlignedRectangle,
} from "./annotationGeometry";
import {
  categoryMapShape,
  polygonShape,
  sizeShape,
} from "./annotationPropTypes";
import AnnotationResizeControls from "./AnnotationResizeControls";
import { buildAnnotationRenderStyle } from "./annotationStyle";

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

/**
 * @param {{
 *   annotation: import("./annotationGeometry").EditorPolygon,
 *   categoryMap: Record<string, import("./annotationGeometry").EditorCategory>,
 *   displaySize: import("./annotationGeometry").EditorSize,
 *   getAnnotationProps: (annotation: import("./annotationGeometry").EditorPolygon) => Record<string, any>,
 *   getDeleteControlProps: (annotationId: string | number) => Record<string, any>,
 *   getResizeHandleProps: (
 *     annotation: import("./annotationGeometry").EditorPolygon,
 *     edge: import("./annotationGeometry").ResizeEdge
 *   ) => Record<string, any>,
 *   hideDeleteControl?: boolean,
 *   isSelected?: boolean,
 *   points?: import("./annotationGeometry").EditorPoint[],
 *   renderAnnotation?: Function | null,
 *   renderDeleteControl?: Function | null,
 *   renderResizeControls?: Function | null
 * }} props
 */
const AnnotationItem = ({
  annotation,
  categoryMap,
  displaySize,
  getAnnotationProps,
  getDeleteControlProps,
  getResizeHandleProps,
  hideDeleteControl,
  isSelected,
  points,
  renderAnnotation,
  renderDeleteControl,
  renderResizeControls,
}) => {
  const polygonPoints = points || annotation.points;
  const pointString = polygonPoints
    .map(
      (point) =>
        `${point.x * displaySize.width},${point.y * displaySize.height}`,
    )
    .join(" ");
  const renderStyle = buildAnnotationRenderStyle(annotation, categoryMap, {
    isSelected,
  });
  const rectMetrics = getRectangleMetrics(polygonPoints, displaySize);
  const resizeHandlePositions = getResizeHandlePositions(polygonPoints);
  const canResize = Boolean(
    isSelected &&
    isAxisAlignedRectangle(polygonPoints) &&
    resizeHandlePositions,
  );
  const topLeft = rectMetrics ? rectMetrics.topLeft : { x: 0, y: 18 };
  const deleteButtonPosition = getDeleteButtonPosition(rectMetrics);
  const annotationProperties = getAnnotationProps(annotation);
  const defaultNode = (
    <g {...annotationProperties}>
      {renderStyle.underlayStyle ? (
        <polygon points={pointString} style={renderStyle.underlayStyle} />
      ) : null}
      <polygon points={pointString} style={renderStyle.polygonStyle} />
      {annotation.label ? (
        <text
          style={renderStyle.labelStyle}
          x={topLeft.x}
          y={Math.max(topLeft.y - 10, 18)}
        >
          {annotation.label}
        </text>
      ) : null}
      {canResize ? (
        <AnnotationResizeControls
          annotation={annotation}
          color={renderStyle.resizeColor}
          displaySize={displaySize}
          getResizeHandleProps={getResizeHandleProps}
          handlePositions={resizeHandlePositions}
          rectMetrics={rectMetrics}
          renderResizeControls={renderResizeControls}
        />
      ) : null}
      {isSelected && !hideDeleteControl ? (
        <AnnotationDeleteButton
          annotationId={annotation.id}
          controlProps={getDeleteControlProps(annotation.id)}
          position={deleteButtonPosition}
          renderDeleteControl={renderDeleteControl}
        />
      ) : null}
    </g>
  );

  return renderNode(
    renderAnnotation,
    {
      annotation,
      annotationProps: annotationProperties,
      canResize,
      defaultNode,
      deleteButtonPosition,
      displaySize,
      isSelected,
      pointString,
      points: polygonPoints,
      rectMetrics,
      renderStyle,
      resizeHandlePositions,
      topLeft,
    },
    defaultNode,
  );
};

AnnotationItem.propTypes = {
  annotation: polygonShape.isRequired,
  categoryMap: categoryMapShape.isRequired,
  displaySize: sizeShape.isRequired,
  getAnnotationProps: PropTypes.func.isRequired,
  getDeleteControlProps: PropTypes.func.isRequired,
  getResizeHandleProps: PropTypes.func.isRequired,
  hideDeleteControl: PropTypes.bool,
  isSelected: PropTypes.bool,
  points: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }),
  ),
  renderAnnotation: PropTypes.func,
  renderDeleteControl: PropTypes.func,
  renderResizeControls: PropTypes.func,
};

AnnotationItem.defaultProps = {
  hideDeleteControl: false,
  isSelected: false,
  points: null,
  renderAnnotation: null,
  renderDeleteControl: null,
  renderResizeControls: null,
};

export default AnnotationItem;
