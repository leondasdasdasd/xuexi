/**
 * @jest-environment node
 */

import fs from "node:fs";
import path from "node:path";

const styleSource = fs.readFileSync(
  path.join(__dirname, "index.module.less"),
  "utf8",
);

describe("two-way test delete operation layout", () => {
  it("uses one fixed operation column without cell margin compensation", () => {
    expect(styleSource).toContain("@delete-operation-column-width: 7rem;");
    expect(
      styleSource.match(/grid-template-columns: @question-row-columns;/g),
    ).toHaveLength(3);
    expect(styleSource).not.toContain("minmax(5rem, 8fr)");

    const deleteCellRule = styleSource.match(
      /\.delete-operation-cell\s*\{(?<rule>[\s\S]*?)\n\s*\}/,
    )?.groups?.rule;

    expect(deleteCellRule).toContain("width: 100%;");
    expect(deleteCellRule).not.toMatch(/margin-(?:left|right)/);
    expect(styleSource).toContain(
      "padding-right: @delete-operation-column-width;",
    );
    expect(styleSource).toContain("right: 0;");
  });

  it("left-aligns the association actions within their shared column", () => {
    const associationCellRule = styleSource.match(
      /\.associationOperationCell\s*\{(?<rule>[\s\S]*?)\n\s*\}/,
    )?.groups?.rule;

    expect(associationCellRule).toContain("justify-content: flex-start;");
    expect(associationCellRule).not.toContain("justify-content: center;");
  });
});
