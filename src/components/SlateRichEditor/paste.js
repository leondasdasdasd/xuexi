import { uploadHtmlImage } from "./imageUpload";

const SLATE_FRAGMENT_MIME = "application/x-slate-fragment";
const NON_CONTENT_SELECTOR = "style,script,meta,link,xml,title,head";

export const getEventClipboardData = (event) =>
  event.clipboardData ||
  (event.nativeEvent && event.nativeEvent.clipboardData) ||
  null;

export const getClipboardData = (clipboardData, type) => {
  try {
    return clipboardData ? clipboardData.getData(type) || "" : "";
  } catch {
    return "";
  }
};

const isImageFile = (file) =>
  !!(file && file.type && file.type.indexOf("image/") === 0);

const getFileDedupKey = (file) =>
  [file.name || "", file.type || "", file.size || 0].join("|");

export const getClipboardImageFiles = (clipboardData) => {
  if (!clipboardData) {
    return [];
  }

  const files = [];
  const seen = new Set();
  const addFile = (file) => {
    if (!isImageFile(file)) {
      return;
    }

    const key = getFileDedupKey(file);
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    files.push(file);
  };

  for (const item of clipboardData.items || []) {
    if (
      !item ||
      item.kind !== "file" ||
      !item.type ||
      item.type.indexOf("image/") !== 0
    ) {
      continue;
    }

    try {
      addFile(item.getAsFile && item.getAsFile());
    } catch {
      // Ignore unreadable clipboard items and continue with other image files.
    }
  }

  if (files.length === 0) {
    [...(clipboardData.files || [])].forEach(addFile);
  }

  return files;
};

export const hasSlateFragment = (clipboardData) => {
  const types =
    clipboardData && clipboardData.types ? [...clipboardData.types] : [];
  if (types.includes(SLATE_FRAGMENT_MIME)) {
    return true;
  }

  if (getClipboardData(clipboardData, SLATE_FRAGMENT_MIME)) {
    return true;
  }

  return getClipboardData(clipboardData, "text/html").includes(
    "data-slate-fragment",
  );
};

export const prepareExternalHtml = (html, uploadImage) => {
  const source = String(html || "");
  if (!source || typeof DOMParser === "undefined") {
    return Promise.resolve(source);
  }

  const parser = new DOMParser();
  const document_ = parser.parseFromString(
    `<!doctype html><body>${source}</body>`,
    "text/html",
  );
  for (const node of document_.body.querySelectorAll(NON_CONTENT_SELECTOR)) {
    if (node.parentNode) {
      node.remove();
    }
  }
  const images = [...document_.body.querySelectorAll("img")];

  return Promise.all(
    images.map((image, index) =>
      uploadHtmlImage(image.getAttribute("src") || "", uploadImage, index).then(
        (imageUrl) => {
          if (imageUrl) {
            image.setAttribute("src", imageUrl);
            return;
          }

          if (image.parentNode) {
            image.remove();
          }
        },
      ),
    ),
  ).then(() => document_.body.innerHTML);
};
