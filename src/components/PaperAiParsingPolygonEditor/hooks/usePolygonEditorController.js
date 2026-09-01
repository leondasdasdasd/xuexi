import { useCallback, useEffect, useMemo } from "react";

import {
  buildNewAnnotation,
  buildResizedRectanglePoints,
  isAxisAlignedRectangle,
  isOverlapping,
  normalizeAnnotations,
} from "../annotationGeometry";
import { POLYGON_EDITOR_EVENT } from "../editorEvents";
import {
  evaluateDraftCommit,
  evaluateDraftStart,
  shouldBlockPointerForCreation,
} from "../editorRules";
import {
  ANNOTATION_MUTATION_KIND,
  useAnnotationMutationEffects,
} from "./useAnnotationMutationEffects";
import { useEditorCategories } from "./useEditorCategories";
import { useEditorPointerCoordinates } from "./useEditorPointerCoordinates";
import { useImageStage } from "./useImageStage";
import { usePolygonEditorEvents } from "./usePolygonEditorEvents";
import {
  EDITOR_MACHINE_ACTION,
  shouldStartDraftFromPendingAnnotationPress,
  usePolygonEditorStateMachine,
} from "./usePolygonEditorStateMachine";

const collectOverlappingAnnotationIds = (points, annotations, annotationId) =>
  annotations
    .filter((item) => item.id !== annotationId)
    .filter((item) => isOverlapping(item.points, points))
    .map((item) => item.id);

const arePointsEqual = (pointsA, pointsB) =>
  pointsA.length === pointsB.length &&
  pointsA.every(
    (point, index) =>
      point.x === pointsB[index].x && point.y === pointsB[index].y,
  );

const shouldRollbackResize = ({
  allowOverlap,
  initialOverlapIds,
  nextOverlapIds,
}) =>
  !allowOverlap &&
  nextOverlapIds.some(
    (annotationId) => !initialOverlapIds.includes(annotationId),
  );

/**
 * @param {{
 *   allowOverlap?: boolean,
 *   allowCreate?: boolean,
 *   imageUrl?: string,
 *   onChange?: Function | null,
 *   onEvent?: Function | null,
 *   polygonCategories?: Array<string | import("../annotationGeometry").EditorCategory>,
 *   polygons?: import("../annotationGeometry").EditorPolygon[],
 *   readOnly?: boolean
 * }} params
 */
export const usePolygonEditorController = ({
  allowCreate = true,
  allowOverlap,
  imageUrl,
  onChange,
  onEvent,
  polygonCategories,
  polygons,
  readOnly,
}) => {
  const {
    activeCategory,
    activeStrokeColor,
    categories,
    categoryMap,
    setActiveCategory,
  } = useEditorCategories({
    polygonCategories,
  });
  const { dispatchChange, dispatchEvent } = usePolygonEditorEvents({
    onChange,
    onEvent,
  });
  const resetInteractionState = useCallback(() => {
    dispatch({
      type: EDITOR_MACHINE_ACTION.RESET_INTERACTION,
    });
  }, []);
  const {
    displaySize,
    handleImageError,
    handleImageLoad,
    imageStatus,
    naturalSize,
    naturalSizeRef,
    refs,
  } = useImageStage({
    imageUrl,
    onResetInteractionState: resetInteractionState,
  });
  const annotations = useMemo(
    () => normalizeAnnotations(polygons, naturalSize),
    [naturalSize, polygons],
  );
  const {
    dispatch,
    draftRectangle,
    interactionPhase,
    previewAnnotationMap,
    state: machineState,
  } = usePolygonEditorStateMachine();
  const { getPointFromMouseEvent } = useEditorPointerCoordinates({
    overlayRef: refs.overlayRef,
  });
  const { publishMutation } = useAnnotationMutationEffects({
    dispatchChange,
    dispatchEvent,
    naturalSizeRef,
  });

  const clearPendingAnnotationPress = useCallback(() => {
    dispatch({
      type: EDITOR_MACHINE_ACTION.CLEAR_PENDING_ANNOTATION_PRESS,
    });
  }, [dispatch]);

  const clearSelection = useCallback(() => {
    dispatch({
      type: EDITOR_MACHINE_ACTION.CLEAR_SELECTION,
    });
  }, [dispatch]);

  const setPointerInsideAnnotation = useCallback(
    (value) => {
      dispatch({
        type: EDITOR_MACHINE_ACTION.SET_POINTER_INSIDE_ANNOTATION,
        value,
      });
    },
    [dispatch],
  );

  const selectAnnotation = useCallback(
    (annotation) => {
      if (!annotation) {
        return;
      }

      dispatch({
        type: EDITOR_MACHINE_ACTION.SELECT_ANNOTATION,
        annotationId: annotation.id,
      });
      publishMutation({
        kind: ANNOTATION_MUTATION_KIND.SELECT,
        annotation,
        nextAnnotations: annotations,
      });
    },
    [annotations, dispatch, publishMutation],
  );

  const resetDraft = useCallback(() => {
    dispatch({
      type: EDITOR_MACHINE_ACTION.RESET_DRAFT,
    });
  }, [dispatch]);

  const createAnnotationFromDraft = useCallback(
    (draftPoints) => {
      const nextAnnotation = buildNewAnnotation({
        activeCategory,
        categoryMap,
        draftPoints,
      });
      const nextAnnotations = annotations.concat(nextAnnotation);

      dispatch({
        type: EDITOR_MACHINE_ACTION.SELECT_ANNOTATION,
        annotationId: nextAnnotation.id,
      });
      publishMutation({
        kind: ANNOTATION_MUTATION_KIND.CREATE,
        annotation: nextAnnotation,
        nextAnnotations,
      });
    },
    [activeCategory, annotations, categoryMap, dispatch, publishMutation],
  );

  const deleteAnnotation = useCallback(
    (annotationId) => {
      const deletedAnnotation = annotations.find(
        (item) => item.id === annotationId,
      );

      if (!deletedAnnotation) {
        return;
      }

      const nextAnnotations = annotations.filter(
        (item) => item.id !== annotationId,
      );

      clearSelection();
      publishMutation({
        kind: ANNOTATION_MUTATION_KIND.DELETE,
        annotation: deletedAnnotation,
        nextAnnotations,
      });
    },
    [annotations, clearSelection, publishMutation],
  );

  const updateAnnotation = useCallback(
    (annotationId, nextPoints) => {
      const updatedAnnotation = annotations.find(
        (item) => item.id === annotationId,
      );

      if (!updatedAnnotation || !nextPoints) {
        return false;
      }

      const nextAnnotation = {
        ...updatedAnnotation,
        points: nextPoints,
      };
      const nextAnnotations = annotations.map((item) =>
        item.id === annotationId ? nextAnnotation : item,
      );

      dispatch({
        type: EDITOR_MACHINE_ACTION.SELECT_ANNOTATION,
        annotationId,
      });
      publishMutation({
        kind: ANNOTATION_MUTATION_KIND.UPDATE,
        annotation: nextAnnotation,
        nextAnnotations,
      });
      return true;
    },
    [annotations, dispatch, publishMutation],
  );

  const startDraft = useCallback(
    (startPoint) => {
      dispatch({
        type: EDITOR_MACHINE_ACTION.START_DRAFT,
        startPoint,
      });
    },
    [dispatch],
  );

  const updateDraft = useCallback(
    (currentPoint) => {
      dispatch({
        type: EDITOR_MACHINE_ACTION.UPDATE_DRAFT,
        currentPoint,
      });
    },
    [dispatch],
  );

  const startResize = useCallback(
    (annotation, edge, event) => {
      if (
        readOnly ||
        !annotation ||
        !isAxisAlignedRectangle(annotation.points)
      ) {
        return;
      }

      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }

      dispatch({
        type: EDITOR_MACHINE_ACTION.START_RESIZE,
        resizeSession: {
          annotationId: annotation.id,
          edge,
          initialOverlapIds: collectOverlappingAnnotationIds(
            annotation.points,
            annotations,
            annotation.id,
          ),
          initialPoints: annotation.points,
          previewPoints: annotation.points,
        },
      });
    },
    [annotations, dispatch, readOnly],
  );

  const updateResize = useCallback(
    (event) => {
      if (!machineState.resizeSession) {
        return;
      }

      const currentPoint = getPointFromMouseEvent(event);

      if (!currentPoint) {
        return;
      }

      const nextValue =
        machineState.resizeSession.edge === "left" ||
        machineState.resizeSession.edge === "right"
          ? currentPoint.x
          : currentPoint.y;
      const nextPoints = buildResizedRectanglePoints(
        machineState.resizeSession.initialPoints,
        machineState.resizeSession.edge,
        nextValue,
      );

      if (!nextPoints) {
        return;
      }

      dispatch({
        type: EDITOR_MACHINE_ACTION.UPDATE_RESIZE_PREVIEW,
        previewPoints: nextPoints,
      });
    },
    [dispatch, getPointFromMouseEvent, machineState.resizeSession],
  );

  const finishResize = useCallback(() => {
    const resizeSession = machineState.resizeSession;

    if (!resizeSession) {
      return false;
    }

    const nextOverlapIds = collectOverlappingAnnotationIds(
      resizeSession.previewPoints,
      annotations,
      resizeSession.annotationId,
    );
    const rollbackResize = shouldRollbackResize({
      allowOverlap,
      initialOverlapIds: resizeSession.initialOverlapIds,
      nextOverlapIds,
    });

    if (
      !rollbackResize &&
      !arePointsEqual(resizeSession.initialPoints, resizeSession.previewPoints)
    ) {
      updateAnnotation(resizeSession.annotationId, resizeSession.previewPoints);
    }

    dispatch({
      type: EDITOR_MACHINE_ACTION.CANCEL_RESIZE,
    });
    return true;
  }, [
    allowOverlap,
    annotations,
    dispatch,
    machineState.resizeSession,
    updateAnnotation,
  ]);

  const cancelResize = useCallback(() => {
    dispatch({
      type: EDITOR_MACHINE_ACTION.CANCEL_RESIZE,
    });
  }, [dispatch]);

  const handleAnnotationMouseDown = useCallback(
    (annotation, event) => {
      if (event) {
        event.stopPropagation();
      }

      if (!annotation || !event || event.button !== 0) {
        return;
      }

      if (readOnly) {
        setPointerInsideAnnotation(true);
        selectAnnotation(annotation);
        return;
      }

      if (!allowOverlap) {
        setPointerInsideAnnotation(true);
        selectAnnotation(annotation);
        return;
      }

      const startPoint = getPointFromMouseEvent(event);

      if (!startPoint) {
        setPointerInsideAnnotation(true);
        selectAnnotation(annotation);
        return;
      }

      dispatch({
        type: EDITOR_MACHINE_ACTION.SET_PENDING_ANNOTATION_PRESS,
        annotation,
        startPoint,
      });
    },
    [
      allowOverlap,
      dispatch,
      getPointFromMouseEvent,
      readOnly,
      selectAnnotation,
      setPointerInsideAnnotation,
    ],
  );

  const handleAnnotationDelete = useCallback(
    (annotationId, event) => {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }

      clearPendingAnnotationPress();
      deleteAnnotation(annotationId);
    },
    [clearPendingAnnotationPress, deleteAnnotation],
  );

  const handleOverlayMouseDown = useCallback(
    (event) => {
      clearPendingAnnotationPress();

      if (event.button !== 0) {
        return;
      }

      const startPoint = getPointFromMouseEvent(event);
      const startRule = evaluateDraftStart({
        allowOverlap,
        annotations,
        point: startPoint,
        readOnly: readOnly || !allowCreate,
      });

      if (!startRule.canStart) {
        clearSelection();
        setPointerInsideAnnotation(startRule.reason === "inside_annotation");

        if (startRule.reason === "inside_annotation") {
          resetDraft();
        }

        return;
      }

      clearSelection();
      setPointerInsideAnnotation(false);
      startDraft(startPoint);
      dispatchEvent(POLYGON_EDITOR_EVENT.DRAW_START, {
        category: activeCategory,
      });
    },
    [
      activeCategory,
      allowCreate,
      allowOverlap,
      annotations,
      clearPendingAnnotationPress,
      clearSelection,
      dispatchEvent,
      getPointFromMouseEvent,
      readOnly,
      resetDraft,
      setPointerInsideAnnotation,
      startDraft,
    ],
  );

  const handleMouseMove = useCallback(
    (event) => {
      if (machineState.resizeSession) {
        updateResize(event);
        return;
      }

      const currentPoint = getPointFromMouseEvent(event);

      if (
        machineState.pendingAnnotationPress &&
        shouldStartDraftFromPendingAnnotationPress({
          allowOverlap,
          currentPoint,
          pendingAnnotationPress: machineState.pendingAnnotationPress,
        })
      ) {
        clearSelection();
        setPointerInsideAnnotation(false);
        startDraft(machineState.pendingAnnotationPress.startPoint);
        updateDraft(currentPoint);
        dispatchEvent(POLYGON_EDITOR_EVENT.DRAW_START, {
          category: activeCategory,
        });
        return;
      }

      if (!currentPoint) {
        return;
      }

      if (!machineState.draft) {
        setPointerInsideAnnotation(
          shouldBlockPointerForCreation({
            allowOverlap,
            annotations,
            point: currentPoint,
          }),
        );
        return;
      }

      setPointerInsideAnnotation(false);
      updateDraft(currentPoint);
    },
    [
      activeCategory,
      allowOverlap,
      annotations,
      clearSelection,
      dispatchEvent,
      getPointFromMouseEvent,
      machineState.draft,
      machineState.pendingAnnotationPress,
      machineState.resizeSession,
      setPointerInsideAnnotation,
      startDraft,
      updateDraft,
      updateResize,
    ],
  );

  const handleOverlayMouseUp = useCallback(
    (event) => {
      if (machineState.resizeSession) {
        clearPendingAnnotationPress();
        finishResize();
        return;
      }

      if (event.button !== 0) {
        clearPendingAnnotationPress();
        return;
      }

      if (machineState.pendingAnnotationPress) {
        setPointerInsideAnnotation(true);
        selectAnnotation(machineState.pendingAnnotationPress.annotation);
        return;
      }

      if (!machineState.draft) {
        return;
      }

      const commitRule = evaluateDraftCommit({
        allowOverlap,
        annotations,
        draftPoints: machineState.draft.points,
      });

      if (!commitRule.canCommit) {
        resetDraft();
        return;
      }

      createAnnotationFromDraft(machineState.draft.points);
    },
    [
      allowOverlap,
      annotations,
      clearPendingAnnotationPress,
      createAnnotationFromDraft,
      finishResize,
      machineState.draft,
      machineState.pendingAnnotationPress,
      machineState.resizeSession,
      resetDraft,
      selectAnnotation,
      setPointerInsideAnnotation,
    ],
  );

  const handleContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      clearPendingAnnotationPress();

      if (machineState.resizeSession) {
        cancelResize();
        return;
      }

      if (!machineState.draft) {
        return;
      }

      resetDraft();
      dispatchEvent(POLYGON_EDITOR_EVENT.DRAW_CANCEL, {});
    },
    [
      cancelResize,
      clearPendingAnnotationPress,
      dispatchEvent,
      machineState.draft,
      machineState.resizeSession,
      resetDraft,
    ],
  );

  const getContainerProperties = useCallback(
    () => ({
      ref: refs.containerRef,
    }),
    [refs.containerRef],
  );

  const getImageProperties = useCallback(
    () => ({
      alt: "polygon-editor",
      onError: handleImageError,
      onLoad: handleImageLoad,
      src: imageUrl || "",
    }),
    [handleImageError, handleImageLoad, imageUrl],
  );

  const getOverlayProperties = useCallback(
    () => ({
      height: displaySize.height,
      onContextMenu: handleContextMenu,
      onMouseDown: handleOverlayMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleOverlayMouseUp,
      ref: refs.overlayRef,
      width: displaySize.width,
    }),
    [
      displaySize.height,
      displaySize.width,
      handleContextMenu,
      handleMouseMove,
      handleOverlayMouseDown,
      handleOverlayMouseUp,
      refs.overlayRef,
    ],
  );

  const getAnnotationProperties = useCallback(
    (annotation) => ({
      onMouseDown: (event) => handleAnnotationMouseDown(annotation, event),
    }),
    [handleAnnotationMouseDown],
  );

  const getResizeHandleProperties = useCallback(
    (annotation, edge) => ({
      onMouseDown: (event) => startResize(annotation, edge, event),
    }),
    [startResize],
  );

  const getDeleteControlProperties = useCallback(
    (annotationId) => ({
      onClick: (event) => handleAnnotationDelete(annotationId, event),
    }),
    [handleAnnotationDelete],
  );

  useEffect(() => {
    if (
      machineState.selectedAnnotationId == undefined ||
      annotations.some((item) => item.id === machineState.selectedAnnotationId)
    ) {
      return;
    }

    clearSelection();
  }, [annotations, clearSelection, machineState.selectedAnnotationId]);

  return {
    actions: {
      cancelResize,
      clearSelection,
      createAnnotationFromDraft,
      deleteAnnotation,
      finishResize,
      resetDraft,
      selectAnnotation,
      setActiveCategory,
      startDraft,
      startResize,
      updateAnnotation,
      updateDraft,
    },
    getters: {
      getAnnotationProps: getAnnotationProperties,
      getContainerProps: getContainerProperties,
      getDeleteControlProps: getDeleteControlProperties,
      getImageProps: getImageProperties,
      getOverlayProps: getOverlayProperties,
      getResizeHandleProps: getResizeHandleProperties,
    },
    renderContext: {
      activeStrokeColor,
      annotations,
      categoryMap,
      displaySize,
      draftRectangle,
      imageStatus,
      imageUrl,
      previewAnnotationMap,
      selectedAnnotationId: machineState.selectedAnnotationId,
    },
    state: {
      activeCategory,
      activeStrokeColor,
      annotations,
      categories,
      categoryMap,
      displaySize,
      draftRectangle,
      imageStatus,
      imageUrl,
      interactionPhase,
      isPointerInsideAnnotation: machineState.isPointerInsideAnnotation,
      previewAnnotationMap,
      readOnly,
      selectedAnnotationId: machineState.selectedAnnotationId,
    },
  };
};
