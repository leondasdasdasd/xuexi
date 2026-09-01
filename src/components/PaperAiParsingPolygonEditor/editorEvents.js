/**
 * Editor domain event names exposed through `onEvent`.
 * Keep all event strings centralized to avoid ad-hoc literals in consumers.
 */
export const POLYGON_EDITOR_EVENT = {
  DRAW_START: "drawStart",
  DRAW_CANCEL: "drawCancel",
  DRAW_END: "drawEnd",
  POLYGON_CREATE: "polygonCreate",
  POLYGON_DELETE: "polygonDelete",
  POLYGON_SELECT: "polygonSelect",
  POLYGON_UPDATE: "polygonUpdate",
};

/**
 * Change reasons exposed through `onChange`.
 */
export const POLYGON_EDITOR_CHANGE_REASON = {
  CREATE: "create",
  DELETE: "delete",
  UPDATE: "update",
};
