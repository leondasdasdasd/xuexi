import { message } from "antd";

import { trans } from "../../../utils/i18n";

const MAX_PASTE_IMAGE_COUNT = Number("10");
const BYTES_PER_KIB = Number("1024");
const BYTES_PER_MIB = BYTES_PER_KIB * BYTES_PER_KIB;
const MAX_PASTE_IMAGE_SIZE = MAX_PASTE_IMAGE_COUNT * BYTES_PER_MIB;
const BASE64_BYTES_PER_CHUNK = Number("3");
const BASE64_CHARS_PER_CHUNK = Number("4");
const ONE_PADDING_BYTE = Number("1");
const TWO_PADDING_BYTES = Number("2");
const ZERO = Number("0");
const HTTP_OK = Number("200");
const HTTP_MULTIPLE_CHOICES = Number("300");

export const BATCH_PASTE_IMAGE_LIMITS = {
  maxCount: MAX_PASTE_IMAGE_COUNT,
  maxSize: MAX_PASTE_IMAGE_SIZE,
};

export const BATCH_PASTE_IMAGE_MESSAGES = {
  countExceeded: trans(
    "batchInput.pasteImageCountExceeded",
    "一次最多粘贴 10 张图片，请减少图片数量后重试。",
  ),
  sizeExceeded: trans(
    "batchInput.pasteImageSizeExceeded",
    "单张图片不能超过 10MB，请压缩后重试。",
  ),
  uploadFailed: trans(
    "batchInput.pasteImageUploadFailed",
    "图片上传失败，请稍后重试。",
  ),
};

const EMPTY_PASTE_HTML = { handled: false, html: "" };
const IMAGE_SOURCE_REG = /^(?:data:image\/|blob:)/i;
const IMAGE_TYPE_REG = /^image\//i;
const installState = {
  pasteHandlerInstalled: false,
};

const createPasteImageError = (errorMessage) =>
  Object.assign(new Error(errorMessage), { name: "BatchPasteImageError" });

const BrowserPromise = window["Promise"];

const rejectWithMessage = (errorMessage) =>
  new BrowserPromise((resolve, reject) => {
    reject(createPasteImageError(errorMessage));
  });

const getClipboardData = (clipboardData, type) => {
  try {
    return clipboardData && clipboardData.getData
      ? clipboardData.getData(type)
      : "";
  } catch {
    return "";
  }
};

const isImageFile = (file) =>
  !!(file && file.type && IMAGE_TYPE_REG.test(file.type));

const getFileKey = (file) =>
  [file.name || "", file.type || "", file.size || 0].join("|");

const readClipboardItemFile = (item) => {
  if (!item || item.kind !== "file" || !IMAGE_TYPE_REG.test(item.type || "")) {
    return;
  }

  try {
    return item.getAsFile && item.getAsFile();
  } catch {
    // 剪贴板中的单个图片不可读时，继续处理其它图片，避免整次粘贴中断。
    return;
  }
};

const addUniqueImageFile = (state, file) => {
  if (!isImageFile(file)) {
    return state;
  }

  const key = getFileKey(file);
  if (state.seen.has(key)) {
    return state;
  }

  return {
    files: [...state.files, file],
    seen: new Set([...state.seen, key]),
  };
};

const collectUniqueImageFiles = (sourceFiles, index = ZERO, state) => {
  const currentState = state || { files: [], seen: new Set() };
  if (index >= sourceFiles.length) {
    return currentState;
  }

  return collectUniqueImageFiles(
    sourceFiles,
    index + ONE_PADDING_BYTE,
    addUniqueImageFile(currentState, sourceFiles[index]),
  );
};

export const getClipboardImageFiles = (clipboardData) => {
  if (!clipboardData) {
    return [];
  }

  const itemFiles = [...(clipboardData.items || [])]
    .map((item) => readClipboardItemFile(item))
    .filter(Boolean);
  const sourceFiles =
    itemFiles.length > 0 ? itemFiles : [...(clipboardData.files || [])];

  return collectUniqueImageFiles(sourceFiles).files;
};

export const hasBatchPasteImages = (clipboardData) => {
  const html = getClipboardData(clipboardData, "text/html");
  return (
    /<img\b[^>]*\bsrc=["']?(?:data:image\/|blob:)/i.test(html) ||
    getClipboardImageFiles(clipboardData).length > 0
  );
};

const getImageExtension = (mimeType) => {
  const extension =
    String(mimeType || "").split("/")[ONE_PADDING_BYTE] || "png";
  return extension === "jpeg" ? "jpg" : extension;
};

const createImageFile = (blob, index) => {
  const type = blob.type || "image/png";
  const name = `batch-pasted-image-${Date.now()}-${index}.${getImageExtension(
    type,
  )}`;

  if (typeof File === "function") {
    return new File([blob], name, { type });
  }

  blob.name = name;
  return blob;
};

const getBase64PaddingSize = (data) => {
  if (data.endsWith("==")) {
    return TWO_PADDING_BYTES;
  }

  return data.endsWith("=") ? ONE_PADDING_BYTE : ZERO;
};

const getDataUrlSize = (source) => {
  const dataIndex = source.indexOf(",");
  if (dataIndex < ZERO) {
    return ZERO;
  }

  const header = source.slice(ZERO, dataIndex);
  const data = source.slice(dataIndex + ONE_PADDING_BYTE);
  if (/;base64/i.test(header)) {
    return (
      Math.floor(
        (data.length * BASE64_BYTES_PER_CHUNK) / BASE64_CHARS_PER_CHUNK,
      ) - getBase64PaddingSize(data)
    );
  }

  try {
    return decodeURIComponent(data).length;
  } catch {
    return data.length;
  }
};

const dataUrlToFile = async (source, index) => {
  if (getDataUrlSize(source) > BATCH_PASTE_IMAGE_LIMITS.maxSize) {
    return rejectWithMessage(BATCH_PASTE_IMAGE_MESSAGES.sizeExceeded);
  }

  const matched = source.match(/^data:([^,;]+)(;base64)?,(.*)$/i);
  if (!matched) {
    return rejectWithMessage(BATCH_PASTE_IMAGE_MESSAGES.uploadFailed);
  }

  const mimeType = matched[ONE_PADDING_BYTE] || "image/png";
  const data = matched[BASE64_BYTES_PER_CHUNK] || "";
  const binaryString = matched[TWO_PADDING_BYTES]
    ? window.atob(data)
    : decodeURIComponent(data);
  const bytes = new Uint8Array(
    Array.from(binaryString, (character) => character.codePointAt(ZERO)),
  );

  return createImageFile(new Blob([bytes], { type: mimeType }), index);
};

const requestBlobUrl = (source) =>
  new BrowserPromise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", source);
    request.responseType = "blob";
    request.addEventListener("load", () => {
      if (request.status >= HTTP_OK && request.status < HTTP_MULTIPLE_CHOICES) {
        resolve(request.response);
        return;
      }

      reject(createPasteImageError(BATCH_PASTE_IMAGE_MESSAGES.uploadFailed));
    });
    request.addEventListener("error", () => {
      reject(createPasteImageError(BATCH_PASTE_IMAGE_MESSAGES.uploadFailed));
    });
    request.send();
  });

const blobUrlToFile = async (source, index) => {
  const blob = await requestBlobUrl(source);
  if (blob.size > BATCH_PASTE_IMAGE_LIMITS.maxSize) {
    return rejectWithMessage(BATCH_PASTE_IMAGE_MESSAGES.sizeExceeded);
  }

  return createImageFile(blob, index);
};

const sourceToFile = async (source, index) => {
  if (/^data:image\//i.test(source)) {
    return dataUrlToFile(source, index);
  }

  if (/^blob:/i.test(source)) {
    return blobUrlToFile(source, index);
  }
};

const responseFailed = (response) =>
  !response ||
  response.err ||
  (Object.prototype.hasOwnProperty.call(response, "status") &&
    !response.status);

const getUploadContent = (response) => {
  if (responseFailed(response)) {
    return;
  }

  const content = response.content === undefined ? response : response.content;
  return Array.isArray(content) ? content[ZERO] : content;
};

const getDirectUploadUrl = (content) =>
  content.url ||
  content.downloadUrl ||
  content.fileUrl ||
  content.previewUrl ||
  "";

const getFilePreviewUrl = (content) =>
  content.fileId !== undefined &&
  content.fileId !== null &&
  content.fileId !== ""
    ? `/api/preview_file?id=${encodeURIComponent(content.fileId)}`
    : "";

export const getUploadImageUrl = (response) => {
  const content = getUploadContent(response);
  if (!content) {
    return "";
  }

  if (typeof content === "string") {
    return content;
  }

  return getDirectUploadUrl(content) || getFilePreviewUrl(content);
};

const uploadImageFile = async (file, uploadImage) => {
  if (!file || file.size > BATCH_PASTE_IMAGE_LIMITS.maxSize) {
    return rejectWithMessage(BATCH_PASTE_IMAGE_MESSAGES.sizeExceeded);
  }
  if (typeof uploadImage !== "function") {
    return rejectWithMessage(BATCH_PASTE_IMAGE_MESSAGES.uploadFailed);
  }

  const imageUrl = getUploadImageUrl(await uploadImage(file));
  if (!imageUrl) {
    return rejectWithMessage(BATCH_PASTE_IMAGE_MESSAGES.uploadFailed);
  }

  return imageUrl;
};

const parseHtml = (html) => {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
};

const escapeText = (text) =>
  String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const appendImageHtml = (container, imageUrls) => {
  const imageNodes = imageUrls.map((imageUrl) => {
    const image = document.createElement("img");
    image.setAttribute("src", imageUrl);
    return image;
  });

  container.append(...imageNodes);
};

const getLocalImageNodes = (container) =>
  [...container.querySelectorAll("img")].filter((image) =>
    IMAGE_SOURCE_REG.test(image.getAttribute("src") || ""),
  );

const collectLocalImageFiles = async (
  imageNodes,
  index = ZERO,
  collectedFiles = [],
) => {
  if (index >= imageNodes.length) {
    return collectedFiles;
  }

  return collectLocalImageFiles(imageNodes, index + ONE_PADDING_BYTE, [
    ...collectedFiles,
    await sourceToFile(imageNodes[index].getAttribute("src") || "", index),
  ]);
};

const uploadImageFiles = async (
  imageFiles,
  uploadImage,
  index = ZERO,
  imageUrls = [],
) => {
  if (index >= imageFiles.length) {
    return imageUrls;
  }

  return uploadImageFiles(imageFiles, uploadImage, index + ONE_PADDING_BYTE, [
    ...imageUrls,
    await uploadImageFile(imageFiles[index], uploadImage),
  ]);
};

const replaceLocalImageSources = (imageNodes, imageUrls, index = ZERO) => {
  if (index >= imageNodes.length) {
    return;
  }

  imageNodes[index].setAttribute("src", imageUrls[index]);
  replaceLocalImageSources(imageNodes, imageUrls, index + ONE_PADDING_BYTE);
};

export const prepareBatchPasteHtml = async (clipboardData, uploadImage) => {
  const html = getClipboardData(clipboardData, "text/html");
  const text = getClipboardData(clipboardData, "text/plain");
  const container = parseHtml(
    html || escapeText(text).replaceAll("\n", "<br>"),
  );
  const localImageNodes = getLocalImageNodes(container);
  const clipboardImageFiles = getClipboardImageFiles(clipboardData);
  const filesOnly = localImageNodes.length === ZERO ? clipboardImageFiles : [];
  const totalImageCount = localImageNodes.length + filesOnly.length;

  if (totalImageCount === ZERO) {
    return EMPTY_PASTE_HTML;
  }

  if (totalImageCount > BATCH_PASTE_IMAGE_LIMITS.maxCount) {
    return rejectWithMessage(BATCH_PASTE_IMAGE_MESSAGES.countExceeded);
  }

  const localImageFiles = await collectLocalImageFiles(localImageNodes);
  const imageUrls = await uploadImageFiles(
    [...localImageFiles.filter(Boolean), ...filesOnly],
    uploadImage,
  );

  replaceLocalImageSources(localImageNodes, imageUrls);

  if (filesOnly.length > ZERO) {
    appendImageHtml(container, imageUrls);
  }

  return {
    handled: true,
    html: container.innerHTML,
  };
};

const getBatchInputRoot = (target) => {
  if (!target || typeof target.closest !== "function") {
    return;
  }

  return target.closest("#text-input");
};

const getBatchInputEditor = (root) => {
  const froala = window.FroalaEditor;
  const instances =
    froala && Array.isArray(froala.INSTANCES) ? froala.INSTANCES : [];
  return (
    instances.find((editor) => editor && editor.el === root) ||
    instances.find(
      (editor) =>
        editor &&
        editor.$el &&
        typeof editor.$el.get === "function" &&
        editor.$el.get(ZERO) === root,
    )
  );
};

const stopPasteEvent = (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (typeof event.stopImmediatePropagation === "function") {
    event.stopImmediatePropagation();
  }
};

const insertPreparedPasteHtml = (editor, result) => {
  if (result && result.handled) {
    editor.html.insert(result.html);
  }

  return result;
};

const reportPasteImageError = (error) => {
  message.error(
    (error && error.message) || BATCH_PASTE_IMAGE_MESSAGES.uploadFailed,
  );
};

const handlePasteEvent = (event, uploadImage) => {
  const root = getBatchInputRoot(event.target);
  const clipboardData =
    event.clipboardData || window.clipboardData || undefined;
  if (!root || !hasBatchPasteImages(clipboardData)) {
    return;
  }

  const editor = getBatchInputEditor(root);
  if (!editor || !editor.html || typeof editor.html.insert !== "function") {
    return;
  }

  // 图片必须先换成服务端预览地址，避免大 base64 进入编辑器、预览解析和本地缓存。
  stopPasteEvent(event);

  prepareBatchPasteHtml(clipboardData, uploadImage)
    .then((result) => insertPreparedPasteHtml(editor, result))
    .catch(reportPasteImageError);
};

export const installBatchInputPasteImageHandler = (uploadImage) => {
  if (
    installState.pasteHandlerInstalled ||
    typeof document === "undefined" ||
    typeof window === "undefined"
  ) {
    return;
  }

  installState.pasteHandlerInstalled = true;
  document.addEventListener(
    "paste",
    (event) => handlePasteEvent(event, uploadImage),
    true,
  );
};
