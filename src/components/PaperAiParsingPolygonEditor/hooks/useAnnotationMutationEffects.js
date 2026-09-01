import { useCallback } from "react";

import {
  POLYGON_EDITOR_CHANGE_REASON,
  POLYGON_EDITOR_EVENT,
} from "../editorEvents";
import {
  buildChangePayload,
  buildEditorSnapshot,
  buildPolygonPayload,
} from "../editorPayloads";

export const ANNOTATION_MUTATION_KIND = {
  CREATE: "create",
  DELETE: "delete",
  SELECT: "select",
  UPDATE: "update",
};

/**
 * @typedef {{
 *   kind: string,
 *   annotation: import("../annotationGeometry").EditorPolygon | null,
 *   nextAnnotations: import("../annotationGeometry").EditorPolygon[]
 * }} AnnotationMutationResult
 */

/**
 * @param {{
 *   dispatchChange: Function,
 *   dispatchEvent: Function,
 *   naturalSizeRef: { current: import("../annotationGeometry").EditorSize }
 * }} params
 */
export const useAnnotationMutationEffects = ({
  dispatchChange,
  dispatchEvent,
  naturalSizeRef,
}) => {
  const emitSnapshotEvent = useCallback(
    (type, nextAnnotations, annotation) => {
      dispatchEvent(type, {
        polygon: annotation
          ? buildPolygonPayload(annotation, naturalSizeRef.current)
          : null,
        ...buildEditorSnapshot(nextAnnotations, naturalSizeRef.current),
      });
    },
    [dispatchEvent, naturalSizeRef],
  );

  const publishMutation = useCallback(
    (mutation) => {
      if (!mutation || !mutation.annotation) {
        return;
      }

      if (mutation.kind === ANNOTATION_MUTATION_KIND.SELECT) {
        dispatchEvent(POLYGON_EDITOR_EVENT.POLYGON_SELECT, {
          polygon: buildPolygonPayload(
            mutation.annotation,
            naturalSizeRef.current,
          ),
        });
        return;
      }

      if (mutation.kind === ANNOTATION_MUTATION_KIND.CREATE) {
        emitSnapshotEvent(
          POLYGON_EDITOR_EVENT.DRAW_END,
          mutation.nextAnnotations,
          mutation.annotation,
        );
        emitSnapshotEvent(
          POLYGON_EDITOR_EVENT.POLYGON_CREATE,
          mutation.nextAnnotations,
          mutation.annotation,
        );
        dispatchChange(
          buildChangePayload(
            mutation.nextAnnotations,
            POLYGON_EDITOR_CHANGE_REASON.CREATE,
            mutation.annotation,
            naturalSizeRef.current,
          ),
        );
      }

      if (mutation.kind === ANNOTATION_MUTATION_KIND.DELETE) {
        emitSnapshotEvent(
          POLYGON_EDITOR_EVENT.POLYGON_DELETE,
          mutation.nextAnnotations,
          mutation.annotation,
        );
        dispatchChange(
          buildChangePayload(
            mutation.nextAnnotations,
            POLYGON_EDITOR_CHANGE_REASON.DELETE,
            mutation.annotation,
            naturalSizeRef.current,
          ),
        );
      }

      if (mutation.kind === ANNOTATION_MUTATION_KIND.UPDATE) {
        emitSnapshotEvent(
          POLYGON_EDITOR_EVENT.POLYGON_UPDATE,
          mutation.nextAnnotations,
          mutation.annotation,
        );
        dispatchChange(
          buildChangePayload(
            mutation.nextAnnotations,
            POLYGON_EDITOR_CHANGE_REASON.UPDATE,
            mutation.annotation,
            naturalSizeRef.current,
          ),
        );
      }
    },
    [dispatchChange, dispatchEvent, emitSnapshotEvent, naturalSizeRef],
  );

  return {
    publishMutation,
  };
};
