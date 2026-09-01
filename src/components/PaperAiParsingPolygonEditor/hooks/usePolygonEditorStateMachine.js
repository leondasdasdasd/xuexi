import { useMemo, useReducer } from "react";

import {
  buildRectanglePolygonPoints,
  DRAFT_START_DRAG_THRESHOLD_RATIO,
  getPointDistance,
} from "../annotationGeometry";

export const INTERACTION_PHASE = {
  IDLE: "idle",
  DRAWING: "drawing",
  PRESSED_ANNOTATION: "pressed_annotation",
  RESIZING: "resizing",
};

export const EDITOR_MACHINE_ACTION = {
  CANCEL_RESIZE: "cancel_resize",
  CLEAR_PENDING_ANNOTATION_PRESS: "clear_pending_annotation_press",
  CLEAR_SELECTION: "clear_selection",
  RESET_DRAFT: "reset_draft",
  RESET_INTERACTION: "reset_interaction",
  SELECT_ANNOTATION: "select_annotation",
  SET_PENDING_ANNOTATION_PRESS: "set_pending_annotation_press",
  SET_POINTER_INSIDE_ANNOTATION: "set_pointer_inside_annotation",
  START_DRAFT: "start_draft",
  START_RESIZE: "start_resize",
  UPDATE_DRAFT: "update_draft",
  UPDATE_RESIZE_PREVIEW: "update_resize_preview",
};

const createInitialMachineState = () => ({
  draft: null,
  isPointerInsideAnnotation: false,
  pendingAnnotationPress: null,
  resizeSession: null,
  selectedAnnotationId: null,
});

const updateDraftPoints = (draft, currentPoint) => {
  if (!draft || !currentPoint) {
    return draft;
  }

  return {
    ...draft,
    points: buildRectanglePolygonPoints(draft.startPoint, currentPoint),
  };
};

const editorStateMachineReducer = (state, action) => {
  if (action.type === EDITOR_MACHINE_ACTION.RESET_INTERACTION) {
    return createInitialMachineState();
  }

  if (action.type === EDITOR_MACHINE_ACTION.SET_POINTER_INSIDE_ANNOTATION) {
    return {
      ...state,
      isPointerInsideAnnotation: action.value,
    };
  }

  if (action.type === EDITOR_MACHINE_ACTION.CLEAR_SELECTION) {
    return {
      ...state,
      selectedAnnotationId: null,
    };
  }

  if (action.type === EDITOR_MACHINE_ACTION.SELECT_ANNOTATION) {
    return {
      ...state,
      draft: null,
      pendingAnnotationPress: null,
      selectedAnnotationId: action.annotationId,
    };
  }

  if (action.type === EDITOR_MACHINE_ACTION.START_DRAFT) {
    return {
      ...state,
      draft: {
        points: buildRectanglePolygonPoints(
          action.startPoint,
          action.startPoint,
        ),
        startPoint: action.startPoint,
      },
      isPointerInsideAnnotation: false,
      pendingAnnotationPress: null,
      resizeSession: null,
      selectedAnnotationId: null,
    };
  }

  if (action.type === EDITOR_MACHINE_ACTION.UPDATE_DRAFT) {
    return {
      ...state,
      draft: updateDraftPoints(state.draft, action.currentPoint),
      isPointerInsideAnnotation: false,
    };
  }

  if (action.type === EDITOR_MACHINE_ACTION.RESET_DRAFT) {
    return {
      ...state,
      draft: null,
    };
  }

  if (action.type === EDITOR_MACHINE_ACTION.SET_PENDING_ANNOTATION_PRESS) {
    return {
      ...state,
      draft: null,
      pendingAnnotationPress: {
        annotation: action.annotation,
        startPoint: action.startPoint,
      },
      resizeSession: null,
    };
  }

  if (action.type === EDITOR_MACHINE_ACTION.CLEAR_PENDING_ANNOTATION_PRESS) {
    return {
      ...state,
      pendingAnnotationPress: null,
    };
  }

  if (action.type === EDITOR_MACHINE_ACTION.START_RESIZE) {
    return {
      ...state,
      draft: null,
      pendingAnnotationPress: null,
      resizeSession: action.resizeSession,
      selectedAnnotationId: action.resizeSession.annotationId,
    };
  }

  if (action.type === EDITOR_MACHINE_ACTION.UPDATE_RESIZE_PREVIEW) {
    if (!state.resizeSession || !action.previewPoints) {
      return state;
    }

    return {
      ...state,
      resizeSession: {
        ...state.resizeSession,
        previewPoints: action.previewPoints,
      },
    };
  }

  if (action.type === EDITOR_MACHINE_ACTION.CANCEL_RESIZE) {
    return {
      ...state,
      resizeSession: null,
    };
  }

  return state;
};

const resolveInteractionPhase = (state) => {
  if (state.resizeSession) {
    return INTERACTION_PHASE.RESIZING;
  }

  if (state.draft) {
    return INTERACTION_PHASE.DRAWING;
  }

  if (state.pendingAnnotationPress) {
    return INTERACTION_PHASE.PRESSED_ANNOTATION;
  }

  return INTERACTION_PHASE.IDLE;
};

export const shouldStartDraftFromPendingAnnotationPress = ({
  allowOverlap,
  currentPoint,
  pendingAnnotationPress,
}) =>
  Boolean(
    allowOverlap &&
    pendingAnnotationPress &&
    currentPoint &&
    getPointDistance(currentPoint, pendingAnnotationPress.startPoint) >=
      DRAFT_START_DRAG_THRESHOLD_RATIO,
  );

export const usePolygonEditorStateMachine = () => {
  const [state, dispatch] = useReducer(
    editorStateMachineReducer,
    undefined,
    createInitialMachineState,
  );

  const derivedState = useMemo(() => {
    const interactionPhase = resolveInteractionPhase(state);
    const draftRectangle = state.draft ? state.draft.points : null;
    const previewAnnotationMap = state.resizeSession
      ? {
          [state.resizeSession.annotationId]: state.resizeSession.previewPoints,
        }
      : {};

    return {
      draftRectangle,
      interactionPhase,
      previewAnnotationMap,
    };
  }, [state]);

  return {
    dispatch,
    state,
    ...derivedState,
  };
};
