import React from "react";
import PropTypes from "prop-types";

import {
  RESIZE_HANDLE_SIZE,
  RESIZE_HIT_STROKE_WIDTH,
} from "./annotationGeometry";
import {
  buildRectangleEdges,
  toDisplayPoint,
} from "./annotationItemViewModels";

const EDGE_CURSOR_MAP = {
  left: "ew-resize",
  right: "ew-resize",
  top: "ns-resize",
  bottom: "ns-resize",
};

const resizeEdgeStyle = (cursor) => ({
  cursor,
  fill: "none",
});

const resizeEdgeHitAreaStyle = (cursor) => ({
  cursor,
  fill: "none",
  stroke: "transparent",
});

const resizeHandleStyle = (cursor) => ({
  cursor,
  fill: "#ffffff",
  strokeWidth: 2,
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

/**
 * @param {{
 *   annotation: import("./annotationGeometry").EditorPolygon,
 *   color: string,
 *   displaySize: import("./annotationGeometry").EditorSize,
 *   getResizeHandleProps: (
 *     annotation: import("./annotationGeometry").EditorPolygon,
 *     edge: import("./annotationGeometry").ResizeEdge
 *   ) => Record<string, any>,
 *   handlePositions: Record<string, import("./annotationGeometry").EditorPoint>,
 *   rectMetrics: import("./annotationGeometry").RectangleMetrics | null,
 *   renderResizeControls?: Function | null
 * }} props
 */
const AnnotationResizeControls = ({
  annotation,
  color,
  displaySize,
  getResizeHandleProps,
  handlePositions,
  rectMetrics,
  renderResizeControls,
}) => {
  const rectangleEdges = buildRectangleEdges(rectMetrics);
  const defaultNode = (
    <React.Fragment>
      {rectangleEdges.map(({ edge, line }) => {
        const resizeHandleProperties = getResizeHandleProps(annotation, edge);

        return (
          <g key={edge}>
            <line
              {...resizeHandleProperties}
              stroke={color}
              strokeWidth="2"
              style={resizeEdgeStyle(EDGE_CURSOR_MAP[edge])}
              x1={line.x1}
              x2={line.x2}
              y1={line.y1}
              y2={line.y2}
            />
            <line
              {...resizeHandleProperties}
              strokeWidth={RESIZE_HIT_STROKE_WIDTH}
              style={resizeEdgeHitAreaStyle(EDGE_CURSOR_MAP[edge])}
              x1={line.x1}
              x2={line.x2}
              y1={line.y1}
              y2={line.y2}
            />
          </g>
        );
      })}
      {Object.keys(handlePositions).map((edge) => {
        const position = toDisplayPoint(handlePositions[edge], displaySize);
        const resizeHandleProperties = getResizeHandleProps(annotation, edge);

        return (
          <rect
            {...resizeHandleProperties}
            height={RESIZE_HANDLE_SIZE}
            key={edge}
            rx="3"
            ry="3"
            stroke={color}
            style={resizeHandleStyle(EDGE_CURSOR_MAP[edge])}
            width={RESIZE_HANDLE_SIZE}
            x={position.x - RESIZE_HANDLE_SIZE / 2}
            y={position.y - RESIZE_HANDLE_SIZE / 2}
          />
        );
      })}
    </React.Fragment>
  );

  return renderNode(
    renderResizeControls,
    {
      annotation,
      color,
      defaultNode,
      displaySize,
      handlePositions,
      rectMetrics,
    },
    defaultNode,
  );
};

AnnotationResizeControls.propTypes = {
  annotation: PropTypes.object.isRequired,
  color: PropTypes.string.isRequired,
  displaySize: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  getResizeHandleProps: PropTypes.func.isRequired,
  handlePositions: PropTypes.objectOf(
    PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }),
  ).isRequired,
  rectMetrics: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    topLeft: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }).isRequired,
  }),
  renderResizeControls: PropTypes.func,
};

AnnotationResizeControls.defaultProps = {
  rectMetrics: null,
  renderResizeControls: null,
};

export default AnnotationResizeControls;
