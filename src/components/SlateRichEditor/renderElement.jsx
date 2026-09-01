import React, { useEffect, useRef, useState } from "react";
import { Dropdown, Menu } from "antd";
import { Editor, Transforms } from "slate";
import {
  ReactEditor,
  useFocused,
  useSelected,
  useSlateStatic,
} from "slate-react";

import { trans } from "../../utils/i18n";
import {
  focusEditor,
  getImageDimensions,
  normalizeImageDimension,
  suppressNextSelectionScroll,
} from "./shared";
import {
  deleteColumn,
  deleteRow,
  insertColumn,
  insertRow,
} from "./tableCommands";
import { requestFormulaEdit } from "./ToolbarRoot";

import styles from "./index.module.less";

const MIN_IMAGE_WIDTH = 48;
const FORMULA_IMAGE_STYLE = {
  display: "inline-block",
  height: "1em",
  width: "auto",
  maxWidth: "100%",
  objectFit: "contain",
  verticalAlign: "-0.12em",
};

const getImageMaxWidth = (imageElement) => {
  let current = imageElement;
  while (current) {
    if (current.classList && current.classList.contains(styles.editable)) {
      const width = Math.floor(current.getBoundingClientRect().width);
      return width > 0 ? width : MIN_IMAGE_WIDTH;
    }
    current = current.parentElement;
  }

  const parentWidth =
    imageElement.parentElement &&
    Math.floor(imageElement.parentElement.getBoundingClientRect().width);
  return parentWidth > 0 ? parentWidth : MIN_IMAGE_WIDTH;
};

const clampImageWidth = (width, maxWidth) =>
  Math.max(
    MIN_IMAGE_WIDTH,
    Math.min(Math.round(width), Math.max(maxWidth, MIN_IMAGE_WIDTH)),
  );

/**
 *
 * @param properties
 */
export function ImageElement(properties) {
  const { attributes, children, element } = properties;
  const selected = useSelected();
  const focused = useFocused();
  const editor = useSlateStatic();
  const imageReference = useRef(null);
  const resizeCleanupReference = useRef(null);
  const [previewSize, setPreviewSize] = useState(null);
  const dimensions = previewSize || getImageDimensions(element);
  const imageWidth = normalizeImageDimension(dimensions.width);
  const imageHeight = normalizeImageDimension(dimensions.height);
  const imageWrapStyle = {};
  const imageStyle = {};
  const canResize = !!element.src;

  if (imageWidth) {
    imageWrapStyle.width = imageWidth;
    imageStyle.width = "100%";
  }
  if (imageWidth && imageHeight) {
    imageWrapStyle.aspectRatio = `${imageWidth} / ${imageHeight}`;
    imageStyle.height = "100%";
  } else if (imageHeight) {
    imageStyle.height = imageHeight;
  }

  useEffect(
    () => () => {
      if (resizeCleanupReference.current) {
        resizeCleanupReference.current();
      }
    },
    [],
  );

  const selectImage = (event) => {
    event.preventDefault();
    // Slate 会把 void 图片的隐藏文本选区滚入视野；图片仍在可视区时应保持用户当前位置。
    suppressNextSelectionScroll(editor);
    try {
      const path = ReactEditor.findPath(editor, element);
      Transforms.select(editor, path);
    } catch {
      focusEditor(editor);
    }
  };

  const startResize = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!imageReference.current) {
      return;
    }

    let path;
    try {
      path = ReactEditor.findPath(editor, element);
      Transforms.select(editor, path);
    } catch {
      focusEditor(editor);
      return;
    }

    if (resizeCleanupReference.current) {
      resizeCleanupReference.current();
    }

    const imageRect = imageReference.current.getBoundingClientRect();
    const startWidth =
      normalizeImageDimension(imageRect.width) || imageWidth || MIN_IMAGE_WIDTH;
    const startHeight =
      normalizeImageDimension(imageRect.height) ||
      imageHeight ||
      normalizeImageDimension(imageReference.current.naturalHeight) ||
      startWidth;
    const ratio = startWidth ? startHeight / startWidth : 1;
    const maxWidth = getImageMaxWidth(imageReference.current);
    let latestSize = {
      height: Math.max(1, Math.round(startHeight)),
      width: clampImageWidth(startWidth, maxWidth),
    };
    const startX = event.clientX;
    const startY = event.clientY;
    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";

    const cleanup = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      resizeCleanupReference.current = null;
    };

    const handleMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const nextWidthFromX = startWidth + deltaX;
      const nextWidthFromY = startWidth + (ratio ? deltaY / ratio : deltaY);
      const nextWidth = clampImageWidth(
        Math.abs(deltaY) > Math.abs(deltaX) ? nextWidthFromY : nextWidthFromX,
        maxWidth,
      );
      latestSize = {
        height: Math.max(1, Math.round(nextWidth * ratio)),
        width: nextWidth,
      };
      setPreviewSize(latestSize);
    };

    const handleMouseUp = () => {
      cleanup();
      setPreviewSize(null);
      if (
        latestSize.width !== startWidth ||
        latestSize.height !== startHeight
      ) {
        Transforms.setNodes(editor, latestSize, { at: path });
      }
      focusEditor(editor);
    };

    resizeCleanupReference.current = cleanup;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <span {...attributes} className={styles.imageInline}>
      {children}
      <span
        contentEditable={false}
        style={imageWrapStyle}
        className={[
          styles.imageWrap,
          selected && focused ? styles.imageWrapSelected : "",
        ].join(" ")}
        onClick={selectImage}
      >
        {element.src ? (
          <>
            <img
              ref={imageReference}
              src={element.src}
              alt={element.alt || ""}
              style={imageStyle}
            />
            {canResize && selected && focused ? (
              <span
                className={styles.imageResizeHandle}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onMouseDown={startResize}
              />
            ) : null}
          </>
        ) : null}
      </span>
    </span>
  );
}

/**
 *
 * @param properties
 */
export function FormulaElement(properties) {
  const { attributes, children, element } = properties;
  const selected = useSelected();
  const focused = useFocused();
  const editor = useSlateStatic();
  const formulaLabel =
    element.latex || trans("slateRichEditor.formula", "公式");

  const editFormula = (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const path = ReactEditor.findPath(editor, element);
      Transforms.select(editor, path);
      requestFormulaEdit(editor, element.latex || "", path);
    } catch {
      requestFormulaEdit(editor, element.latex || "", null);
    }
  };

  return (
    <span {...attributes} className={styles.formulaInline}>
      {children}
      <span
        contentEditable={false}
        className={[
          styles.formulaToken,
          selected && focused ? styles.formulaTokenSelected : "",
        ].join(" ")}
        onDoubleClick={editFormula}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          try {
            const path = ReactEditor.findPath(editor, element);
            Transforms.select(editor, path);
            requestFormulaEdit(editor, element.latex || "", path);
          } catch {
            requestFormulaEdit(editor, element.latex || "", null);
          }
        }}
        title={formulaLabel}
      >
        {element.src ? (
          <img
            src={element.src}
            alt={formulaLabel}
            // style={FORMULA_IMAGE_STYLE}
          />
        ) : (
          <span
          // style={{
          //   lineHeight: 1.5,
          //   maxWidth: "100%",
          //   overflowWrap: "anywhere",
          // }}
          >
            {formulaLabel}
          </span>
        )}
      </span>
    </span>
  );
}

/**
 *
 * @param properties
 */
export function TableElement(properties) {
  const { attributes, children } = properties;

  return (
    <table {...attributes} className={styles.tableElement}>
      <tbody>{children}</tbody>
    </table>
  );
}

/**
 *
 * @param properties
 */
export function TableRowElement(properties) {
  const { attributes, children } = properties;

  return <tr {...attributes}>{children}</tr>;
}

/**
 *
 * @param properties
 */
export function TableCellElement(properties) {
  const { attributes, children, element } = properties;
  const selected = useSelected();
  const focused = useFocused();
  const editor = useSlateStatic();

  const selectCell = () => {
    try {
      const path = ReactEditor.findPath(editor, element);
      Transforms.select(editor, Editor.start(editor, path));
    } catch {
      focusEditor(editor, { ensureSelection: true });
    }
  };

  const runTableCommand = (command) => {
    selectCell();
    command(editor);
    focusEditor(editor);
  };

  const menu = (
    <Menu>
      <Menu.Item
        key="insert-row-before"
        onClick={() => runTableCommand((e) => insertRow(e, "before"))}
      >
        {trans("slateRichEditor.insertRowBefore", "上方插入行")}
      </Menu.Item>
      <Menu.Item
        key="insert-row-after"
        onClick={() => runTableCommand((e) => insertRow(e, "after"))}
      >
        {trans("slateRichEditor.insertRowAfter", "下方插入行")}
      </Menu.Item>
      <Menu.Item key="delete-row" onClick={() => runTableCommand(deleteRow)}>
        {trans("slateRichEditor.deleteRow", "删除当前行")}
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="insert-column-before"
        onClick={() => runTableCommand((e) => insertColumn(e, "before"))}
      >
        {trans("slateRichEditor.insertColumnBefore", "左侧插入列")}
      </Menu.Item>
      <Menu.Item
        key="insert-column-after"
        onClick={() => runTableCommand((e) => insertColumn(e, "after"))}
      >
        {trans("slateRichEditor.insertColumnAfter", "右侧插入列")}
      </Menu.Item>
      <Menu.Item
        key="delete-column"
        onClick={() => runTableCommand(deleteColumn)}
      >
        {trans("slateRichEditor.deleteColumn", "删除当前列")}
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["contextMenu"]}>
      <td
        {...attributes}
        className={[
          styles.tableCell,
          selected && focused ? styles.tableCellSelected : "",
        ].join(" ")}
        onContextMenu={selectCell}
      >
        {children}
      </td>
    </Dropdown>
  );
}

/**
 *
 * @param properties
 */
export function DefaultElement(properties) {
  const { attributes, children, element } = properties;
  const style = element.align ? { textAlign: element.align } : undefined;

  if (element.type === "bulleted-list") {
    return <ul {...attributes}>{children}</ul>;
  }

  if (element.type === "numbered-list") {
    return <ol {...attributes}>{children}</ol>;
  }

  if (element.type === "list-item") {
    return <li {...attributes}>{children}</li>;
  }

  return (
    <p {...attributes} style={style}>
      {children}
    </p>
  );
}

/**
 *
 * @param properties
 */
export function Leaf(properties) {
  const { attributes, children, leaf } = properties;
  let nextChildren = children;
  const style = {};

  if (leaf.color) {
    style.color = leaf.color;
  }
  if (leaf.fontSize) {
    style.fontSize = `${leaf.fontSize}px`;
  }
  if (leaf.bold) {
    nextChildren = <strong>{nextChildren}</strong>;
  }
  if (leaf.italic) {
    nextChildren = <em>{nextChildren}</em>;
  }
  if (leaf.underline) {
    nextChildren = <u>{nextChildren}</u>;
  }
  if (leaf.strike) {
    nextChildren = <s>{nextChildren}</s>;
  }

  return (
    <span {...attributes} style={style}>
      {nextChildren}
    </span>
  );
}

export const renderElement = (elementProperties) => {
  const element = elementProperties.element;

  if (element.type === "image") {
    return <ImageElement {...elementProperties} />;
  }
  if (element.type === "formula") {
    return <FormulaElement {...elementProperties} />;
  }
  if (element.type === "table") {
    return <TableElement {...elementProperties} />;
  }
  if (element.type === "table-row") {
    return <TableRowElement {...elementProperties} />;
  }
  if (element.type === "table-cell") {
    return <TableCellElement {...elementProperties} />;
  }
  return <DefaultElement {...elementProperties} />;
};

export const renderLeaf = (leafProperties) => <Leaf {...leafProperties} />;
