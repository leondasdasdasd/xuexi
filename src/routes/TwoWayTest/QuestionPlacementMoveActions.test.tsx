/** @jest-environment node */

import { renderToStaticMarkup } from "react-dom/server";

import QuestionPlacementMoveActions from "./QuestionPlacementMoveActions";

jest.mock("../../utils/i18n", () => ({
  trans: (key: string) => (key === "global.moveUp" ? "Move up" : "Move down"),
}));

describe("QuestionPlacementMoveActions", () => {
  it("renders bilingual accessible actions with boundary disabled states", () => {
    const view = renderToStaticMarkup(
      <QuestionPlacementMoveActions
        canMoveDown
        canMoveUp={false}
        onMoveDown={jest.fn()}
        onMoveUp={jest.fn()}
      />,
    );

    expect(view).toContain('aria-label="Move up"');
    expect(view).toContain('aria-label="Move down"');
    expect(view).toContain("iconfont");
    expect(view).toContain("\ueb0b");
    expect(view).toContain("\ueb0a");
    expect(view).toMatch(/aria-label="Move up"[^>]*disabled=""/);
  });

  it("calls the enabled direction callbacks", () => {
    const onMoveDown = jest.fn();
    const onMoveUp = jest.fn();
    const action = QuestionPlacementMoveActions({
      canMoveDown: true,
      canMoveUp: true,
      onMoveDown,
      onMoveUp,
    });

    action.props.children[0].props.onClick({ stopPropagation: jest.fn() });
    action.props.children[1].props.onClick({ stopPropagation: jest.fn() });

    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });
});
