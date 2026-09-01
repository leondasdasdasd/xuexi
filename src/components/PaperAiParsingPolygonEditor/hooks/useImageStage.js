import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** @typedef {import("../annotationGeometry").EditorSize} EditorSize */

const EMPTY_SIZE = {
  height: 0,
  width: 0,
};

/**
 * @param {{
 *   imageUrl: string,
 *   onResetInteractionState: () => void
 * }} params
 */
export const useImageStage = ({ imageUrl, onResetInteractionState }) => {
  const containerReference = useRef(null);
  const overlayReference = useRef(null);
  const naturalSizeReference = useRef(EMPTY_SIZE);

  const [displaySize, setDisplaySize] = useState(EMPTY_SIZE);
  const [imageStatus, setImageStatus] = useState(
    imageUrl ? "loading" : "empty",
  );
  const [naturalSize, setNaturalSize] = useState(EMPTY_SIZE);

  useEffect(() => {
    naturalSizeReference.current = naturalSize;
  }, [naturalSize]);

  const updateDisplaySize = useCallback(() => {
    if (!containerReference.current) {
      return;
    }

    setDisplaySize({
      width: containerReference.current.clientWidth || 0,
      height: containerReference.current.clientHeight || 0,
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updateDisplaySize);

    let resizeObserver = null;

    if (typeof ResizeObserver !== "undefined" && containerReference.current) {
      resizeObserver = new ResizeObserver(updateDisplaySize);
      resizeObserver.observe(containerReference.current);
    }

    updateDisplaySize();

    return () => {
      window.removeEventListener("resize", updateDisplaySize);

      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [updateDisplaySize]);

  useEffect(() => {
    setImageStatus(imageUrl ? "loading" : "empty");
    setNaturalSize(EMPTY_SIZE);
    onResetInteractionState();
  }, [imageUrl, onResetInteractionState]);

  const handleImageLoad = useCallback(
    (event) => {
      const nextNaturalSize = {
        width: event.target.naturalWidth || 0,
        height: event.target.naturalHeight || 0,
      };

      setNaturalSize(nextNaturalSize);
      setImageStatus("ready");
      onResetInteractionState();
      updateDisplaySize();
    },
    [onResetInteractionState, updateDisplaySize],
  );

  const handleImageError = useCallback(() => {
    setNaturalSize(EMPTY_SIZE);
    setImageStatus("error");
  }, []);

  const references = useMemo(
    () => ({
      containerRef: containerReference,
      overlayRef: overlayReference,
    }),
    [],
  );

  return {
    displaySize,
    handleImageError,
    handleImageLoad,
    imageStatus,
    naturalSize,
    naturalSizeRef: naturalSizeReference,
    refs: references,
  };
};
