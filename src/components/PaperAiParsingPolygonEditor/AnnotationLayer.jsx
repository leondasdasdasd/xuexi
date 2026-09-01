import React from "react";
import PropTypes from "prop-types";

import AnnotationItem from "./AnnotationItem";
import {
  categoryMapShape,
  pointShape,
  polygonShape,
  sizeShape,
} from "./annotationPropTypes";

/**
 * @param {{
 *   annotations?: import("./annotationGeometry").EditorPolygon[],
 *   categoryMap: Record<string, import("./annotationGeometry").EditorCategory>,
 *   displaySize: import("./annotationGeometry").EditorSize,
 *   getAnnotationProps: (annotation: import("./annotationGeometry").EditorPolygon) => Record<string, any>,
 *   getDeleteControlProps: (annotationId: string | number) => Record<string, any>,
 *   getResizeHandleProps: (
 *     annotation: import("./annotationGeometry").EditorPolygon,
 *     edge: import("./annotationGeometry").ResizeEdge
 *   ) => Record<string, any>,
 *   hideDeleteControl?: boolean,
 *   previewAnnotationMap: Record<string | number, import("./annotationGeometry").EditorPoint[]>,
 *   renderAnnotation?: Function | null,
 *   renderDeleteControl?: Function | null,
 *   renderResizeControls?: Function | null,
 *   selectedAnnotationId?: string | number | null
 * }} props
 */
const AnnotationLayer = ({
  annotations,
  categoryMap,
  displaySize,
  getAnnotationProps,
  getDeleteControlProps,
  getResizeHandleProps,
  hideDeleteControl,
  previewAnnotationMap,
  renderAnnotation,
  renderDeleteControl,
  renderResizeControls,
  selectedAnnotationId,
}) => {
  if (!displaySize.width || !displaySize.height) {
    return null;
  }

  return annotations.map((annotation) => (
    <AnnotationItem
      annotation={annotation}
      categoryMap={categoryMap}
      displaySize={displaySize}
      getAnnotationProps={getAnnotationProps}
      getDeleteControlProps={getDeleteControlProps}
      getResizeHandleProps={getResizeHandleProps}
      hideDeleteControl={hideDeleteControl}
      isSelected={annotation.id === selectedAnnotationId}
      key={annotation.id}
      points={previewAnnotationMap[annotation.id] || annotation.points}
      renderAnnotation={renderAnnotation}
      renderDeleteControl={renderDeleteControl}
      renderResizeControls={renderResizeControls}
    />
  ));
};

AnnotationLayer.propTypes = {
  annotations: PropTypes.arrayOf(polygonShape),
  categoryMap: categoryMapShape.isRequired,
  displaySize: sizeShape.isRequired,
  getAnnotationProps: PropTypes.func.isRequired,
  getDeleteControlProps: PropTypes.func.isRequired,
  getResizeHandleProps: PropTypes.func.isRequired,
  hideDeleteControl: PropTypes.bool,
  previewAnnotationMap: PropTypes.objectOf(PropTypes.arrayOf(pointShape))
    .isRequired,
  renderAnnotation: PropTypes.func,
  renderDeleteControl: PropTypes.func,
  renderResizeControls: PropTypes.func,
  selectedAnnotationId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
};

AnnotationLayer.defaultProps = {
  annotations: [],
  hideDeleteControl: false,
  renderAnnotation: null,
  renderDeleteControl: null,
  renderResizeControls: null,
  selectedAnnotationId: null,
};

export default AnnotationLayer;
