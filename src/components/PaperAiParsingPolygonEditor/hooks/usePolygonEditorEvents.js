import { useCallback } from "react";

/** @typedef {import("../editorPayloads").EditorPolygonPayload} EditorPolygonPayload */

/**
 * @callback PolygonEditorEventHandler
 * @param {{
 *   type: string,
 *   polygon?: EditorPolygonPayload,
 *   polygons?: EditorPolygonPayload[],
 *   category?: string
 * }} payload
 * @returns {void}
 */

/**
 * @callback PolygonEditorChangeHandler
 * @param {{
 *   reason: string,
 *   polygon: EditorPolygonPayload | null,
 *   polygons: EditorPolygonPayload[]
 * }} payload
 * @returns {void}
 */

/**
 * @param {{
 *   onChange?: PolygonEditorChangeHandler | null,
 *   onEvent?: PolygonEditorEventHandler | null
 * }} params
 */
export const usePolygonEditorEvents = ({ onChange, onEvent }) => {
  const dispatchEvent = useCallback(
    (type, payload) => {
      if (typeof onEvent !== "function") {
        return;
      }

      onEvent({
        type,
        ...payload,
      });
    },
    [onEvent],
  );

  const dispatchChange = useCallback(
    (payload) => {
      if (typeof onChange !== "function") {
        return;
      }

      onChange(payload);
    },
    [onChange],
  );

  return {
    dispatchChange,
    dispatchEvent,
  };
};
