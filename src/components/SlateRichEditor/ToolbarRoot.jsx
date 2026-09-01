import React, { useCallback, useEffect, useRef, useState } from "react";
import { Input, message, Modal } from "antd";
import { Editor, Transforms } from "slate";
import { useSlateSelection, useSlateStatic } from "slate-react";

import { trans } from "../../utils/i18n";
import {
  bindMathFieldVirtualKeyboard,
  getMathFieldElementProperties,
} from "./mathFieldVirtualKeyboard";
import {
  cloneSlateValue,
  createFormulaNode,
  createImageNode,
  extractLatexFromMathUrl,
  focusEditor,
  FORMULA_RENDER_BASE_URL,
  getSelectedImageEntry,
  isMathliveReady,
  loadMathlive,
} from "./shared";

import "mathlive/static.css";
import styles from "./index.module.less";

const { TextArea } = Input;

const formulaEditListeners = [];

export const requestFormulaEdit = (editor, latex = "", editPath = null) => {
  for (const listener of formulaEditListeners)
    listener(editor, latex, editPath);
};

const ToolbarContext = React.createContext({
  createCommandPayload: () => null,
  editor: null,
  ensureEditorSelection: () => {},
  insertImage: () => {},
  openFormulaEditor: () => {},
  runEditorCommand: () => {},
  setToolbarMark: () => {},
  toolbarMarks: {},
  toolbarRenderVersion: 0,
});

const getClassName = (...classNames) => classNames.filter(Boolean).join(" ");
const getSelectionKey = (selection) => JSON.stringify(selection || null);
const getEditorMarksSnapshot = (editor) => {
  const marks = editor ? Editor.marks(editor) : null;
  return {
    color: marks ? marks.color : undefined,
    fontSize: marks ? marks.fontSize : undefined,
  };
};

export const useToolbarContext = () => React.useContext(ToolbarContext);

/**
 *
 * @param properties
 */
function MathFieldInput(properties) {
  const { autoFocus, disabled, onChange, value } = properties;
  const fieldReference = useRef(null);
  const [ready, setReady] = useState(isMathliveReady());

  useEffect(() => {
    let mounted = true;
    loadMathlive()
      .then(() => {
        if (mounted) {
          setReady(true);
        }
      })
      .catch(() => {
        message.error(
          trans("slateRichEditor.mathliveLoadFailed", "公式编辑器加载失败"),
        );
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const field = fieldReference.current;
    if (!ready || !field) {
      return;
    }

    return bindMathFieldVirtualKeyboard(field);
  }, [ready]);

  useEffect(() => {
    const field = fieldReference.current;
    if (!ready || !field) {
      return;
    }

    const handleInput = () => {
      const nextValue =
        typeof field.getValue === "function"
          ? field.getValue("latex")
          : field.value || "";
      onChange(nextValue);
    };

    field.addEventListener("input", handleInput);
    return () => {
      field.removeEventListener("input", handleInput);
    };
  }, [onChange, ready]);

  useEffect(() => {
    const field = fieldReference.current;
    if (!ready || !field) {
      return;
    }

    const currentValue =
      typeof field.getValue === "function"
        ? field.getValue("latex")
        : field.value || "";
    if (currentValue === value) {
      return;
    }

    if (typeof field.setValue === "function") {
      field.setValue(value || "", { silenceNotifications: true });
    } else {
      field.value = value || "";
    }
  }, [ready, value]);

  useEffect(() => {
    const field = fieldReference.current;
    if (!ready || !autoFocus || !field) {
      return;
    }

    window.setTimeout(() => {
      if (typeof field.focus === "function") {
        field.focus();
      }
    }, 0);
  }, [autoFocus, ready]);

  if (!ready) {
    return (
      <div className={styles.mathFieldLoading}>
        {trans("slateRichEditor.mathliveLoading", "公式编辑器加载中...")}
      </div>
    );
  }

  return React.createElement("math-field", {
    ref: fieldReference,
    ...getMathFieldElementProperties(styles.mathField, disabled),
  });
}

/**
 *
 * @param properties
 */
function FormulaModal(properties) {
  const { editing, latex, onCancel, onChange, onConfirm, visible } = properties;
  // 预览与最终插入保持一致：均使用服务端 SVG 渲染服务，避免本地 KaTeX 与服务端渲染结果不一致。
  const trimmedLatex = String(latex || "").trim();
  const previewSource = trimmedLatex
    ? `${FORMULA_RENDER_BASE_URL}?display=inline&mathUrl=${encodeURIComponent(trimmedLatex)}`
    : "";

  return (
    <Modal
      title={
        editing
          ? trans("slateRichEditor.editFormula", "编辑公式")
          : trans("slateRichEditor.insertFormula", "插入公式")
      }
      visible={visible}
      onCancel={onCancel}
      onOk={onConfirm}
      okText={trans("global.confirm", "确定")}
      cancelText={trans("global.cancel", "取消")}
      destroyOnClose
    >
      <div className={styles.formulaPanel}>
        <MathFieldInput autoFocus={visible} value={latex} onChange={onChange} />
        <TextArea
          className={styles.formulaLatexInput}
          value={latex}
          onChange={(event) => onChange(event.target.value)}
          autoSize={{ minRows: 2, maxRows: 4 }}
          placeholder={trans(
            "slateRichEditor.formulaLatexPlaceholder",
            "这里会同步显示 LaTeX，可直接编辑",
          )}
        />
        <div className={styles.formulaPreviewTitle}>
          {trans("slateRichEditor.formulaPreview", "预览")}
        </div>
        <div className={styles.formulaPreview}>
          {previewSource ? (
            <img
              className={styles.formulaPreviewImage}
              src={previewSource}
              alt={trimmedLatex}
            />
          ) : (
            trans("slateRichEditor.formulaPreviewEmpty", "输入公式后显示预览")
          )}
        </div>
      </div>
    </Modal>
  );
}

/**
 *
 * @param properties
 */
function ToolbarRootContent(properties) {
  const {
    children,
    className,
    editor,
    role = "toolbar",
    selection: slateSelection,
    ...restProperties
  } = properties;
  const pendingFormulaSelectionReference = useRef(null);
  const [formulaVisible, setFormulaVisible] = useState(false);
  const [formulaLatex, setFormulaLatex] = useState("");
  const [formulaEditPath, setFormulaEditPath] = useState(null);
  const [toolbarMarks, setToolbarMarks] = useState(() =>
    getEditorMarksSnapshot(editor),
  );
  const [toolbarRenderVersion, setToolbarRenderVersion] = useState(0);
  const selectionKey = getSelectionKey(
    slateSelection === undefined ? editor && editor.selection : slateSelection,
  );

  const ensureEditorSelection = useCallback(() => {
    if (!editor) {
      return;
    }
    focusEditor(editor, { ensureSelection: true });
  }, [editor]);

  useEffect(() => {
    setToolbarMarks(getEditorMarksSnapshot(editor));
  }, [editor, selectionKey]);

  const setToolbarMark = useCallback((markName, value) => {
    setToolbarMarks((marks) => ({
      ...marks,
      [markName]: value || undefined,
    }));
  }, []);

  const insertImage = useCallback(
    (source, alt = "") => {
      if (!editor || !source) {
        return;
      }

      ensureEditorSelection();
      const latex = extractLatexFromMathUrl(source);
      if (latex) {
        Transforms.insertNodes(
          editor,
          createFormulaNode(latex, { src: source }),
        );
        return;
      }

      Transforms.insertNodes(editor, createImageNode(source, alt));
    },
    [editor, ensureEditorSelection],
  );

  const openFormulaEditor = useCallback(
    (latex = "", editPath = null) => {
      if (!editor) {
        return;
      }

      ensureEditorSelection();
      pendingFormulaSelectionReference.current = editor.selection
        ? cloneSlateValue([editor.selection])[0]
        : null;
      setFormulaLatex(latex || "");
      setFormulaEditPath(editPath);
      setFormulaVisible(true);
    },
    [editor, ensureEditorSelection],
  );

  const createCommandPayload = useCallback(() => {
    if (!editor) {
      return null;
    }

    return {
      editor,
      insertImage,
      openFormulaEditor,
      selectedImageEntry: getSelectedImageEntry(editor),
    };
  }, [editor, insertImage, openFormulaEditor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const listener = (targetEditor, latex, editPath) => {
      if (targetEditor === editor) {
        openFormulaEditor(latex, editPath);
      }
    };

    formulaEditListeners.push(listener);
    return () => {
      const index = formulaEditListeners.indexOf(listener);
      if (index > -1) {
        formulaEditListeners.splice(index, 1);
      }
    };
  }, [editor, openFormulaEditor]);

  const closeFormulaEditor = () => {
    setFormulaVisible(false);
    setFormulaLatex("");
    setFormulaEditPath(null);
    pendingFormulaSelectionReference.current = null;
  };

  const confirmFormula = () => {
    if (!editor) {
      return;
    }

    const latex = String(formulaLatex || "").trim();
    if (!latex) {
      message.info(trans("slateRichEditor.formulaRequired", "请输入公式"));
      return;
    }

    // 直接按渲染服务地址拼接公式图片地址，不再单独封装转换函数。
    const source = `${FORMULA_RENDER_BASE_URL}?display=inline&mathUrl=${encodeURIComponent(latex)}`;
    focusEditor(editor);

    if (formulaEditPath) {
      try {
        Transforms.setNodes(
          editor,
          { latex, src: source },
          { at: formulaEditPath },
        );
      } catch {
        Transforms.insertNodes(
          editor,
          createFormulaNode(latex, { src: source }),
        );
      }
    } else {
      if (pendingFormulaSelectionReference.current) {
        try {
          Transforms.select(editor, pendingFormulaSelectionReference.current);
        } catch {
          ensureEditorSelection();
        }
      } else {
        ensureEditorSelection();
      }
      Transforms.insertNodes(editor, createFormulaNode(latex, { src: source }));
    }

    closeFormulaEditor();
  };

  const runEditorCommand = useCallback(
    (action) => {
      if (!editor || typeof action !== "function") {
        return;
      }

      ensureEditorSelection();
      try {
        return action(editor);
      } finally {
        setToolbarRenderVersion((version) => version + 1);
      }
    },
    [editor, ensureEditorSelection],
  );

  const contextValue = React.useMemo(
    () => ({
      createCommandPayload,
      editor,
      ensureEditorSelection,
      insertImage,
      openFormulaEditor,
      runEditorCommand,
      setToolbarMark,
      toolbarMarks,
      toolbarRenderVersion,
    }),
    [
      createCommandPayload,
      editor,
      ensureEditorSelection,
      insertImage,
      openFormulaEditor,
      runEditorCommand,
      setToolbarMark,
      toolbarMarks,
      toolbarRenderVersion,
    ],
  );

  return (
    <ToolbarContext.Provider value={contextValue}>
      <div
        {...restProperties}
        role={role}
        className={getClassName(styles.toolbar, className)}
      >
        {children}
      </div>
      <FormulaModal
        editing={!!formulaEditPath}
        latex={formulaLatex}
        visible={formulaVisible}
        onCancel={closeFormulaEditor}
        onChange={setFormulaLatex}
        onConfirm={confirmFormula}
      />
    </ToolbarContext.Provider>
  );
}

/**
 *
 * @param properties
 */
function ToolbarRootFromContext(properties) {
  const editor = useSlateStatic();
  const selection = useSlateSelection();
  return (
    <ToolbarRootContent {...properties} editor={editor} selection={selection} />
  );
}

/**
 *
 * @param properties
 */
export function ToolbarRoot(properties) {
  if (Object.prototype.hasOwnProperty.call(properties, "editor")) {
    return <ToolbarRootContent {...properties} />;
  }

  return <ToolbarRootFromContext {...properties} />;
}
