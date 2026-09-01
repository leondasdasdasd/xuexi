import { useCallback } from "react";

/**
 * @param {{
 *   overlayRef: { current: SVGElement | null }
 * }} params
 */
export const useEditorPointerCoordinates = ({ overlayRef }) => {
  const getPointFromMouseEvent = useCallback(
    (event) => {
      if (!overlayRef.current) {
        return null;
      }

      const rect = overlayRef.current.getBoundingClientRect();

      if (!rect.width || !rect.height) {
        return null;
      }

      return {
        x: Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1),
        y: Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1),
      };
    },
    [overlayRef],
  );

  return {
    getPointFromMouseEvent,
  };
};
