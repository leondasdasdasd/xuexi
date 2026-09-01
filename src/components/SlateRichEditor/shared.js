import { Editor, Element as SlateElement, Transforms } from "slate";
import { ReactEditor } from "slate-react";

let mathliveLoadPromise = null;

export const isMathliveReady = () =>
  typeof window !== "undefined" &&
  window.customElements &&
  !!window.customElements.get("math-field");

export const loadMathlive = () => {
  if (isMathliveReady()) {
    return Promise.resolve();
  }

  if (mathliveLoadPromise) {
    return mathliveLoadPromise;
  }

  if (typeof window === "undefined" || !window.customElements) {
    return Promise.reject(new Error("customElements is not available"));
  }
  // 通过 package exports 入口加载，避免绑定到构建工具私有的深层文件路径。
  mathliveLoadPromise = import("mathlive").then(() => {
    if (!isMathliveReady()) {
      throw new Error("MathLive load failed");
    }
  });

  return mathliveLoadPromise;
};

export const escapeHtml = (value) =>
  String(value === undefined || value === null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export const escapeAttribute = (value) =>
  escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export const cloneSlateValue = (value) => JSON.parse(JSON.stringify(value));

export const normalizeImageDimension = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;
  }

  const source = String(value || "").trim();
  const matched = source.match(/^(\d+(?:\.\d+)?)(px)?$/i);
  if (!matched) {
    return;
  }

  const numberValue = Number(matched[1]);
  return Number.isFinite(numberValue) && numberValue > 0
    ? Math.round(numberValue)
    : undefined;
};

export const getImageDimensions = (source) => {
  const width = normalizeImageDimension(source && source.width);
  const height = normalizeImageDimension(source && source.height);
  return {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };
};

export const createImageNode = (source, alt = "", dimensions = {}) => ({
  alt,
  children: [{ text: "" }],
  src: source,
  type: "image",
  ...getImageDimensions(dimensions),
});

export const createFormulaNode = (latex = "", options = {}) => ({
  children: [{ text: "" }],
  latex,
  src: options.src || "",
  type: "formula",
});

// 数学公式 SVG 渲染服务地址，latex 通过查询参数直接拼接，display 固定为行内渲染。
const DAILY_FORMULA_RENDER_BASE_URL =
  "https://ai.daily.yungu-inc.org/center/api/custom-services/document-render/api/math-svg";
const PRODUCTION_FORMULA_RENDER_BASE_URL =
  "https://ai.yungu.org/center/api/custom-services/document-render/api/math-svg";

const FORMULA_RENDER_CURRENT_HOST =
  typeof window !== "undefined" && window.location
    ? (window.location.hostname || window.location.host || "").toLowerCase()
    : "";

// 按当前页面域名选择公式渲染服务：命中线上 yungu.org 走生产网关，其余默认走 daily。
export const FORMULA_RENDER_BASE_URL = FORMULA_RENDER_CURRENT_HOST.includes(
  "yungu.org",
)
  ? PRODUCTION_FORMULA_RENDER_BASE_URL
  : DAILY_FORMULA_RENDER_BASE_URL;

export const extractLatexFromMathUrl = (source_) => {
  const source = String(source_ || "").replaceAll("&amp;", "&");
  const mathUrlMatch = source.match(/(?:[&?]|^)mathUrl=([^#&]+)/);
  if (!mathUrlMatch || !mathUrlMatch[1]) {
    return "";
  }

  try {
    return decodeURIComponent(mathUrlMatch[1]);
  } catch {
    return mathUrlMatch[1];
  }
};

export const getSelectedImageEntry = (editor) => {
  if (!editor.selection) {
    return null;
  }

  const entry = Editor.nodes(editor, {
    at: editor.selection,
    match: (node) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      node.type === "image",
  }).next();

  return entry.done ? null : entry.value;
};

const ensureEditorCursorSelection = (editor) => {
  if (editor.selection) {
    return;
  }

  try {
    Transforms.select(editor, Editor.end(editor, []));
  } catch {
    try {
      Transforms.select(editor, [0]);
    } catch {
      // The editor may not have mounted editable content yet.
    }
  }
};

export const focusEditor = (editor, options = {}) => {
  const { ensureSelection } = options;

  try {
    if (ensureSelection) {
      ensureEditorCursorSelection(editor);
    }
    ReactEditor.focus(editor);
  } catch {
    // The editor may not be mounted yet.
  }
};

const selectionScrollSuppressions = new WeakSet();

export const suppressNextSelectionScroll = (editor) => {
  selectionScrollSuppressions.add(editor);
};

export const scrollSelectionIntoView = (editor, domRange) => {
  if (selectionScrollSuppressions.delete(editor)) {
    return;
  }

  const leafElement = domRange.startContainer.parentElement;
  if (leafElement && typeof leafElement.scrollIntoView === "function") {
    leafElement.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
};
