export const FORMULA_SVG_SCALE = 1;
export const FORMULA_IMAGE_SELECTOR =
  'img[src*="math-svg"][data-math="inline"], img[src*="math-svg"][src*="display=inline"]';

const hasFormulaImageSize = (imageNode) =>
  Number.isFinite(imageNode.naturalWidth) &&
  Number.isFinite(imageNode.naturalHeight) &&
  imageNode.naturalWidth > 0 &&
  imageNode.naturalHeight > 0;

const syncFormulaImageSize = (imageNode) => {
  if (!hasFormulaImageSize(imageNode)) {
    return false;
  }

  imageNode.style.width = `${imageNode.naturalWidth * FORMULA_SVG_SCALE}px`;
  imageNode.style.height = `${imageNode.naturalHeight * FORMULA_SVG_SCALE}px`;
  return true;
};

export const syncFormulaImageSizes = (rootNode) => {
  if (
    !rootNode ||
    typeof rootNode.querySelectorAll !== "function" ||
    rootNode.querySelectorAll(FORMULA_IMAGE_SELECTOR).length === 0
  ) {
    return (cleanupToken) => {
      void cleanupToken;
    };
  }

  const cleanupEntries = [
    ...rootNode.querySelectorAll(FORMULA_IMAGE_SELECTOR),
  ].map((imageNode) => {
    const previousWidth = imageNode.style.width;
    const previousHeight = imageNode.style.height;
    const syncLoadedImageSize = (event) => {
      void event;
      syncFormulaImageSize(imageNode);
    };

    if (hasFormulaImageSize(imageNode)) {
      syncLoadedImageSize();
    } else if (typeof imageNode.addEventListener === "function") {
      imageNode.addEventListener("load", syncLoadedImageSize, { once: true });
    }

    return {
      imageNode,
      previousHeight,
      previousWidth,
      syncLoadedImageSize,
    };
  });

  return (cleanupToken) => {
    void cleanupToken;

    cleanupEntries.map(
      ({ imageNode, previousHeight, previousWidth, syncLoadedImageSize }) => {
        if (typeof imageNode.removeEventListener === "function") {
          imageNode.removeEventListener("load", syncLoadedImageSize);
        }
        imageNode.style.width = previousWidth;
        imageNode.style.height = previousHeight;
        return imageNode;
      },
    );
  };
};
