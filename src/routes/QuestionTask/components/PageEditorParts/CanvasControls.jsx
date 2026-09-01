import React from "react";
import PropTypes from "prop-types";

import { trans } from "../../../../utils/i18n";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  ORIGINAL_ZOOM_SCALE,
  ZOOM_STEP,
} from "./pageEditorData";

import styles from "./CanvasControls.module.less";

const CanvasFloatingControls = ({
  isPolygonVisible,
  onTogglePolygonVisible,
}) => (
  <div className={styles["editor-canvas-top-actions"]}>
    <button
      type="button"
      className={styles["editor-canvas-float-button"]}
      onClick={onTogglePolygonVisible}
    >
      {isPolygonVisible
        ? trans("questionTask.hidePolygon", "隐藏框线")
        : trans("questionTask.showPolygon", "显示框线")}
    </button>
  </div>
);

CanvasFloatingControls.propTypes = {
  isPolygonVisible: PropTypes.bool.isRequired,
  onTogglePolygonVisible: PropTypes.func.isRequired,
};

const CanvasZoomControls = ({ onZoomChange, zoomScale }) => (
  <div className={styles["editor-canvas-bottom-dock"]}>
    <div className={styles["zoom-controls"]}>
      <button
        aria-label={trans("questionTask.zoomOutImage", "缩小原图")}
        className={styles["zoom-button"]}
        disabled={zoomScale <= MIN_ZOOM}
        type="button"
        onClick={(event) => {
          void event;
          onZoomChange(Math.max(MIN_ZOOM, zoomScale - ZOOM_STEP));
        }}
      >
        -
      </button>
      <span className={styles["zoom-value"]}>{zoomScale}%</span>
      <button
        aria-label={trans("questionTask.zoomInImage", "放大原图")}
        className={styles["zoom-button"]}
        disabled={zoomScale >= MAX_ZOOM}
        type="button"
        onClick={(event) => {
          void event;
          onZoomChange(Math.min(MAX_ZOOM, zoomScale + ZOOM_STEP));
        }}
      >
        +
      </button>
      <button
        className={styles["zoom-reset-button"]}
        title={trans(
          "questionTask.zoomResetShortcut",
          "快捷键：+ 放大，- 缩小，0 还原",
        )}
        type="button"
        onClick={(event) => {
          void event;
          onZoomChange(ORIGINAL_ZOOM_SCALE);
        }}
      >
        {trans("questionTask.zoomReset", "原始")}
      </button>
    </div>
  </div>
);

CanvasZoomControls.propTypes = {
  onZoomChange: PropTypes.func.isRequired,
  zoomScale: PropTypes.number.isRequired,
};

export { CanvasFloatingControls, CanvasZoomControls };
