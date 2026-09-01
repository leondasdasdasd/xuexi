import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import { Basket } from "./index";

const properties = {
  basketList: [],
  basketSubjectId: 2,
  count: 1,
  dispatch: jest.fn(),
};

describe("basket preview route boundary", () => {
  it("keeps the legacy detail route by default", () => {
    const basket = new Basket(properties);

    expect(basket.getDetailPath(2)).toBe("/detail/true/false/2");
  });

  it("allows newMyQuestion to inject the v2 paper editor route", () => {
    const basket = new Basket({
      ...properties,
      previewPathBuilder: (subjectId) => `/paperEditor?subjectId=${subjectId}`,
    });

    expect(basket.getDetailPath(2)).toBe("/paperEditor?subjectId=2");
  });

  it("keeps preview available without a grade context", () => {
    render(
      <MemoryRouter>
        <Basket
          {...properties}
          previewPathBuilder={(subjectId) =>
            `/paperEditor?subjectId=${subjectId}`
          }
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /预览组卷|Group and preview/ }),
    ).toHaveAttribute("href", "/paperEditor?subjectId=2");
  });

  it("does not expose question creation from the basket", () => {
    render(
      <MemoryRouter>
        <Basket {...properties} />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("link", { name: /新增题目|Add Question/ }),
    ).not.toBeInTheDocument();
  });
});
