import { FORMULA_SVG_SCALE, syncFormulaImageSizes } from "./formulaImageSizing";

const createFormulaImage = ({ height, loaded = true, width }) => {
  const imageNode = document.createElement("img");
  imageNode.dataset.math = "inline";
  imageNode.setAttribute(
    "src",
    "https://ai.yungu.org/center/api/custom-services/document-render/api/math-svg?mathUrl=x&display=inline",
  );
  Object.defineProperty(imageNode, "naturalWidth", {
    configurable: true,
    value: loaded ? width : 0,
  });
  Object.defineProperty(imageNode, "naturalHeight", {
    configurable: true,
    value: loaded ? height : 0,
  });
  return imageNode;
};

const setFormulaImageSize = (imageNode, { height, width }) => {
  Object.defineProperty(imageNode, "naturalWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(imageNode, "naturalHeight", {
    configurable: true,
    value: height,
  });
};

describe("syncFormulaImageSizes", () => {
  it("scales inline math SVG images by the same fixed ratio", () => {
    const rootNode = document.createElement("div");
    const triangleImage = createFormulaImage({ height: 12, width: 53 });
    const angleImage = createFormulaImage({ height: 16, width: 64 });
    const fractionImage = createFormulaImage({ height: 20, width: 13 });
    rootNode.append(triangleImage, angleImage, fractionImage);

    syncFormulaImageSizes(rootNode);

    expect(triangleImage.style.width).toBe(`${53 * FORMULA_SVG_SCALE}px`);
    expect(triangleImage.style.height).toBe(`${12 * FORMULA_SVG_SCALE}px`);
    expect(angleImage.style.width).toBe(`${64 * FORMULA_SVG_SCALE}px`);
    expect(angleImage.style.height).toBe(`${16 * FORMULA_SVG_SCALE}px`);
    expect(fractionImage.style.width).toBe(`${13 * FORMULA_SVG_SCALE}px`);
    expect(fractionImage.style.height).toBe(`${20 * FORMULA_SVG_SCALE}px`);
  });

  it("syncs the SVG size after image load", () => {
    const rootNode = document.createElement("div");
    const imageNode = createFormulaImage({
      height: 20,
      loaded: false,
      width: 13,
    });
    rootNode.append(imageNode);

    syncFormulaImageSizes(rootNode);
    setFormulaImageSize(imageNode, { height: 20, width: 13 });
    imageNode.dispatchEvent(new Event("load"));

    expect(imageNode.style.width).toBe(`${13 * FORMULA_SVG_SCALE}px`);
    expect(imageNode.style.height).toBe(`${20 * FORMULA_SVG_SCALE}px`);
  });

  it("restores image dimensions during cleanup", () => {
    const rootNode = document.createElement("div");
    const imageNode = createFormulaImage({ height: 12, width: 53 });
    imageNode.style.width = "10px";
    imageNode.style.height = "8px";
    rootNode.append(imageNode);

    const cleanup = syncFormulaImageSizes(rootNode);
    cleanup();

    expect(imageNode.style.width).toBe("10px");
    expect(imageNode.style.height).toBe("8px");
  });
});
