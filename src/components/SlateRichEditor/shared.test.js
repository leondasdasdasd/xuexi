import { scrollSelectionIntoView, suppressNextSelectionScroll } from "./shared";

const createDomRange = () => {
  const leafElement = { scrollIntoView: jest.fn() };
  return {
    domRange: { startContainer: { parentElement: leafElement } },
    leafElement,
  };
};

describe("scrollSelectionIntoView", () => {
  it("skips the Slate scroll caused by selecting or deleting an image", () => {
    const editor = {};
    const { domRange, leafElement } = createDomRange();

    suppressNextSelectionScroll(editor);
    scrollSelectionIntoView(editor, domRange);

    expect(leafElement.scrollIntoView).not.toHaveBeenCalled();
  });

  it("keeps normal text selections visible after consuming the suppression", () => {
    const editor = {};
    const { domRange, leafElement } = createDomRange();

    suppressNextSelectionScroll(editor);
    scrollSelectionIntoView(editor, domRange);
    scrollSelectionIntoView(editor, domRange);

    expect(leafElement.scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      inline: "nearest",
    });
  });
});
