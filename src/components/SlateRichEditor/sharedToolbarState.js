import { Editor } from "slate";

// 共享工具栏只关心 Slate 的 UI 态；业务内容仍由各编辑边界的 onChange 单独回写。
export const getSharedToolbarStateKey = (editor) =>
  JSON.stringify({
    marks: editor ? Editor.marks(editor) || undefined : undefined,
    selection: editor && editor.selection ? editor.selection : undefined,
  });

export const buildSharedToolbarController = (editorController) =>
  editorController
    ? {
        ...editorController,
        toolbarStateKey: getSharedToolbarStateKey(editorController.editor),
      }
    : undefined;

export const isSameSharedToolbarState = (currentController, nextController) =>
  Boolean(
    currentController &&
    nextController &&
    currentController.editor === nextController.editor &&
    currentController.toolbarStateKey === nextController.toolbarStateKey,
  );
