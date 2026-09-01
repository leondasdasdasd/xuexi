import {
  buildPaperEditorEditPath,
  buildPaperEditorPreviewPath,
  parsePaperEditorPageContext,
  parsePaperEditorSearch,
} from "../paperEditorPageContext";

describe("paper editor page context", () => {
  it.each([
    [{ subjectId: "2" }, { mode: "create", subjectId: 2 }],
    [
      { mode: "edit", paperId: "11" },
      { mode: "edit", paperId: 11 },
    ],
    [
      { mode: "preview", paperId: "12" },
      { mode: "preview", paperId: 12 },
    ],
  ])("parses an authoritative page context", (query, expected) => {
    expect(parsePaperEditorPageContext(query)).toEqual(expected);
  });

  it.each([
    {},
    { subjectId: "0" },
    { mode: "edit" },
    { mode: "preview", paperId: "bad" },
    { mode: "create", subjectId: "2" },
    { mode: "unknown", paperId: "1" },
  ])("rejects an invalid parameter combination", (query) => {
    expect(parsePaperEditorPageContext(query)).toBeUndefined();
  });

  it("parses the router search as the authoritative context", () => {
    expect(parsePaperEditorSearch("?mode=preview&paperId=12")).toEqual({
      mode: "preview",
      paperId: 12,
    });
  });
});

it("builds the authoritative paper edit path", () => {
  expect(buildPaperEditorEditPath(99)).toBe(
    "/paperEditor?mode=edit&paperId=99",
  );
});

it("builds the authoritative read-only paper detail path", () => {
  expect(buildPaperEditorPreviewPath(11_290)).toBe(
    "/paperEditor?mode=preview&paperId=11290",
  );
});
