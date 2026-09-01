import { getAssociationParentContent } from "./associationContext";

describe("DetailView association context", () => {
  it("returns parent content from association context", () => {
    expect(
      getAssociationParentContent({
        associationContext: {
          parentContent: "<p>组合题父题题干</p>",
        },
      }),
    ).toBe("<p>组合题父题题干</p>");
  });

  it("returns undefined when parent content is missing", () => {
    expect(
      getAssociationParentContent({ associationContext: {} }),
    ).toBeUndefined();
    expect(getAssociationParentContent({})).toBeUndefined();
    expect(getAssociationParentContent()).toBeUndefined();
  });
});
