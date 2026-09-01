import React, { useRef } from "react";
import { Button, Icon, message, Select, Tooltip } from "antd";
import { Editor, Element as SlateElement, Transforms } from "slate";

import { trans } from "../../utils/i18n";
import { uploadImageFiles } from "./imageUpload";
import {
  deleteColumn,
  deleteRow,
  insertColumn,
  insertRow,
  insertTable,
} from "./tableCommands";
import { ToolbarRoot, useToolbarContext } from "./ToolbarRoot";

import styles from "./index.module.less";

export { requestFormulaEdit } from "./ToolbarRoot";

const { Option } = Select;

const LIST_TYPES = new Set(["numbered-list", "bulleted-list"]);
const DEFAULT_FONT_SIZE = 14;
const DEFAULT_FONT_SIZE_VALUE = String(DEFAULT_FONT_SIZE);
const DEFAULT_FONT_COLOR = "#24324a";
const FONT_SIZES = [12, 14, 16, 18, 24, 32];
const FONT_COLORS = [
  "#1f2d3d",
  "#0445fc",
  "#e55353",
  "#f59f00",
  "#2f9e44",
  "#7c4dff",
];

const isMarkActive = (editor, markName) => {
  const marks = Editor.marks(editor);
  return marks ? marks[markName] === true : false;
};

const getMarkValue = (editor, markName) => {
  const marks = Editor.marks(editor);
  return marks ? marks[markName] : undefined;
};

const getToolbarMarkValue = (toolbarMarks, editor, markName) =>
  Object.prototype.hasOwnProperty.call(toolbarMarks, markName) &&
  toolbarMarks[markName] !== undefined
    ? toolbarMarks[markName]
    : getMarkValue(editor, markName);

const toggleMark = (editor, markName) => {
  if (isMarkActive(editor, markName)) {
    Editor.removeMark(editor, markName);
  } else {
    Editor.addMark(editor, markName, true);
  }
};

const setValueMark = (editor, markName, value) => {
  if (!value) {
    Editor.removeMark(editor, markName);
    return;
  }
  Editor.addMark(editor, markName, value);
};

const isBlockActive = (editor, format, blockType = "type") => {
  if (!editor.selection) {
    return false;
  }

  const entry = Editor.nodes(editor, {
    at: editor.selection,
    match: (node) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      node[blockType] === format,
  }).next();

  return !entry.done;
};

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.has(format);

  Transforms.unwrapNodes(editor, {
    match: (node) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      LIST_TYPES.has(node.type),
    split: true,
  });

  Transforms.setNodes(editor, {
    type: isActive ? "paragraph" : isList ? "list-item" : format,
  });

  if (!isActive && isList) {
    Transforms.wrapNodes(editor, {
      children: [],
      type: format,
    });
  }
};

const setAlignment = (editor, align) => {
  Transforms.setNodes(editor, {
    align,
  });
};

const getClassName = (...classNames) => classNames.filter(Boolean).join(" ");

const preventMouseDown = (event) => {
  event.preventDefault();
};

/**
 *
 * @param properties
 */
function ToolbarButton(properties) {
  const { active, icon, iconRotate, label, onClick, text } = properties;

  const button = (
    <Button
      size="small"
      className={getClassName(
        styles.toolbarButton,
        active ? styles.toolbarButtonActive : "",
      )}
      aria-label={label}
      title={label}
      onMouseDown={preventMouseDown}
      onClick={onClick}
    >
      {icon ? <Icon type={icon} rotate={iconRotate} /> : text || label}
    </Button>
  );

  return (
    <Tooltip title={label}>
      <span className={styles.toolbarButtonWrap}>{button}</span>
    </Tooltip>
  );
}

/**
 *
 * @param config
 */
function createMarkButton(config) {
  return function MarkButton() {
    const { editor, runEditorCommand } = useToolbarContext();

    return (
      <ToolbarButton
        label={config.label}
        icon={config.icon}
        active={editor ? isMarkActive(editor, config.mark) : false}
        onClick={() =>
          runEditorCommand((currentEditor) =>
            toggleMark(currentEditor, config.mark),
          )
        }
      />
    );
  };
}

/**
 *
 */
function ToolbarUndo() {
  const { runEditorCommand } = useToolbarContext();

  return (
    <ToolbarButton
      label={trans("global.revoke", "撤销")}
      icon="rollback"
      onClick={() => runEditorCommand((editor) => editor.undo && editor.undo())}
    />
  );
}

/**
 *
 */
function ToolbarRedo() {
  const { runEditorCommand } = useToolbarContext();

  return (
    <ToolbarButton
      label={trans("global.restore", "重做")}
      icon="rollback"
      iconRotate={180}
      onClick={() => runEditorCommand((editor) => editor.redo && editor.redo())}
    />
  );
}

const ToolbarBold = createMarkButton({
  label: trans("jsonInput.bold", "加粗"),
  icon: "bold",
  mark: "bold",
});

const ToolbarItalic = createMarkButton({
  label: trans("jsonInput.italic", "斜体"),
  icon: "italic",
  mark: "italic",
});

const ToolbarUnderline = createMarkButton({
  label: trans("jsonInput.underline", "下划线"),
  icon: "underline",
  mark: "underline",
});

const ToolbarStrike = createMarkButton({
  label: trans("jsonInput.strike", "删除线"),
  icon: "strikethrough",
  mark: "strike",
});

/**
 *
 */
function ToolbarFontSize() {
  const { editor, runEditorCommand, setToolbarMark, toolbarMarks } =
    useToolbarContext();
  const currentFontSize = editor
    ? getToolbarMarkValue(toolbarMarks, editor, "fontSize")
    : undefined;
  const selectedFontSize = currentFontSize || DEFAULT_FONT_SIZE_VALUE;
  const setFontSize = (value) => {
    const markValue = value === DEFAULT_FONT_SIZE_VALUE ? "" : value;
    setToolbarMark("fontSize", markValue);
    runEditorCommand((currentEditor) =>
      setValueMark(currentEditor, "fontSize", markValue),
    );
  };

  return (
    <Select
      size="small"
      value={selectedFontSize}
      placeholder={<Icon type="font-size" />}
      className={styles.toolbarSelect}
      dropdownMatchSelectWidth={false}
      onMouseDown={preventMouseDown}
      onChange={setFontSize}
    >
      {FONT_SIZES.map((item) => (
        <Option key={item} value={String(item)}>
          {item}px
        </Option>
      ))}
    </Select>
  );
}

/**
 *
 * @param properties
 */
function FontColorLabel(properties) {
  const { color } = properties;

  return (
    <span className={styles.fontColorLabel}>
      <span className={styles.fontColorLabelText}>A</span>
      <span
        className={styles.fontColorLabelLine}
        style={{ background: color }}
      />
    </span>
  );
}

/**
 *
 * @param properties
 */
function ColorSwatch(properties) {
  const { color } = properties;

  return <span className={styles.colorSwatch} style={{ background: color }} />;
}

/**
 *
 */
function ToolbarColor() {
  const { editor, runEditorCommand, setToolbarMark, toolbarMarks } =
    useToolbarContext();
  const currentColor = editor
    ? getToolbarMarkValue(toolbarMarks, editor, "color")
    : undefined;
  const selectedColor = currentColor || DEFAULT_FONT_COLOR;
  const setFontColor = (value) => {
    const markValue = value === DEFAULT_FONT_COLOR ? "" : value;
    setToolbarMark("color", markValue);
    runEditorCommand((currentEditor) =>
      setValueMark(currentEditor, "color", markValue),
    );
  };

  return (
    <Select
      size="small"
      value={selectedColor}
      placeholder={<FontColorLabel color={DEFAULT_FONT_COLOR} />}
      className={styles.colorSelect}
      dropdownClassName={styles.colorDropdown}
      dropdownMatchSelectWidth={false}
      optionLabelProp="label"
      onMouseDown={preventMouseDown}
      onChange={setFontColor}
    >
      <Option
        value={DEFAULT_FONT_COLOR}
        label={<FontColorLabel color={DEFAULT_FONT_COLOR} />}
        className={styles.colorDefaultOption}
      >
        <span className={styles.colorOption}>
          <ColorSwatch color={DEFAULT_FONT_COLOR} />
          {trans("jsonInput.defaultColor", "默认")}
        </span>
      </Option>
      {FONT_COLORS.map((color) => (
        <Option
          key={color}
          value={color}
          label={<FontColorLabel color={color} />}
          className={styles.colorSwatchOption}
        >
          <ColorSwatch color={color} />
        </Option>
      ))}
    </Select>
  );
}

/**
 *
 * @param config
 */
function createBlockButton(config) {
  return function BlockButton() {
    const { editor, runEditorCommand } = useToolbarContext();

    return (
      <ToolbarButton
        label={config.label}
        icon={config.icon}
        active={
          editor
            ? isBlockActive(editor, config.format, config.blockType)
            : false
        }
        onClick={() =>
          runEditorCommand((currentEditor) => {
            if (config.command === "align") {
              setAlignment(currentEditor, config.format);
              return;
            }
            toggleBlock(currentEditor, config.format);
          })
        }
      />
    );
  };
}

const ToolbarUnorderedList = createBlockButton({
  label: trans("jsonInput.unorderedList", "无序列表"),
  icon: "unordered-list",
  format: "bulleted-list",
});

const ToolbarOrderedList = createBlockButton({
  label: trans("jsonInput.orderedList", "有序列表"),
  icon: "ordered-list",
  format: "numbered-list",
});

const ToolbarAlignLeft = createBlockButton({
  label: trans("jsonInput.alignLeft", "左对齐"),
  icon: "align-left",
  format: "left",
  blockType: "align",
  command: "align",
});

const ToolbarAlignCenter = createBlockButton({
  label: trans("jsonInput.alignCenter", "居中"),
  icon: "align-center",
  format: "center",
  blockType: "align",
  command: "align",
});

const ToolbarAlignRight = createBlockButton({
  label: trans("jsonInput.alignRight", "右对齐"),
  icon: "align-right",
  format: "right",
  blockType: "align",
  command: "align",
});

/**
 *
 * @param config
 */
function createTableCommandButton(config) {
  return function TableCommandButton() {
    const { runEditorCommand } = useToolbarContext();

    const runCommand = () => {
      const success = runEditorCommand(config.command);
      if (config.requiresCell && !success) {
        message.info(
          trans("slateRichEditor.selectTableCellFirst", "请先选中表格单元格"),
        );
      }
    };

    return (
      <ToolbarButton
        label={config.label}
        icon={config.icon}
        text={config.text}
        onClick={runCommand}
      />
    );
  };
}

const ToolbarTable = createTableCommandButton({
  label: trans("slateRichEditor.insertTable", "插入表格"),
  icon: "table",
  command: (editor) => insertTable(editor, { rows: 3, columns: 3 }),
});

const ToolbarInsertRowBefore = createTableCommandButton({
  label: trans("slateRichEditor.insertRowBefore", "上方插入行"),
  text: trans("slateRichEditor.insertRowBeforeShort", "上行"),
  requiresCell: true,
  command: (editor) => insertRow(editor, "before"),
});

const ToolbarInsertRowAfter = createTableCommandButton({
  label: trans("slateRichEditor.insertRowAfter", "下方插入行"),
  text: trans("slateRichEditor.insertRowAfterShort", "下行"),
  requiresCell: true,
  command: (editor) => insertRow(editor, "after"),
});

const ToolbarDeleteRow = createTableCommandButton({
  label: trans("slateRichEditor.deleteRow", "删除当前行"),
  text: trans("slateRichEditor.deleteRowShort", "删行"),
  requiresCell: true,
  command: deleteRow,
});

const ToolbarInsertColumnBefore = createTableCommandButton({
  label: trans("slateRichEditor.insertColumnBefore", "左侧插入列"),
  text: trans("slateRichEditor.insertColumnBeforeShort", "左列"),
  requiresCell: true,
  command: (editor) => insertColumn(editor, "before"),
});

const ToolbarInsertColumnAfter = createTableCommandButton({
  label: trans("slateRichEditor.insertColumnAfter", "右侧插入列"),
  text: trans("slateRichEditor.insertColumnAfterShort", "右列"),
  requiresCell: true,
  command: (editor) => insertColumn(editor, "after"),
});

const ToolbarDeleteColumn = createTableCommandButton({
  label: trans("slateRichEditor.deleteColumn", "删除当前列"),
  text: trans("slateRichEditor.deleteColumnShort", "删列"),
  requiresCell: true,
  command: deleteColumn,
});

/**
 *
 * @param properties
 */
function ToolbarImage(properties) {
  const { onOpenImageUpload, uploadImage } = properties;
  const fileInputReference = useRef(null);
  const { createCommandPayload, editor, ensureEditorSelection, insertImage } =
    useToolbarContext();

  const handleImageFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!editor || typeof uploadImage !== "function") {
      message.error(trans("global.uploadFailed", "图片上传失败"));
      return;
    }

    uploadImageFiles([file], uploadImage)
      .then((imageUrls) => {
        const imageUrl = imageUrls[0] || "";
        if (!imageUrl) {
          message.error(trans("global.uploadFailed", "图片上传失败"));
          return;
        }
        insertImage(imageUrl, file.name || "");
      })
      .catch((error) => {
        message.error(
          (error && error.message) ||
            trans("global.uploadFailed", "图片上传失败"),
        );
      });
  };

  const openImageUpload = () => {
    if (!editor) {
      return;
    }

    ensureEditorSelection();

    if (typeof onOpenImageUpload === "function") {
      const payload = createCommandPayload();
      if (payload) {
        onOpenImageUpload(payload);
      }
      return;
    }

    if (typeof uploadImage !== "function") {
      return;
    }

    if (fileInputReference.current) {
      fileInputReference.current.click();
    }
  };

  return (
    <>
      <input
        ref={fileInputReference}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={handleImageFileChange}
      />
      <ToolbarButton
        label={trans("jsonInput.insertImage", "插入图片")}
        icon="picture"
        onClick={openImageUpload}
      />
    </>
  );
}

/**
 *
 * @param properties
 */
function ToolbarFormula(properties) {
  const { onOpenFormula } = properties;
  const {
    createCommandPayload,
    editor,
    ensureEditorSelection,
    openFormulaEditor,
  } = useToolbarContext();

  const openFormula = () => {
    if (!editor) {
      return;
    }

    ensureEditorSelection();

    if (typeof onOpenFormula === "function") {
      const payload = createCommandPayload();
      if (payload) {
        onOpenFormula(payload);
      }
      return;
    }

    openFormulaEditor();
  };

  return (
    <ToolbarButton
      label={trans("batchInput.mathButton", "数学公式")}
      icon="calculator"
      onClick={openFormula}
    />
  );
}

export const Toolbar = {
  Root: ToolbarRoot,
  Undo: ToolbarUndo,
  Redo: ToolbarRedo,
  Bold: ToolbarBold,
  Italic: ToolbarItalic,
  Underline: ToolbarUnderline,
  Strike: ToolbarStrike,
  FontSize: ToolbarFontSize,
  Color: ToolbarColor,
  UnorderedList: ToolbarUnorderedList,
  OrderedList: ToolbarOrderedList,
  AlignLeft: ToolbarAlignLeft,
  AlignCenter: ToolbarAlignCenter,
  AlignRight: ToolbarAlignRight,
  Table: ToolbarTable,
  InsertRowBefore: ToolbarInsertRowBefore,
  InsertRowAfter: ToolbarInsertRowAfter,
  DeleteRow: ToolbarDeleteRow,
  InsertColumnBefore: ToolbarInsertColumnBefore,
  InsertColumnAfter: ToolbarInsertColumnAfter,
  DeleteColumn: ToolbarDeleteColumn,
  Image: ToolbarImage,
  Formula: ToolbarFormula,
};
