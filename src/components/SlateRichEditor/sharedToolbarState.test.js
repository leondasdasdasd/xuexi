import { createEditor } from "slate";

import {
  buildSharedToolbarController,
  isSameSharedToolbarState,
} from "./sharedToolbarState";

describe("SlateRichEditor shared toolbar state", () => {
  it("keeps equivalent controllers stable and detects editor changes", () => {
    const firstEditor = createEditor();
    const secondEditor = createEditor();
    const firstController = buildSharedToolbarController({
      editor: firstEditor,
    });

    expect(
      isSameSharedToolbarState(
        firstController,
        buildSharedToolbarController({ editor: firstEditor }),
      ),
    ).toBe(true);
    expect(
      isSameSharedToolbarState(
        firstController,
        buildSharedToolbarController({ editor: secondEditor }),
      ),
    ).toBe(false);
  });
});
