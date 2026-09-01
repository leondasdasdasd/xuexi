import { render, screen, within } from "@testing-library/react";
import React from "react";

import LocalQuickNavigation from ".";

describe("LocalQuickNavigation", () => {
  it("provides local list shortcuts in new tabs", () => {
    render(<LocalQuickNavigation />);

    expect(
      screen.getByRole("button", { name: "本地快捷导航" }),
    ).toBeInTheDocument();

    const navigation = screen.getByRole("navigation", {
      name: "列表快捷入口",
    });
    const expectedLinks = [
      ["试卷列表", "#/testPaperManagement"],
      ["测验列表", "#/examAnalysis"],
      ["题库列表", "#/V2QuestionList"],
      ["自适应学习", "#/adaptive-learning"],
    ];

    for (const [name, href] of expectedLinks) {
      const link = within(navigation).getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
