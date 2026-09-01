/** @jest-environment node */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ResourceQuestionTypeLabel from "./ResourceQuestionTypeLabel";

const questionTypes = [
  {
    businessQuestionTypeId: 201,
    label: "阅读题",
  },
];

describe("ResourceQuestionTypeLabel", () => {
  it("renders a custom type matched by business question type id", () => {
    const view = renderToStaticMarkup(
      <ResourceQuestionTypeLabel
        businessQuestionTypeId={201}
        questionTypes={questionTypes}
      />,
    );

    expect(view).toContain("阅读题");
  });

  it("does not fall back to a legacy type name for an unknown id", () => {
    const view = renderToStaticMarkup(
      <ResourceQuestionTypeLabel
        businessQuestionTypeId={6}
        questionTypes={questionTypes}
      />,
    );

    expect(view).not.toContain("组合题");
  });
});
