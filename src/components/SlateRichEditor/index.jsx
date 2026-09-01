import React, { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import {
  createEditor,
  Editor,
  Element as SlateElement,
  Range,
  Transforms,
} from "slate";
import { withHistory } from "slate-history";
import { Slate, withReact } from "slate-react";

import { trans } from "../../utils/i18n";
import SlateRichEditable from "./Editable";
import { deserializeHtml } from "./htmlToSlate";
import { uploadImageFiles } from "./imageUpload";
import {
  getClipboardData,
  getClipboardImageFiles,
  getEventClipboardData,
  hasSlateFragment,
  prepareExternalHtml,
} from "./paste";
import {
  cloneSlateValue,
  createImageNode,
  escapeAttribute,
  focusEditor,
  getImageDimensions,
  scrollSelectionIntoView,
  suppressNextSelectionScroll,
} from "./shared";
import {
  collapseSelectionToTableCellStart,
  createParagraphNode,
  deleteTableAfterSelection,
  deleteTableBeforeSelection,
  isSelectionAcrossTableCells,
  isSelectionAtTableCellEnd,
  isSelectionAtTableCellStart,
} from "./tableCommands";
import { Toolbar } from "./Toolbar";

import styles from "./index.module.less";

const SLATE_FRAGMENT_MIME = "application/x-slate-fragment";

const getEditorValue = (value) =>
  Array.isArray(value) && value.length > 0
    ? value
    : [{ type: "paragraph", children: [{ text: "" }] }];

const encodeSlateFragment = (fragment) => {
  if (typeof window === "undefined" || typeof window.btoa !== "function") {
    return "";
  }

  return window.btoa(encodeURIComponent(JSON.stringify(fragment)));
};

const getSelectedImageVoidEntry = (editor) => {
  const selection = editor && editor.selection;
  if (!selection || !Range.isCollapsed(selection)) {
    return null;
  }

  const voidEntry = Editor.void(editor, { at: selection.anchor, voids: true });
  if (!voidEntry) {
    return null;
  }

  const [node] = voidEntry;
  return SlateElement.isElement(node) && node.type === "image"
    ? voidEntry
    : null;
};

const shouldPreserveImageDeleteScroll = (editor, key) =>
  ["backspace", "delete"].includes(key) && !!getSelectedImageVoidEntry(editor);

const serializeClipboardImageHtml = (imageNode, encodedFragment) => {
  const source = escapeAttribute(imageNode.src || "");
  if (!source) {
    return "";
  }

  const alt = escapeAttribute(imageNode.alt || "");
  const { width, height } = getImageDimensions(imageNode);
  const dimensionAttributes = [
    width ? `width="${width}"` : "",
    height ? `height="${height}"` : "",
  ].filter(Boolean);
  const styleParts = [
    width ? `width:${width}px` : "",
    height ? `height:${height}px` : "",
  ].filter(Boolean);
  const styleAttribute =
    styleParts.length > 0
      ? ` style="${escapeAttribute(styleParts.join(";"))}"`
      : "";
  const slateFragmentAttribute = encodedFragment
    ? ` data-slate-fragment="${escapeAttribute(encodedFragment)}"`
    : "";
  const extraAttributes =
    dimensionAttributes.length > 0 ? ` ${dimensionAttributes.join(" ")}` : "";

  return `<img src="${source}" alt="${alt}"${extraAttributes}${styleAttribute}${slateFragmentAttribute}/>`;
};

const isParagraphNode = (node) =>
  SlateElement.isElement(node) && node.type === "paragraph";

const ensureTableSurroundingParagraphs = (editor, node, path) => {
  if (
    path.length !== 1 ||
    !SlateElement.isElement(node) ||
    node.type !== "table"
  ) {
    return false;
  }

  const previousNode = editor.children[path[0] - 1];
  if (!isParagraphNode(previousNode)) {
    Transforms.insertNodes(editor, createParagraphNode(), { at: path });
    return true;
  }

  const nextNode = editor.children[path[0] + 1];
  if (isParagraphNode(nextNode)) {
    return false;
  }

  Transforms.insertNodes(editor, createParagraphNode(), { at: [path[0] + 1] });
  return true;
};

const withRichContent = (editor) => {
  const {
    deleteBackward,
    deleteForward,
    deleteFragment,
    insertData,
    insertText,
    isInline,
    isVoid,
    normalizeNode,
  } = editor;

  editor.isInline = (element) =>
    ["formula", "image"].includes(element.type) ? true : isInline(element);
  editor.isVoid = (element) =>
    ["formula", "image"].includes(element.type) ? true : isVoid(element);

  editor.insertText = (text) => {
    if (isSelectionAcrossTableCells(editor)) {
      if (collapseSelectionToTableCellStart(editor)) {
        insertText(text);
      }
      return;
    }

    insertText(text);
  };

  editor.insertData = (data) => {
    if (isSelectionAcrossTableCells(editor)) {
      if (collapseSelectionToTableCellStart(editor)) {
        insertData(data);
      }
      return;
    }

    insertData(data);
  };

  editor.deleteFragment = () => {
    if (isSelectionAcrossTableCells(editor)) {
      collapseSelectionToTableCellStart(editor);
      return;
    }

    deleteFragment();
  };

  editor.deleteBackward = (unit) => {
    if (isSelectionAcrossTableCells(editor)) {
      collapseSelectionToTableCellStart(editor);
      return;
    }

    if (deleteTableBeforeSelection(editor)) {
      return;
    }

    if (isSelectionAtTableCellStart(editor)) {
      return;
    }

    deleteBackward(unit);
  };

  editor.deleteForward = (unit) => {
    if (isSelectionAcrossTableCells(editor)) {
      collapseSelectionToTableCellStart(editor);
      return;
    }

    if (deleteTableAfterSelection(editor)) {
      return;
    }

    if (isSelectionAtTableCellEnd(editor)) {
      return;
    }

    deleteForward(unit);
  };

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;
    if (ensureTableSurroundingParagraphs(editor, node, path)) {
      return;
    }

    normalizeNode(entry);
  };

  return editor;
};

const isMarkActive = (editor, markName) => {
  const marks = Editor.marks(editor);
  return marks ? marks[markName] === true : false;
};

const toggleMark = (editor, markName) => {
  if (isMarkActive(editor, markName)) {
    Editor.removeMark(editor, markName);
  } else {
    Editor.addMark(editor, markName, true);
  }
};

/**
 *
 * @param properties
 */
function SlateRichEditor(properties) {
  const {
    autoFocus,
    onActive,
    onChange,
    placeholder,
    toolbar = true,
    toolbarProps,
    uploadImage,
    value: slateValue,
  } = properties;
  const [initialValue] = useState(() => getEditorValue(slateValue));
  const editor = useMemo(
    () => withRichContent(withHistory(withReact(createEditor()))),
    [],
  );

  const createEditorController = useCallback(
    () => ({
      editor,
      focus: () => focusEditor(editor, { ensureSelection: true }),
      uploadImage,
    }),
    [editor, uploadImage],
  );

  const notifyActive = useCallback(() => {
    if (typeof onActive === "function") {
      onActive(createEditorController());
    }
  }, [createEditorController, onActive]);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    let fallbackTimer = null;
    const focusActiveEditor = () => {
      notifyActive();
      focusEditor(editor, { ensureSelection: true });
    };

    const frame =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame(() => {
            focusActiveEditor();
            fallbackTimer = window.setTimeout(focusActiveEditor, 30);
          })
        : window.setTimeout(() => {
            focusActiveEditor();
            fallbackTimer = window.setTimeout(focusActiveEditor, 30);
          }, 0);

    return () => {
      if (typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(frame);
      } else {
        window.clearTimeout(frame);
      }
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
    };
  }, [autoFocus, editor, notifyActive]);

  const handleSlateChange = (nextValue) => {
    console.log("handleSlateChange", nextValue);

    notifyActive();
    if (
      typeof onChange === "function" &&
      editor.operations.some(({ type }) => type !== "set_selection")
    ) {
      onChange(cloneSlateValue(nextValue));
    }
  };

  const insertExternalHtml = (externalHtml) => {
    const nextNodes = deserializeHtml(externalHtml);
    if (
      isSelectionAcrossTableCells(editor) &&
      !collapseSelectionToTableCellStart(editor)
    ) {
      return;
    }
    focusEditor(editor, { ensureSelection: true });
    Transforms.insertNodes(editor, nextNodes);
  };

  const insertUploadedImages = (imageUrls, files) => {
    const imageNodes = imageUrls
      .map((imageUrl, index) =>
        imageUrl
          ? createImageNode(imageUrl, (files[index] && files[index].name) || "")
          : null,
      )
      .filter(Boolean);

    if (imageNodes.length === 0) {
      return false;
    }

    if (
      isSelectionAcrossTableCells(editor) &&
      !collapseSelectionToTableCellStart(editor)
    ) {
      return false;
    }
    focusEditor(editor, { ensureSelection: true });
    Transforms.insertNodes(editor, imageNodes);
    return true;
  };

  const setSelectedImageClipboardData = (event, options = {}) => {
    const clipboardData = event && event.clipboardData;
    const selectedImageEntry = getSelectedImageVoidEntry(editor);
    if (!clipboardData || !selectedImageEntry) {
      return false;
    }

    const [imageNode, imagePath] = selectedImageEntry;
    const clipboardImageNode = createImageNode(
      imageNode.src || "",
      imageNode.alt || "",
      imageNode,
    );
    const fragment = [clipboardImageNode];
    const encodedFragment = encodeSlateFragment(fragment);
    const imageHtml = serializeClipboardImageHtml(
      clipboardImageNode,
      encodedFragment,
    );

    event.preventDefault();
    event.stopPropagation();

    if (encodedFragment) {
      clipboardData.setData(SLATE_FRAGMENT_MIME, encodedFragment);
    }
    if (imageHtml) {
      clipboardData.setData("text/html", imageHtml);
    }
    clipboardData.setData(
      "text/plain",
      clipboardImageNode.alt || clipboardImageNode.src || "",
    );

    if (options.cut) {
      Transforms.removeNodes(editor, { at: imagePath });
      focusEditor(editor);
    }

    return true;
  };

  const handleCopy = (event) => {
    notifyActive();
    return setSelectedImageClipboardData(event);
  };

  const handleCut = (event) => {
    notifyActive();
    return setSelectedImageClipboardData(event, { cut: true });
  };

  const uploadAndInsertClipboardImages = (imageFiles) => {
    if (imageFiles.length === 0) {
      return Promise.resolve(false);
    }

    if (typeof uploadImage !== "function") {
      message.error(trans("global.uploadFailed", "图片上传失败"));
      return Promise.resolve(false);
    }

    return uploadImageFiles(imageFiles, uploadImage).then((imageUrls) => {
      const inserted = insertUploadedImages(imageUrls, imageFiles);
      if (!inserted) {
        message.error(trans("global.uploadFailed", "图片上传失败"));
      }
      return inserted;
    });
  };

  const handlePaste = (event) => {
    notifyActive();
    const clipboardData = getEventClipboardData(event);
    if (hasSlateFragment(clipboardData)) {
      return;
    }

    const imageFiles = getClipboardImageFiles(clipboardData);
    if (imageFiles.length > 0) {
      event.preventDefault();
      uploadAndInsertClipboardImages(imageFiles);
      return;
    }

    const externalHtml = getClipboardData(clipboardData, "text/html");
    if (!externalHtml) {
      return;
    }

    event.preventDefault();
    prepareExternalHtml(externalHtml, uploadImage)
      .then((processedHtml) => {
        if (!String(processedHtml || "").trim()) {
          return;
        }
        insertExternalHtml(processedHtml);
      })
      .catch(() => {
        message.error(trans("global.pasteFailed", "粘贴失败"));
      });
  };

  const handleKeyDown = (event) => {
    notifyActive();
    const key = String(event.key || "").toLowerCase();

    if (shouldPreserveImageDeleteScroll(editor, key)) {
      // 删除图片会触发 Slate 重新同步选区，跳过这一次错误的自动滚动。
      suppressNextSelectionScroll(editor);
    }
    const isCommand = event.metaKey || event.ctrlKey;

    if (!isCommand || event.altKey) {
      return;
    }

    if (key === "b") {
      event.preventDefault();
      toggleMark(editor, "bold");
    }
    if (key === "i") {
      event.preventDefault();
      toggleMark(editor, "italic");
    }
    if (key === "u") {
      event.preventDefault();
      toggleMark(editor, "underline");
    }
    if (key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        editor.redo && editor.redo();
      } else {
        editor.undo && editor.undo();
      }
    }
    if (key === "y") {
      event.preventDefault();
      editor.redo && editor.redo();
    }
  };

  return (
    <div className={[styles.editorShell, styles.editorShellActive].join(" ")}>
      <Slate
        editor={editor}
        initialValue={initialValue}
        onChange={handleSlateChange}
      >
        {toolbar ? (
          <Toolbar.Root {...toolbarProps}>
            <Toolbar.Undo />
            <Toolbar.Redo />
            <Toolbar.Bold />
            <Toolbar.Italic />
            <Toolbar.Underline />
            <Toolbar.Strike />
            <Toolbar.FontSize />
            <Toolbar.Color />
            <Toolbar.UnorderedList />
            <Toolbar.OrderedList />
            <Toolbar.AlignLeft />
            <Toolbar.AlignCenter />
            <Toolbar.AlignRight />
            <Toolbar.Table />
            <Toolbar.Image uploadImage={uploadImage} />
            <Toolbar.Formula />
          </Toolbar.Root>
        ) : null}
        <SlateRichEditable
          placeholder={placeholder}
          onCopy={handleCopy}
          onCut={handleCut}
          onFocus={notifyActive}
          onKeyDown={handleKeyDown}
          onMouseDown={notifyActive}
          onPaste={handlePaste}
          onSelect={notifyActive}
          scrollSelectionIntoView={scrollSelectionIntoView}
        />
      </Slate>
    </div>
  );
}

export {
  deserializeHtml,
  htmlToSlate,
  normalizeSlateValue,
} from "./htmlToSlate";
export { default as SlateRichPreview } from "./Preview";
export {
  isSlateValueEmpty,
  serializeSlateValue,
  slateToHtml,
} from "./slateToHtml";
export * from "./tableCommands";
export { Toolbar } from "./Toolbar";

export default SlateRichEditor;
