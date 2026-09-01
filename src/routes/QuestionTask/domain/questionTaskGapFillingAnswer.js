const ZERO_WIDTH_SPACE = "\u200B";
const GAP_ANSWER_SEPARATOR = "&&";
const BLOCK_TAG_NAMES = new Set([
  "ARTICLE",
  "BLOCKQUOTE",
  "DIV",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "LI",
  "OL",
  "P",
  "SECTION",
  "TABLE",
  "TBODY",
  "TD",
  "TH",
  "TR",
  "UL",
]);

const toArray = (value) =>
  Array.isArray(value) ? value.filter((item) => item !== undefined) : [];

const normalizeGapAnswerHtml = (value) =>
  String(value || "")
    .replaceAll(ZERO_WIDTH_SPACE, "")
    .trim();

const decodeMathUrlValue = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const extractLatexFromMathUrl = (source_) => {
  const source = String(source_ || "").replaceAll("&amp;", "&");
  const matched = source.match(/(?:[&?]|^)mathUrl=([^#&]+)/);

  return matched && matched[1] ? decodeMathUrlValue(matched[1]) : "";
};

const normalizeLegacyAnswerText = (value) =>
  String(value || "")
    .replaceAll("\u00A0", " ")
    .split("\n")
    .map((line) => line.replaceAll(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");

const getFormulaOnlyBlockValue = (element) => {
  if (!element || typeof element.querySelectorAll !== "function") {
    return "";
  }

  const formulaImages = [...element.querySelectorAll("img[src*='mathUrl=']")];
  if (formulaImages.length === 0) {
    return "";
  }

  const hasRegularImage = !!element.querySelector("img:not([src*='mathUrl='])");
  if (hasRegularImage) {
    return "";
  }

  const textWithoutImages = element.innerHTML
    .replaceAll(/<img\b[^>]*mathurl=[^>]*>/gi, "")
    .replaceAll(/<br\s*\/?>/gi, "")
    .replaceAll(/&nbsp;/gi, " ")
    .replaceAll(/<[^>]*>/g, "")
    .trim();
  if (textWithoutImages) {
    return "";
  }

  const formulas = formulaImages
    .map((image) => extractLatexFromMathUrl(image.getAttribute("src")))
    .filter(Boolean);

  return formulas.map((latex) => `$$${latex}$$`).join("\n");
};

const serializeLegacyAnswerNode = (node) => {
  if (!node) {
    return "";
  }

  if (node.nodeType === 3) {
    return String(node.textContent || "").replaceAll("\u00A0", " ");
  }

  if (node.nodeType !== 1) {
    return "";
  }

  const tagName = String(node.tagName || "").toUpperCase();
  if (tagName === "BR") {
    return "\n";
  }

  if (tagName === "IMG") {
    const latex = extractLatexFromMathUrl(node.getAttribute("src"));
    if (latex) {
      return `$${latex}$`;
    }

    return String(node.getAttribute("alt") || "");
  }

  const formulaOnlyBlockValue = BLOCK_TAG_NAMES.has(tagName)
    ? getFormulaOnlyBlockValue(node)
    : "";
  if (formulaOnlyBlockValue) {
    return `${formulaOnlyBlockValue}\n`;
  }

  const childContent = [...(node.childNodes || [])]
    .map((childNode) => serializeLegacyAnswerNode(childNode))
    .join("");

  return BLOCK_TAG_NAMES.has(tagName) ? `${childContent}\n` : childContent;
};

export const htmlToLegacyGapAnswerText = (value) => {
  const html = normalizeGapAnswerHtml(value);
  if (!html) {
    return "";
  }

  if (typeof document === "undefined") {
    return normalizeLegacyAnswerText(
      html
        .replaceAll(/<img\b[^>]*mathurl=([^\s"#&'>]+)[^>]*>/gi, (matched) => {
          const sourceMatch = matched.match(/src=["']([^"']+)["']/i);
          const latex = extractLatexFromMathUrl(sourceMatch?.[1]);
          return latex ? ` $${latex}$ ` : " ";
        })
        .replaceAll(/<br\s*\/?>/gi, "\n")
        .replaceAll(/<\/(?:p|div|li|h[1-6]|tr|td|th|section|article)>/gi, "\n")
        .replaceAll(/<[^>]*>/g, " ")
        .replaceAll(/&nbsp;/gi, " "),
    );
  }

  const container = document.createElement("div");
  container.innerHTML = html;

  return normalizeLegacyAnswerText(
    [...container.childNodes]
      .map((childNode) => serializeLegacyAnswerNode(childNode))
      .join(""),
  );
};

const normalizeAnswerRawGroup = (group) =>
  toArray(group).map(normalizeGapAnswerHtml).filter(Boolean);

export const getGapFillingAnswerGroups = (gapFillingAnswer) => {
  if (
    gapFillingAnswer &&
    Array.isArray(gapFillingAnswer.answerRaw) &&
    gapFillingAnswer.answerRaw.length > 0
  ) {
    return gapFillingAnswer.answerRaw
      .map((group) =>
        normalizeAnswerRawGroup(Array.isArray(group) ? group : [group]),
      )
      .filter((group) => group.length > 0);
  }

  if (
    gapFillingAnswer &&
    Array.isArray(gapFillingAnswer.answers) &&
    gapFillingAnswer.answers.length > 0
  ) {
    return gapFillingAnswer.answers
      .map((groupValue) =>
        normalizeAnswerRawGroup(
          String(groupValue || "")
            .split(GAP_ANSWER_SEPARATOR)
            .map((item) => normalizeGapAnswerHtml(item)),
        ),
      )
      .filter((group) => group.length > 0);
  }

  return [];
};

export const hasGapFillingAnswerContent = (gapFillingAnswer) =>
  getGapFillingAnswerGroups(gapFillingAnswer).some(
    (group) => Array.isArray(group) && group.length > 0,
  );

export const buildGapFillingAnswerTransport = ({
  answerGroups,
  isOrder = false,
}) => {
  const normalizedAnswerGroups = toArray(answerGroups)
    .map((group) => normalizeAnswerRawGroup(group))
    .filter((group) => group.length > 0);

  return {
    answerRaw: normalizedAnswerGroups,
    answers: normalizedAnswerGroups
      .map((group) =>
        group
          .map((answerHtml) => htmlToLegacyGapAnswerText(answerHtml))
          .filter(Boolean)
          .join(GAP_ANSWER_SEPARATOR),
      )
      .filter(Boolean),
    isOrder: !!isOrder,
  };
};
