import {
  Editor,
  Element as SlateElement,
  Node,
  Path,
  Range,
  Transforms,
} from "slate";

const TABLE_TYPE = "table";
const TABLE_ROW_TYPE = "table-row";
const TABLE_CELL_TYPE = "table-cell";

export const createParagraphNode = (text = "") => ({
  children: [{ text }],
  type: "paragraph",
});

export const createTableCellNode = (children) => ({
  children:
    Array.isArray(children) && children.length > 0
      ? children
      : [createParagraphNode()],
  type: TABLE_CELL_TYPE,
});

export const createTableRowNode = (columns = 3) => ({
  children: Array.from({ length: Math.max(Number(columns) || 1, 1) }, () =>
    createTableCellNode(),
  ),
  type: TABLE_ROW_TYPE,
});

export const createTableNode = (rows = 3, columns = 3) => ({
  children: Array.from({ length: Math.max(Number(rows) || 1, 1) }, () =>
    createTableRowNode(columns),
  ),
  type: TABLE_TYPE,
});

export const createTableFallbackParagraphs = (tableElement) => {
  const rowTexts = [...tableElement.querySelectorAll("tr")]
    .map((row) =>
      [...(row.children || [])]
        .filter((cell) => cell.tagName === "TD" || cell.tagName === "TH")
        .map((cell) =>
          String(cell.textContent || "")
            .replaceAll(/\s+/g, " ")
            .trim(),
        )
        .filter(Boolean)
        .join(" | "),
    )
    .filter(Boolean);

  return rowTexts.length > 0
    ? rowTexts.map((text) => createParagraphNode(text))
    : null;
};

export const getTableCellEntryAt = (editor, at) => {
  if (!editor || !at) {
    return null;
  }

  try {
    return (
      Editor.above(editor, {
        at,
        match: (node) =>
          !Editor.isEditor(node) &&
          SlateElement.isElement(node) &&
          node.type === TABLE_CELL_TYPE,
      }) || null
    );
  } catch {
    return null;
  }
};

export const getSelectedTableCell = (editor) => {
  if (!editor || !editor.selection) {
    return null;
  }

  return getTableCellEntryAt(editor, editor.selection.anchor);
};

export const isSelectionAcrossTableCells = (editor) => {
  const selection = editor && editor.selection;
  if (!selection || Range.isCollapsed(selection)) {
    return false;
  }

  const anchorCell = getTableCellEntryAt(editor, selection.anchor);
  const focusCell = getTableCellEntryAt(editor, selection.focus);
  if (!anchorCell && !focusCell) {
    return false;
  }
  if (!anchorCell || !focusCell) {
    return true;
  }

  return !Path.equals(anchorCell[1], focusCell[1]);
};

export const collapseSelectionToTableCellStart = (editor) => {
  const selection = editor && editor.selection;
  if (!selection) {
    return false;
  }

  const cellEntry =
    getTableCellEntryAt(editor, selection.anchor) ||
    getTableCellEntryAt(editor, selection.focus);
  if (!cellEntry) {
    return false;
  }

  try {
    Transforms.select(editor, Editor.start(editor, cellEntry[1]));
    return true;
  } catch {
    return false;
  }
};

export const collapseSelectionAcrossTableCells = (editor) => {
  if (!isSelectionAcrossTableCells(editor)) {
    return false;
  }

  return collapseSelectionToTableCellStart(editor);
};

export const isSelectionAtTableCellStart = (editor) => {
  const selection = editor && editor.selection;
  if (!selection || !Range.isCollapsed(selection)) {
    return false;
  }

  const cellEntry = getTableCellEntryAt(editor, selection.anchor);
  return cellEntry
    ? Editor.isStart(editor, selection.anchor, cellEntry[1])
    : false;
};

export const isSelectionAtTableCellEnd = (editor) => {
  const selection = editor && editor.selection;
  if (!selection || !Range.isCollapsed(selection)) {
    return false;
  }

  const cellEntry = getTableCellEntryAt(editor, selection.anchor);
  return cellEntry
    ? Editor.isEnd(editor, selection.anchor, cellEntry[1])
    : false;
};

const getParagraphEntryAt = (editor, at) => {
  try {
    return (
      Editor.above(editor, {
        at,
        match: (node) =>
          !Editor.isEditor(node) &&
          SlateElement.isElement(node) &&
          node.type === "paragraph",
      }) || null
    );
  } catch {
    return null;
  }
};

const isTableNode = (node) =>
  SlateElement.isElement(node) && node.type === TABLE_TYPE;
const isParagraphNode = (node) =>
  SlateElement.isElement(node) && node.type === "paragraph";

export const deleteTableBeforeSelection = (editor) => {
  const selection = editor && editor.selection;
  if (!selection || !Range.isCollapsed(selection)) {
    return false;
  }

  const paragraphEntry = getParagraphEntryAt(editor, selection.anchor);
  if (!paragraphEntry) {
    return false;
  }

  const [, paragraphPath] = paragraphEntry;
  if (paragraphPath.length !== 1 || paragraphPath[0] === 0) {
    return false;
  }

  if (!Editor.isStart(editor, selection.anchor, paragraphPath)) {
    return false;
  }

  const tablePath = [paragraphPath[0] - 1];
  const tableNode = editor.children[tablePath[0]];
  if (!isTableNode(tableNode)) {
    return false;
  }

  Transforms.removeNodes(editor, { at: tablePath });

  try {
    Transforms.select(editor, Editor.start(editor, tablePath));
  } catch {
    Transforms.select(editor, [0]);
  }

  return true;
};

export const deleteTableAfterSelection = (editor) => {
  const selection = editor && editor.selection;
  if (!selection || !Range.isCollapsed(selection)) {
    return false;
  }

  const paragraphEntry = getParagraphEntryAt(editor, selection.anchor);
  if (!paragraphEntry) {
    return false;
  }

  const [, paragraphPath] = paragraphEntry;
  if (paragraphPath.length !== 1) {
    return false;
  }

  if (!Editor.isEnd(editor, selection.anchor, paragraphPath)) {
    return false;
  }

  const tablePath = [paragraphPath[0] + 1];
  const tableNode = editor.children[tablePath[0]];
  if (!isTableNode(tableNode)) {
    return false;
  }

  Transforms.removeNodes(editor, { at: tablePath });

  try {
    Transforms.select(editor, Editor.end(editor, paragraphPath));
  } catch {
    Transforms.select(editor, paragraphPath);
  }

  return true;
};

const getSelectedTableContext = (editor) => {
  const cellEntry = getSelectedTableCell(editor);
  if (!cellEntry) {
    return null;
  }

  const [, cellPath] = cellEntry;
  const rowEntry = Editor.above(editor, {
    at: cellPath,
    match: (node) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      node.type === TABLE_ROW_TYPE,
  });
  const tableEntry = Editor.above(editor, {
    at: cellPath,
    match: (node) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      node.type === TABLE_TYPE,
  });

  if (!rowEntry || !tableEntry) {
    return null;
  }

  const [rowNode, rowPath] = rowEntry;
  const [tableNode, tablePath] = tableEntry;

  return {
    cellEntry,
    cellIndex: cellPath.at(-1),
    rowEntry,
    rowIndex: rowPath.at(-1),
    rowNode,
    rowPath,
    tableEntry,
    tableNode,
    tablePath,
  };
};

const getTopLevelInsertTarget = (editor) => {
  if (!editor.selection) {
    return {
      insertPath: [editor.children.length],
      replacePath: null,
    };
  }

  const blockEntry = Editor.above(editor, {
    match: (node) => !Editor.isEditor(node) && SlateElement.isElement(node),
    mode: "highest",
  });

  if (!blockEntry) {
    return {
      insertPath: [editor.children.length],
      replacePath: null,
    };
  }

  const [blockNode, blockPath] = blockEntry;
  if (blockNode.type === "paragraph" && !Node.string(blockNode).trim()) {
    return {
      insertPath: blockPath,
      replacePath: blockPath,
    };
  }

  return {
    insertPath: [blockPath[0] + 1],
    replacePath: null,
  };
};

export const insertTable = (editor, options = {}) => {
  if (!editor) {
    return false;
  }

  const { columns = 3, rows = 3 } = options;
  const tableNode = createTableNode(rows, columns);
  const { insertPath, replacePath } = getTopLevelInsertTarget(editor);
  const insertIndex = insertPath[0];
  const previousNode = editor.children[insertIndex - 1];
  const nextNode = editor.children[replacePath ? insertIndex + 1 : insertIndex];
  const shouldInsertLeadingParagraph = !isParagraphNode(previousNode);
  const shouldInsertTrailingParagraph = !isParagraphNode(nextNode);
  const nodesToInsert = [
    shouldInsertLeadingParagraph ? createParagraphNode() : null,
    tableNode,
    shouldInsertTrailingParagraph ? createParagraphNode() : null,
  ].filter(Boolean);
  const tablePath = [insertIndex + (shouldInsertLeadingParagraph ? 1 : 0)];

  Editor.withoutNormalizing(editor, () => {
    if (replacePath) {
      Transforms.removeNodes(editor, { at: replacePath });
    }
    Transforms.insertNodes(editor, nodesToInsert, { at: insertPath });
  });

  try {
    Transforms.select(editor, Editor.start(editor, [...tablePath, 0, 0, 0]));
  } catch {
    Transforms.select(editor, tablePath);
  }

  return true;
};

export const insertRow = (editor, direction = "after") => {
  const context = getSelectedTableContext(editor);
  if (!context) {
    return false;
  }

  const columns = Math.max((context.rowNode.children || []).length, 1);
  const rowPath = context.tablePath.concat(
    context.rowIndex + (direction === "before" ? 0 : 1),
  );
  Transforms.insertNodes(editor, createTableRowNode(columns), { at: rowPath });
  return true;
};

export const deleteRow = (editor) => {
  const context = getSelectedTableContext(editor);
  if (!context) {
    return false;
  }

  const rows = context.tableNode.children || [];
  if (rows.length <= 1) {
    Transforms.removeNodes(editor, { at: context.tablePath });
    Transforms.insertNodes(editor, createParagraphNode(), {
      at: context.tablePath,
    });
    return true;
  }

  Transforms.removeNodes(editor, { at: context.rowPath });
  return true;
};

export const insertColumn = (editor, direction = "after") => {
  const context = getSelectedTableContext(editor);
  if (!context) {
    return false;
  }

  const insertOffset = direction === "before" ? 0 : 1;
  Editor.withoutNormalizing(editor, () => {
    for (const [rowIndex, row] of (
      context.tableNode.children || []
    ).entries()) {
      const cellCount = Math.max((row.children || []).length, 0);
      const cellIndex = Math.min(context.cellIndex + insertOffset, cellCount);
      Transforms.insertNodes(editor, createTableCellNode(), {
        at: [...context.tablePath, rowIndex, cellIndex],
      });
    }
  });

  return true;
};

export const deleteColumn = (editor) => {
  const context = getSelectedTableContext(editor);
  if (!context) {
    return false;
  }

  const columnCount = Math.max((context.rowNode.children || []).length, 0);
  if (columnCount <= 1) {
    Transforms.removeNodes(editor, { at: context.tablePath });
    Transforms.insertNodes(editor, createParagraphNode(), {
      at: context.tablePath,
    });
    return true;
  }

  Editor.withoutNormalizing(editor, () => {
    for (const [rowIndex, row] of (
      context.tableNode.children || []
    ).entries()) {
      if ((row.children || []).length > context.cellIndex) {
        Transforms.removeNodes(editor, {
          at: [...context.tablePath, rowIndex, context.cellIndex],
        });
      }
    }
  });

  return true;
};
