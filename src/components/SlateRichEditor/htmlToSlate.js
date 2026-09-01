import { Element as SlateElement, Text } from "slate";
import {
  cloneSlateValue,
  createFormulaNode,
  createImageNode,
  extractLatexFromMathUrl,
  getImageDimensions,
  normalizeImageDimension,
} from "./shared";
import {
  createTableCellNode,
  createTableFallbackParagraphs,
  createTableRowNode,
} from "./tableCommands";

const EMPTY_VALUE = [{ type: "paragraph", children: [{ text: "" }] }];
const LIST_TYPES = new Set(["numbered-list", "bulleted-list"]);
const ALIGN_TYPES = new Set(["left", "center", "right"]);
const NON_CONTENT_TAGS = new Set([
  "STYLE",
  "SCRIPT",
  "META",
  "LINK",
  "XML",
  "TITLE",
  "HEAD",
]);

const createEmptyValue = () => cloneSlateValue(EMPTY_VALUE);

const BLOCK_TYPES = new Set([
  "paragraph",
  "bulleted-list",
  "numbered-list",
  "table",
]);
const INLINE_TYPES = new Set(["formula", "image"]);

const getStyleValue = (styleText, key) => {
  if (!styleText) {
    return "";
  }

  const styleParts = String(styleText)
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
  const matched = styleParts.find(
    (item) => item.toLowerCase().indexOf(`${key}:`) === 0,
  );
  return matched ? matched.slice(matched.indexOf(":") + 1).trim() : "";
};

const normalizeColor = (value) => String(value || "").trim();

const normalizeFontSize = (value) => {
  const matched = String(value || "").match(/\d+/);
  return matched ? matched[0] : "";
};

const getElementImageDimensions = (element) => {
  const styleText = element.getAttribute("style") || "";
  return getImageDimensions({
    height:
      normalizeImageDimension(getStyleValue(styleText, "height")) ||
      normalizeImageDimension(element.getAttribute("height")),
    width:
      normalizeImageDimension(getStyleValue(styleText, "width")) ||
      normalizeImageDimension(element.getAttribute("width")),
  });
};

const normalizeAlign = (value) => {
  const align = String(value || "").toLowerCase();
  return ALIGN_TYPES.has(align) ? align : "";
};

const getElementStyleMarks = (element, marks) => {
  const nextMarks = { ...marks };
  const tagName = element.tagName;
  const styleText = element.getAttribute("style") || "";
  const color = normalizeColor(getStyleValue(styleText, "color"));
  const fontSize = normalizeFontSize(getStyleValue(styleText, "font-size"));

  if (tagName === "B" || tagName === "STRONG") {
    nextMarks.bold = true;
  }
  if (tagName === "I" || tagName === "EM") {
    nextMarks.italic = true;
  }
  if (tagName === "U") {
    nextMarks.underline = true;
  }
  if (["S", "DEL", "STRIKE"].includes(tagName)) {
    nextMarks.strike = true;
  }
  if (color) {
    nextMarks.color = color;
  }
  if (fontSize) {
    nextMarks.fontSize = fontSize;
  }

  return nextMarks;
};

const getElementChildren = (element, marks) => {
  const children = [];
  for (const childNode of element.childNodes || []) {
    const childResult = deserializeNode(childNode, marks);
    if (Array.isArray(childResult)) {
      children.push(...childResult);
    } else if (childResult) {
      children.push(childResult);
    }
  }
  return children.length > 0 ? children : [{ text: "", ...marks }];
};

const isInlineElement = (node) =>
  SlateElement.isElement(node) && INLINE_TYPES.has(node.type);

const normalizeInlineChildren = (children) => {
  const inlineChildren = (Array.isArray(children) ? children : [])
    .map((child) =>
      Text.isText(child) || isInlineElement(child) ? child : null,
    )
    .filter(Boolean);

  if (inlineChildren.length === 0) {
    return [{ text: "" }];
  }

  const nextChildren = [];
  for (const child of inlineChildren) {
    if (isInlineElement(child) && !Text.isText(nextChildren.at(-1))) {
      nextChildren.push({ text: "" });
    }

    nextChildren.push(child);

    if (isInlineElement(child)) {
      nextChildren.push({ text: "" });
    }
  }

  return nextChildren.length > 0 ? nextChildren : [{ text: "" }];
};

const isInlineSlateNode = (node) => Text.isText(node) || isInlineElement(node);

const getChildInlineChildren = (child) => {
  if (isInlineSlateNode(child)) {
    return [child];
  }

  if (!SlateElement.isElement(child) || !Array.isArray(child.children)) {
    return [];
  }

  return child.children.filter((node) => isInlineSlateNode(node));
};

const getListItemInlineChildren = (children) => {
  // 剪贴板中的 li 常包裹 p/div；Slate 的 list-item 在本编辑器中只接收内联子节点。
  const inlineGroups = (Array.isArray(children) ? children : [])
    .map((child) => getChildInlineChildren(child))
    .filter((childInlineChildren) => childInlineChildren.length > 0);
  const inlineChildren = inlineGroups.flatMap((childInlineChildren, index) =>
    index === 0
      ? childInlineChildren
      : [{ text: "\n" }, ...childInlineChildren],
  );

  return normalizeInlineChildren(inlineChildren);
};

// 将反序列化得到的顶层节点收敛成编辑器允许的块结构：连续文本、公式、图片会合并为同一个段落；
// 遇到列表、表格、段落等块级节点时先结束当前段落，避免裸 HTML 中的内联公式被逐个拆成独立段落。
const toContentBlocks = (nodes) => {
  const blocks = [];
  let inlineChildren = [];

  const flushInlineChildren = () => {
    if (inlineChildren.length === 0) {
      return;
    }

    blocks.push({
      children: normalizeInlineChildren(inlineChildren),
      type: "paragraph",
    });
    inlineChildren = [];
  };

  for (const node of nodes) {
    if (!node) {
      continue;
    }

    if (Array.isArray(node)) {
      flushInlineChildren();
      blocks.push(...toContentBlocks(node));
      continue;
    }

    if (Text.isText(node)) {
      inlineChildren.push(node);
      continue;
    }

    if (isInlineElement(node)) {
      inlineChildren.push(node);
      continue;
    }

    if (BLOCK_TYPES.has(node.type)) {
      flushInlineChildren();
      blocks.push(node);
    }
  }

  flushInlineChildren();

  return blocks.length > 0
    ? blocks
    : [{ type: "paragraph", children: [{ text: "" }] }];
};

const deserializeElementChildren = (element, marks) => {
  const children = [];
  for (const childNode of element.childNodes || []) {
    const childResult = deserializeNode(childNode, marks);
    if (Array.isArray(childResult)) {
      children.push(...childResult);
    } else if (childResult) {
      children.push(childResult);
    }
  }
  return children;
};

const hasComplexTableStructure = (element) => {
  if (element.querySelector("table")) {
    return true;
  }

  return [...element.querySelectorAll("td,th")].some((cell) => {
    const colspan = Number(cell.getAttribute("colspan") || 1);
    const rowspan = Number(cell.getAttribute("rowspan") || 1);
    return colspan > 1 || rowspan > 1;
  });
};

const getTableCellElements = (rowElement) =>
  [...(rowElement.children || [])].filter(
    (child) => child.tagName === "TD" || child.tagName === "TH",
  );

const deserializeTableElement = (element, marks) => {
  if (hasComplexTableStructure(element)) {
    return createTableFallbackParagraphs(element);
  }

  const rowElements = [...element.querySelectorAll("tr")];
  if (rowElements.length === 0) {
    return createTableFallbackParagraphs(element);
  }

  const rowCellElements = rowElements.map(getTableCellElements);
  const columnCount = rowCellElements[0] ? rowCellElements[0].length : 0;
  if (
    !columnCount ||
    rowCellElements.some((cells) => cells.length !== columnCount)
  ) {
    return createTableFallbackParagraphs(element);
  }

  return {
    children: rowCellElements.map((cellElements) => ({
      children: cellElements.map((cellElement) => {
        const cellChildren = toContentBlocks(
          deserializeElementChildren(cellElement, marks),
        );
        return createTableCellNode(cellChildren);
      }),
      type: "table-row",
    })),
    type: "table",
  };
};

const deserializeNode = (domNode, marks = {}) => {
  if (!domNode) {
    return null;
  }

  if (domNode.nodeType === 3) {
    return { text: domNode.textContent || "", ...marks };
  }

  if (domNode.nodeType !== 1) {
    return null;
  }

  const element = domNode;
  const tagName = element.tagName;
  if (NON_CONTENT_TAGS.has(tagName)) {
    return null;
  }

  const nextMarks = getElementStyleMarks(element, marks);

  if (tagName === "BR") {
    return { text: "\n", ...nextMarks };
  }

  if (tagName === "IMG") {
    const source = element.getAttribute("src") || "";
    const latex = extractLatexFromMathUrl(source);
    if (latex) {
      return createFormulaNode(latex, { src: source });
    }
    return createImageNode(
      source,
      element.getAttribute("alt") || "",
      getElementImageDimensions(element),
    );
  }

  if (tagName === "TABLE") {
    return deserializeTableElement(element, nextMarks);
  }

  if (tagName === "UL" || tagName === "OL") {
    const children = [...(element.children || [])]
      .filter((child) => child.tagName === "LI")
      .map((child) => deserializeNode(child, nextMarks))
      .filter(Boolean);

    return {
      children:
        children.length > 0
          ? children
          : [{ type: "list-item", children: [{ text: "" }] }],
      type: tagName === "OL" ? "numbered-list" : "bulleted-list",
    };
  }

  if (tagName === "LI") {
    const listItemChildren = getListItemInlineChildren(
      getElementChildren(element, nextMarks),
    );

    return {
      children: listItemChildren,
      type: "list-item",
    };
  }

  if (tagName === "P" || tagName === "DIV") {
    return {
      align: normalizeAlign(
        getStyleValue(element.getAttribute("style") || "", "text-align"),
      ),
      children: getElementChildren(element, nextMarks),
      type: "paragraph",
    };
  }

  return getElementChildren(element, nextMarks);
};

const normalizeSlateNode = (node) => {
  if (!node) {
    return null;
  }

  if (Text.isText(node)) {
    return { type: "paragraph", children: [node] };
  }

  if (!SlateElement.isElement(node)) {
    return null;
  }

  if (node.type === "image") {
    const latex = extractLatexFromMathUrl(node.src);
    if (latex) {
      return createFormulaNode(latex, { src: node.src || "" });
    }
    return createImageNode(node.src || "", node.alt || "", node);
  }

  if (node.type === "formula") {
    return createFormulaNode(node.latex || "", { src: node.src || "" });
  }

  if (node.type === "table") {
    return normalizeTableNode(node);
  }

  const children =
    Array.isArray(node.children) && node.children.length > 0
      ? node.children.map((child) =>
          Text.isText(child) || SlateElement.isElement(child)
            ? child
            : { text: "" },
        )
      : [{ text: "" }];

  if (LIST_TYPES.has(node.type)) {
    const listChildren = children.filter(
      (child) => SlateElement.isElement(child) && child.type === "list-item",
    );

    return {
      children:
        listChildren.length > 0
          ? listChildren
          : [{ type: "list-item", children: [{ text: "" }] }],
      type: node.type,
    };
  }

  if (node.type === "list-item") {
    return {
      children: normalizeInlineChildren(children),
      type: "list-item",
    };
  }

  return {
    align: normalizeAlign(node.align),
    children: normalizeInlineChildren(children),
    type: "paragraph",
  };
};

const normalizeTopLevelSlateNode = (node) => {
  if (Text.isText(node)) {
    return node;
  }

  return normalizeSlateNode(node);
};

/**
 *
 * @param node
 */
function normalizeTableNode(node) {
  const rows = (Array.isArray(node.children) ? node.children : [])
    .map((child) =>
      SlateElement.isElement(child) && child.type === "table-row"
        ? normalizeTableRowNode(child)
        : null,
    )
    .filter(Boolean);

  return {
    children: rows.length > 0 ? rows : [createTableRowNode(1)],
    type: "table",
  };
}

/**
 *
 * @param node
 */
function normalizeTableRowNode(node) {
  const cells = (Array.isArray(node.children) ? node.children : [])
    .map((child) =>
      SlateElement.isElement(child) && child.type === "table-cell"
        ? normalizeTableCellNode(child)
        : null,
    )
    .filter(Boolean);

  return {
    children: cells.length > 0 ? cells : [createTableCellNode()],
    type: "table-row",
  };
}

/**
 *
 * @param node
 */
function normalizeTableCellNode(node) {
  return createTableCellNode(
    toContentBlocks((node.children || []).map(normalizeSlateNode)),
  );
}

export const normalizeSlateValue = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    return createEmptyValue();
  }

  const normalized = value
    .map((node) => normalizeTopLevelSlateNode(node))
    .filter(Boolean);

  return normalized.length > 0
    ? toContentBlocks(normalized)
    : createEmptyValue();
};

export const deserializeHtml = (html) => {
  const source = String(html || "").trim();
  if (!source || typeof DOMParser === "undefined") {
    return createEmptyValue();
  }

  const parser = new DOMParser();
  const document_ = parser.parseFromString(
    `<!doctype html><body>${source}</body>`,
    "text/html",
  );
  const nodes = [];

  for (const childNode of document_.body.childNodes || []) {
    const node = deserializeNode(childNode, {});
    if (Array.isArray(node)) {
      nodes.push(...node);
    } else if (node) {
      nodes.push(node);
    }
  }

  return normalizeSlateValue(nodes);
};

export const htmlToSlate = deserializeHtml;
