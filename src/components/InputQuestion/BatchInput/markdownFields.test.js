describe("batch input markdown fields", () => {
  let markdown;

  beforeAll(() => {
    markdown = require("../../../../public/markdown.js");
  });

  it("recognizes the misspelled Indictor label as subject literacy", () => {
    const tree = markdown.parse("学科素养Indictor：核心素养");

    expect(tree).toEqual([
      "markdown",
      ["indicator", "学科素养Indictor：核心素养"],
    ]);
  });

  it("recognizes the corrected Knowledge label", () => {
    const tree = markdown.parse("知识点Knowledge：函数");

    expect(tree).toEqual(["markdown", ["knowledge", "知识点Knowledge：函数"]]);
  });
});
