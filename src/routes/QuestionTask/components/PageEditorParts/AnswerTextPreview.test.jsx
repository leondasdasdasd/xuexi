import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import AnswerTextPreview from "./AnswerTextPreview";
import { buildAnswerSheetPreviewHtml } from "./answerSheetMarkdownRenderer";

const MARKDOWN_WITH_TABLE_AND_MATH = `
# 参考答案

<table><tr><td>题号</td><td>1</td><td>2</td></tr><tr><td>答案</td><td>A</td><td>B</td></tr></table>

12. $x^2 + 1$

$$
\\frac{1}{2}
$$
`;

describe("AnswerTextPreview", () => {
  it("renders markdown tables and KaTeX formulas from answerSheetMarkdown", () => {
    render(
      <AnswerTextPreview markdown={MARKDOWN_WITH_TABLE_AND_MATH} pages={[]} />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("题号")).toBeInTheDocument();
    expect(screen.getByText("答案")).toBeInTheDocument();
    expect(screen.queryByText("$x^2 + 1$")).not.toBeInTheDocument();
  });

  it("renders preview html without placeholder regex transforms", () => {
    const previewMarkup = buildAnswerSheetPreviewHtml(
      MARKDOWN_WITH_TABLE_AND_MATH,
    );

    expect(previewMarkup).toContain("<table>");
    expect(previewMarkup).toContain('class="katex"');
    expect(previewMarkup).toContain(
      '<annotation encoding="application/x-tex">x^2 + 1</annotation>',
    );
    expect(previewMarkup).toContain(
      '<annotation encoding="application/x-tex">',
    );
    expect(previewMarkup).toContain("\\frac{1}{2}");
    expect(previewMarkup).not.toContain("data-katex-placeholder");
    expect(previewMarkup).not.toContain("$x^2 + 1$");
  });

  it("renders mathUrl formula images in text preview pages", () => {
    render(
      <AnswerTextPreview
        markdown='<img src="https://example.com/formula.png?mathUrl=x%5E2%2B1" alt="x^2+1">'
        pages={[]}
      />,
    );

    const formulaImage = screen.getByRole("img", { name: "x^2+1" });
    fireEvent.load(formulaImage);

    expect(formulaImage).toBeInTheDocument();
    expect(formulaImage).toHaveAttribute(
      "src",
      expect.stringContaining("mathUrl="),
    );
  });

  it("keeps svg formula semantics in markdown preview html", () => {
    render(
      <AnswerTextPreview
        markdown={
          '<img class="math-inline" data-math="inline" src="https://ai.daily.yungu-inc.org/center/api/custom-services/document-render/api/math-svg?mathUrl=x%5E2%2B1&display=inline" alt="x^2+1">'
        }
        pages={[]}
      />,
    );

    const formulaImage = screen.getByRole("img", { name: "x^2+1" });

    expect(formulaImage).toHaveAttribute("class", "math-inline");
    expect(formulaImage).toHaveAttribute("data-math", "inline");
    expect(formulaImage).toHaveAttribute(
      "src",
      expect.stringContaining("/api/math-svg?"),
    );
  });
});
