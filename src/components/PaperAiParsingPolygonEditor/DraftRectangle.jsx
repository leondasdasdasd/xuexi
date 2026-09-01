import React from "react";
import PropTypes from "prop-types";

import { getRectangleMetrics } from "./annotationGeometry";
import { pointShape, sizeShape } from "./annotationPropTypes";

const draftRectangleStyle = (color) => ({
  fill: `${color}22`,
  pointerEvents: "none",
  stroke: color,
  strokeDasharray: "6 4",
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
 *   color: string,
 *   displaySize: import("./annotationGeometry").EditorSize,
 *   points?: import("./annotationGeometry").EditorPoint[] | null,
 *   renderDraft?: Function | null
 * }} props
 */
const DraftRectangle = ({ color, displaySize, points, renderDraft }) => {
  if (!points || !displaySize.width || !displaySize.height) {
    return null;
  }

  const rectMetrics = getRectangleMetrics(points, displaySize);

  if (!rectMetrics) {
    return null;
  }

  const defaultNode = (
    <rect
      height={rectMetrics.height}
      style={draftRectangleStyle(color)}
      width={rectMetrics.width}
      x={rectMetrics.x}
      y={rectMetrics.y}
    />
  );

  return renderNode(
    renderDraft,
    {
      color,
      points,
      rectMetrics,
    },
    defaultNode,
  );
};

DraftRectangle.propTypes = {
  color: PropTypes.string.isRequired,
  displaySize: sizeShape.isRequired,
  points: PropTypes.arrayOf(pointShape),
  renderDraft: PropTypes.func,
};

DraftRectangle.defaultProps = {
  points: null,
  renderDraft: null,
};

export default DraftRectangle;
