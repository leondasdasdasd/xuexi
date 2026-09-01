import React from "react";
import PropTypes from "prop-types";

import { DELETE_BUTTON_SIZE } from "./annotationGeometry";

const deleteButtonStyle = {
  cursor: "pointer",
};

const deleteButtonIconStyle = {
  pointerEvents: "none",
  stroke: "#ffffff",
  strokeLinecap: "round",
  strokeWidth: 2,
  userSelect: "none",
  WebkitUserSelect: "none",
};

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
 *   annotationId: string | number,
 *   controlProps?: Record<string, any>,
 *   position: { x: number, y: number },
 *   renderDeleteControl?: Function | null
 * }} props
 */
const AnnotationDeleteButton = ({
  annotationId,
  controlProps,
  position,
  renderDeleteControl,
}) => {
  const defaultNode = (
    <g
      {...controlProps}
      style={deleteButtonStyle}
      transform={`translate(${position.x}, ${position.y})`}
    >
      <circle
        cx={DELETE_BUTTON_SIZE / 2}
        cy={DELETE_BUTTON_SIZE / 2}
        fill="#ef4437"
        r={DELETE_BUTTON_SIZE / 2}
      />
      <line style={deleteButtonIconStyle} x1="8" x2="16" y1="8" y2="16" />
      <line style={deleteButtonIconStyle} x1="16" x2="8" y1="8" y2="16" />
    </g>
  );

  return renderNode(
    renderDeleteControl,
    {
      annotationId,
      controlProps,
      position,
    },
    defaultNode,
  );
};

AnnotationDeleteButton.propTypes = {
  annotationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  controlProps: PropTypes.object,
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  renderDeleteControl: PropTypes.func,
};

AnnotationDeleteButton.defaultProps = {
  controlProps: {},
  renderDeleteControl: null,
};

export default AnnotationDeleteButton;
