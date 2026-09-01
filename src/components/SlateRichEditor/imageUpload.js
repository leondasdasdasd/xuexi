const IMAGE_MIME_EXTENSIONS = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const normalizeExternalImageSrc = (source_) => {
  const source = String(source_ || "").trim();
  if (
    source.indexOf("//") === 0 &&
    typeof window !== "undefined" &&
    window.location
  ) {
    return `${window.location.protocol}${source}`;
  }
  return source;
};

export const isUploadableImageSrc = (source) =>
  /^data:image\//i.test(source) ||
  /^blob:/i.test(source) ||
  /^https?:\/\//i.test(source);

const getImageFileExtension = (mimeType, source) => {
  if (IMAGE_MIME_EXTENSIONS[mimeType]) {
    return IMAGE_MIME_EXTENSIONS[mimeType];
  }

  try {
    const pathname = new URL(source, window.location.href).pathname;
    const matched = pathname.match(/\.([\da-z]+)$/i);
    if (matched && matched[1]) {
      return matched[1].toLowerCase();
    }
  } catch {
    // Ignore malformed source URLs and fall back to the mime type default.
  }

  return "png";
};

export const createImageFile = (blob, source, index) => {
  const type = blob.type || "image/png";
  const extension = getImageFileExtension(type, source);
  const name = `pasted-image-${Date.now()}-${index}.${extension}`;
  if (typeof File === "function") {
    return new File([blob], name, { type });
  }

  blob.name = name;
  return blob;
};

export const uploadImageFiles = (files, uploadImage) => {
  const imageFiles = Array.isArray(files) ? files : [];
  if (imageFiles.length === 0) {
    return Promise.resolve([]);
  }

  if (typeof uploadImage !== "function") {
    return Promise.resolve(imageFiles.map(() => ""));
  }

  return Promise.all(
    imageFiles.map((file) =>
      Promise.resolve(uploadImage(file))
        .then((imageUrl) => imageUrl || "")
        .catch(() => ""),
    ),
  );
};

export const uploadHtmlImage = (source_, uploadImage, index) => {
  const source = normalizeExternalImageSrc(source_);
  if (
    !source ||
    !isUploadableImageSrc(source) ||
    typeof uploadImage !== "function" ||
    typeof fetch !== "function"
  ) {
    return Promise.resolve("");
  }

  return fetch(source)
    .then((response) => {
      if (!response.ok) {
        throw new Error("image fetch failed");
      }
      return response.blob();
    })
    .then((blob) => {
      if (blob.type && blob.type.indexOf("image/") !== 0) {
        throw new Error("clipboard image type is invalid");
      }
      return uploadImageFiles(
        [createImageFile(blob, source, index)],
        uploadImage,
      );
    })
    .then((imageUrls) => imageUrls[0] || "")
    .catch(() => "");
};
