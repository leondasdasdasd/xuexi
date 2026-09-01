import { Text } from "slate";
import { escapeAttribute, escapeHtml, getImageDimensions } from "./shared";
import { normalizeSlateValue } from "./htmlToSlate";

const serializeText = (node) => {
  let text = escapeHtml(node.text).replaceAll("\n", "<br/>");

  if (!text) {
    return "";
  }

  const styleParts = [];
  if (node.color) {
    styleParts.push(`color:${escapeAttribute(node.color)}`);
  }
  if (node.fontSize) {
    styleParts.push(`font-size:${escapeAttribute(node.fontSize)}px`);
  }
  if (styleParts.length > 0) {
    text = `<span style="${styleParts.join(";")}">${text}</span>`;
  }
  if (node.bold) {
    text = `<strong>${text}</strong>`;
  }
  if (node.italic) {
    text = `<em>${text}</em>`;
  }
  if (node.underline) {
    text = `<u>${text}</u>`;
  }
  if (node.strike) {
    text = `<s>${text}</s>`;
  }

  return text;
};

const serializeImage = (node) => {
  const source = escapeAttribute(node.src || "");
  if (!source) {
    return "";
  }

  const alt = escapeAttribute(node.alt || "");
  const { width, height } = getImageDimensions(node);
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
  const extraAttributes =
    dimensionAttributes.length > 0 ? ` ${dimensionAttributes.join(" ")}` : "";

  return `<img src="${source}" alt="${alt}"${extraAttributes}${styleAttribute}/>`;
};

const serializeFormula = (node) => {
  const source = escapeAttribute(node.src || "");
  if (!source) {
    return "";
  }

  return `<img class="f-marker slate-formula-image" src="${source}" style="height:30px"/>`;
};

const serializeElement = (node) => {
  const children = (node.children || []).map(serializeNode).join("");

  if (node.type === "paragraph") {
    const alignStyle = node.align
      ? ` style="text-align:${escapeAttribute(node.align)}"`
      : "";
    return `<p${alignStyle}>${children || "<br/>"}</p>`;
  }

  if (node.type === "bulleted-list") {
    return `<ul>${children}</ul>`;
  }

  if (node.type === "numbered-list") {
    return `<ol>${children}</ol>`;
  }

  if (node.type === "list-item") {
    return `<li>${children || "<br/>"}</li>`;
  }

  if (node.type === "image") {
    return serializeImage(node);
  }

  if (node.type === "table") {
    return `<table><tbody>${children}</tbody></table>`;
  }

  if (node.type === "table-row") {
    return `<tr>${children}</tr>`;
  }

  if (node.type === "table-cell") {
    return `<td>${children || "<p><br/></p>"}</td>`;
  }

  if (node.type === "formula") {
    return serializeFormula(node);
  }

  return children;
};

const serializeNode = (node) =>
  Text.isText(node) ? serializeText(node) : serializeElement(node);

const nodeHasMeaningfulContent = (node) => {
  if (!node) {
    return false;
  }

  if (Text.isText(node)) {
    return !!String(node.text || "")
      .replaceAll("​", "")
      .trim();
  }

  if (["image", "formula"].includes(node.type)) {
    return !!(node.src || node.latex);
  }

  return (
    Array.isArray(node.children) && node.children.some(nodeHasMeaningfulContent)
  );
};

const isEmptyParagraphNode = (node) =>
  node && node.type === "paragraph" && !nodeHasMeaningfulContent(node);

const isTableTrailingPlaceholder = (nodes, index) =>
  index > 0 &&
  nodes[index - 1] &&
  nodes[index - 1].type === "table" &&
  isEmptyParagraphNode(nodes[index]);

const isTableLeadingPlaceholder = (nodes, index) =>
  index < nodes.length - 1 &&
  nodes[index + 1] &&
  nodes[index + 1].type === "table" &&
  isEmptyParagraphNode(nodes[index]);

const isTablePlaceholder = (nodes, index) =>
  isTableLeadingPlaceholder(nodes, index) ||
  isTableTrailingPlaceholder(nodes, index);

export const serializeSlateValue = (value) => {
  const normalized = normalizeSlateValue(value);
  return normalized
    .filter((node, index, nodes) => !isTablePlaceholder(nodes, index))
    .map(serializeNode)
    .join("")
    .trim();
};

export const isSlateValueEmpty = (value) =>
  !Array.isArray(value) || !value.some(nodeHasMeaningfulContent);

export const slateToHtml = serializeSlateValue;
